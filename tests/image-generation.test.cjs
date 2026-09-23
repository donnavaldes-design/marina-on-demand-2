const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createImageService}=require('../images/service');
function fixture(){
 const messages=[],attachments=[],assets=[],calls=[];
 let provider={status:'completed',output:[{type:'image_generation_call',result:Buffer.from('test PNG').toString('base64'),usage:{output_tokens:3}}],usage:{total_tokens:5}},storageFail=false;
 const copy=x=>JSON.parse(JSON.stringify(x));
 async function sbRest(path,opts={}){
  const [table,query]=path.split('?'),q=new URLSearchParams(query),rows={messages,message_attachments:attachments,workspace_items:assets}[table];
  const matches=r=>[...q].every(([k,v])=>!v.startsWith('eq.')||r[k]===v.slice(3));
  if(opts.method==='POST'){
   const data=JSON.parse(opts.body);for(const row of data){const old=rows.find(x=>x.id===row.id);if(!old)rows.push(copy(row));else if(!opts.headers?.Prefer?.includes('ignore-duplicates'))Object.assign(old,copy(row));}return [];
  }
  if(opts.method==='PATCH'){for(const row of rows.filter(matches))Object.assign(row,JSON.parse(opts.body));return [];}
  let result=rows.filter(matches);if(q.get('order'))result=result.slice().reverse();if(q.get('limit'))result=result.slice(0,+q.get('limit'));return copy(result);
 }
 const service=createImageService({sbRest,saveMessage:async(user_id,conversation_id,role,content,extra)=>{const m={id:'m'+(messages.length+1),user_id,conversation_id,role,content,...extra};messages.push(m);return copy(m);},sign:async p=>'https://private.example/'+p,hydrate:async rows=>rows.map(a=>({...a,signed_url:'https://private.example/'+a.storage_path})),storageHeaders:()=>({}),fetcher:async(url,opts)=>{calls.push({url,...opts});if(url.includes('/storage/'))return {ok:!storageFail};if(opts.method==='POST')return {ok:true,json:async()=>({id:'resp_1',status:'queued',model:'parent'})};return {ok:true,json:async()=>copy(provider)};}});
 return {service,messages,attachments,assets,calls,setProvider:v=>provider=v,setStorageFail:v=>storageFail=v};
}
const input={userId:'alice',conversationId:'chat1',args:{prompt:'A rose on a teal background',size:'1024x1024',reference:'none'}};
test('starts one medium quality background image and persists its tracking ID',async()=>{
 const f=fixture(),r=await f.service.start(input);assert.equal(r.imageJob.status,'pending');
 const body=JSON.parse(f.calls[0].body);assert.equal(body.background,true);assert.equal(body.max_tool_calls,1);assert.equal(body.tools[0].quality,'medium');assert.equal(body.tools[0].action,'generate');assert.equal(f.messages[0].usage.image_job.response_id,'resp_1');
});
test('completion stores private attachment, usage and an idempotent saved asset',async()=>{
 const f=fixture(),r=await f.service.start(input);const done=await f.service.status('alice',r.assistantMessageId);
 assert.equal(done.imageJob.status,'completed');assert.equal(done.imageJob.image_usage.output_tokens,3);assert.equal(done.attachments[0].storage_path,'alice/generated/m1.png');
 await f.service.status('alice','m1');await f.service.save('alice','m1');await f.service.save('alice','m1');
 assert.equal(f.assets.length,1);assert.equal(f.assets[0].section,'assets');assert.equal(f.calls.filter(x=>x.method==='POST'&&x.url.includes('openai.com')).length,1);assert.equal(f.calls.filter(x=>x.url.includes('/storage/')).length,1);
});
test('another user cannot read or save an image',async()=>{
 const f=fixture();await f.service.start(input);await assert.rejects(f.service.status('bob','m1'),/not found/);await assert.rejects(f.service.save('bob','m1'),/not found/);assert.equal(f.calls.length,1);
});
test('reference paths reject cross-account and traversal before provider requests',async()=>{
 for(const storagePath of ['bob/a.png','alice/../bob/a.png','alice/%2e%2e/a.png','alice/a?x=1']){
 const f=fixture();await assert.rejects(f.service.start({...input,args:{...input.args,reference:'uploads'},attachments:[{storagePath,mimeType:'image/png',sizeBytes:5}]}),/belong/);assert.equal(f.calls.length,0);
 }
});
test('latest and selected edits use only images in the current owned conversation',async()=>{
 const f=fixture();f.attachments.push({id:'a',user_id:'alice',conversation_id:'chat1',message_id:'previous',storage_path:'alice/a.png',mime_type:'image/png',size_bytes:5},{id:'b',user_id:'bob',conversation_id:'chat1',storage_path:'bob/a.png'},{id:'c',user_id:'alice',conversation_id:'other',storage_path:'alice/c.png'});
 await f.service.start({...input,args:{...input.args,reference:'latest'},referenceMessageId:'previous'});
 const body=JSON.parse(f.calls[0].body);assert.equal(body.tools[0].action,'edit');assert.equal(body.input[0].content[1].image_url,'https://private.example/alice/a.png');
 await assert.rejects(f.service.start({...input,args:{...input.args,reference:'latest'},referenceMessageId:'someone-elses'}),/Upload an image/);
});
test('storage failure can retry saving the same generation without a second paid request',async()=>{
 const f=fixture();await f.service.start(input);f.setStorageFail(true);await assert.rejects(f.service.status('alice','m1'),/could not be saved/);assert.equal(f.messages[0].usage.image_job.status,'pending');
 f.setStorageFail(false);assert.equal((await f.service.status('alice','m1')).imageJob.status,'completed');assert.equal(f.calls.filter(c=>c.method==='POST'&&c.url.includes('openai.com')).length,1);
});
test('queued status stays pending, refusal is terminal and creates no attachment',async()=>{
 const f=fixture();await f.service.start(input);f.setProvider({status:'in_progress'});assert.equal((await f.service.status('alice','m1')).imageJob.status,'pending');
 f.setProvider({status:'completed',output:[{content:[{type:'refusal',refusal:'Please revise this request.'}]}]});assert.equal((await f.service.status('alice','m1')).imageJob.status,'failed');assert.equal(f.attachments.length,0);await assert.rejects(f.service.save('alice','m1'),/Wait/);
});
test('missing, excessive, and oversized references fail before generating',async()=>{
 for(const attachments of [[],Array.from({length:4},()=>({storagePath:'alice/a.png',mimeType:'image/png',sizeBytes:1})),[{storagePath:'alice/a.png',mimeType:'image/png',sizeBytes:11*1024*1024}]]){
 const f=fixture();await assert.rejects(f.service.start({...input,args:{...input.args,reference:'uploads'},attachments}));assert.equal(f.calls.length,0);
 }
});
