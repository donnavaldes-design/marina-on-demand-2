const {test}=require('node:test');const assert=require('node:assert/strict');
const {createPdfService}=require('../pdf/service.cjs');
const uid='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',mid='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
test('only owned assistant messages are exported; retry reuses saved PDF',async()=>{
 let saved,uploads=0,renders=0;const queries=[];
 const service=createPdfService({sbRest:async(q,o)=>{queries.push(q);if(q.startsWith('messages?'))return [{id:mid,conversation_id:'chat',content:'# Report\nEvidence'}];if(q.startsWith('workspace_items?id='))return saved?[saved]:[];saved=JSON.parse(o.body)[0];return [];},sign:async p=>'signed:'+p,storageHeaders:()=>({}),render:async()=>{renders++;return Buffer.from('%PDF-test')},fetcher:async()=>{uploads++;return {ok:true}}});
 const first=await service.exportMessage(uid,mid),second=await service.exportMessage(uid,mid);assert.deepEqual(first,second);assert.equal(uploads,1);assert.equal(renders,1);assert.equal(saved.user_id,uid);assert.equal(saved.section,'assets');assert.match(queries[0],/user_id=eq.aaaaaaaa/);assert.match(queries[0],/role=eq.assistant/);
});
test('missing message and foreign file paths cannot be exported',async()=>{
 let uploaded=false;const service=createPdfService({sbRest:async q=>q.startsWith('messages')?[]:[{metadata:{generated_pdf:true,storage_path:'other/pdf/file.pdf'}}],sign:()=>assert.fail('must not sign'),storageHeaders:()=>({}),fetcher:async()=>{uploaded=true}});
 await assert.rejects(service.exportMessage(uid,mid),/not found/);await assert.rejects(service.download(uid,mid),/not found/);assert.equal(uploaded,false);
});
test('failed uploads do not create a saved asset',async()=>{
 const service=createPdfService({sbRest:async(q,o)=>{assert.equal(o,undefined);return q.startsWith('messages')?[{id:mid,content:'Example'}]:[]},sign:()=>assert.fail(),storageHeaders:()=>({}),render:async()=>Buffer.from('pdf'),fetcher:async()=>({ok:false})});
 await assert.rejects(service.exportMessage(uid,mid),/could not be saved/);
});
