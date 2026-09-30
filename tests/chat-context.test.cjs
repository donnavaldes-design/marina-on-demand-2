const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const api=fs.readFileSync(require('node:path').join(__dirname,'../api.js'),'utf8');
const fn=api.slice(api.indexOf('async function getRecentMessages('),api.indexOf('\nasync function getMemory('));
function fixture(messages=[],files=[],fail=false){
  const calls=[],signed=[];
  const ctx=vm.createContext({encodeURIComponent,Set,
    isImageMime:m=>m.startsWith('image/'),
    createAttachmentSignedUrl:async path=>{signed.push(path);if(fail)throw Error('missing');return 'https://storage.test/fresh/'+path;},
    sbRest:async query=>{
      calls.push(query);const p=new URLSearchParams(query.split('?')[1]);
      let rows=(query.startsWith('messages?')?messages:files).filter(r=>'eq.'+r.user_id===p.get('user_id')&&'eq.'+r.conversation_id===p.get('conversation_id'));
      rows.sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
      if(p.get('order').startsWith('created_at.desc'))rows.reverse();
      return rows.slice(0,Number(p.get('limit'))).map(r=>({...r}));
    }});
  vm.runInContext(fn,ctx);
  return {run:()=>ctx.getRecentMessages('owner','chat'),calls,signed};
}
const msg=(i,extra={})=>({id:'m'+String(i).padStart(3,'0'),user_id:'owner',conversation_id:'chat',created_at:new Date(1700000000000+i*1000).toISOString(),role:i%2?'assistant':'user',content:'draft '+i,...extra});
const file=(i,extra={})=>({id:'f'+i,user_id:'owner',conversation_id:'chat',message_id:'m002',created_at:msg(i).created_at,storage_bucket:'marina-attachments',storage_path:'owner/transcript'+i+'.txt',file_name:'transcript'+i+'.txt',mime_type:'text/plain',...extra});
test('52-message chat sends the latest 24 in chronological order, retaining the current draft',async()=>{
 const f=fixture(Array.from({length:52},(_,i)=>msg(i)));const result=await f.run();
 assert.equal(result.length,24);assert.equal(result[0].content,'draft 28');assert.equal(result.at(-1).content,'draft 51');
});
test('follow-up includes the saved transcript on its original message with a fresh URL',async()=>{
 const f=fixture([msg(2),msg(3)],[file(2)]);const result=await f.run();
 assert.equal(result[0].content[0].text,'draft 2');assert.equal(result[0].content.at(-1).type,'input_file');
 assert.equal(result[0].content.at(-1).file_url,'https://storage.test/fresh/owner/transcript2.txt');assert.equal(result[1].content,'draft 3');
});
test('pasted transcript survives beyond the recent window without replacing the latest draft',async()=>{
 const messages=Array.from({length:52},(_,i)=>msg(i));messages[2].content='PASTED TRANSCRIPT '+ 'source '.repeat(400);
 const result=await fixture(messages).run();assert.match(result[0].content[0].text,/PASTED TRANSCRIPT/);assert.match(result[0].content[0].text,/not a new request/);assert.equal(result.at(-1).content,'draft 51');
});
test('old pasted references are bounded and truncation is explicit',async()=>{
 const messages=Array.from({length:52},(_,i)=>msg(i));for(const i of [0,2,4,6])messages[i].content='x'.repeat(61000);
 const result=await fixture(messages).run();assert.equal(result.length,27);assert.match(result[0].content[0].text,/excerpt truncated/);
});
test('source remains available after its upload message leaves the history window',async()=>{
 const f=fixture(Array.from({length:52},(_,i)=>msg(i)),[file(2)]);const result=await f.run();
 assert.equal(result[0].content.at(-1).type,'input_file');assert.equal(result.at(-1).content,'draft 51');assert.match(result[0].content[0].text,/not a new request/);
});
test('saved image is sent as vision input, not just a filename',async()=>{
 const f=fixture([msg(2)],[file(2,{mime_type:'image/png'})]);const result=await f.run();assert.equal(result[0].content.at(-1).type,'input_image');
});
test('another member or conversation cannot contribute messages or attachments',async()=>{
 const f=fixture([msg(2),msg(3,{user_id:'other'}),msg(4,{conversation_id:'elsewhere'})],[file(2,{user_id:'other'}),file(3,{conversation_id:'elsewhere'}),file(4,{storage_path:'other/file'}),file(5,{storage_path:'owner/../other/file'})]);
 const result=await f.run();assert.equal(result.length,1);assert.equal(result[0].content,'draft 2');assert.equal(f.signed.length,0);
});
test('repeated uploads are deduplicated and attachment context is bounded to the latest five files',async()=>{
 const files=Array.from({length:8},(_,i)=>file(i));files.push(file(9,{storage_path:'owner/transcript7.txt'}));
 const f=fixture([],files);await f.run();assert.equal(f.signed.length,5);assert.equal(new Set(f.signed).size,5);assert.equal(f.signed.at(-1),'owner/transcript7.txt');assert.ok(!f.signed.includes('owner/transcript0.txt'));
});
test('missing saved file preserves the latest draft and reports unavailable source explicitly',async()=>{
 const f=fixture([msg(2),msg(3)],[file(2)],true);const result=await f.run();assert.equal(result.at(-1).content,'draft 3');assert.match(result[0].content.at(-1).text,/could not be reopened/);
});
