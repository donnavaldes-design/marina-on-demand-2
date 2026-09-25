const {test}=require('node:test');const assert=require('node:assert/strict');
const {createService}=require('../google/service');const manifest=require('../google/manifest');
function fixture(key='google_drive'){
 let step=null;const calls=[];const c={integration_key:key,status:'connected',permission_mode:'view_and_take_action',oauth_scope:manifest.scopesForMode(key,'view_and_take_action').join(' '),token_expires_at:new Date(Date.now()+3600000).toISOString()};
 const sbRest=async(path,opts={})=>{if(path.startsWith('user_connections'))return [c];if(path.startsWith('action_steps')){if(!path.includes('user_id=eq.owner'))return [];if(!opts.method)return step?[step]:[];const patch=JSON.parse(opts.body);if(path.includes('approval_status=eq.pending')&&step.approval_status!=='pending')return [];Object.assign(step,patch);return [step];}throw Error(path)};
 const service=createService(key,{sbRest,sbRpc:async()=>true,getSecret:async()=> 'token',getRefreshSecret:async()=>'',loadAttachment:async(user,id)=>{assert.equal(user,'owner');if(id!=='owned-file')throw Error('File not found');return {bytes:Buffer.from('image-bytes'),mimeType:'image/png'}},fetchImpl:async(url,opts)=>{calls.push({url,...opts});return {ok:true,status:200,json:async()=>key==='gmail'?{id:'draft',message:{id:'m'}}:{id:'doc',name:'Test',webViewLink:'https://docs.google.com/document/d/doc/edit'}}}});
 const prepare=(operation,params)=>service.execute('owner',{operation,parameters_json:JSON.stringify(params)},{runId:'run',nextActionStepOrder:async()=>1,insertActionStep:async s=>(step={...s,id:'step'})});
 return {service,c,calls,prepare,get step(){return step}};
}
test('Doc export queues exact content, uploads only after approval, and returns open link',async()=>{
 const f=fixture();await f.prepare('create_document',{name:'My email plan',content:'Exact original content'});assert.equal(f.calls.length,0);assert.match(f.step.description,/My Drive/);const result=await f.service.approve('owner','step','approve');assert.equal(result.ok,true);assert.equal(f.calls.length,1);assert.match(f.calls[0].url,/upload\/drive\/v3\/files/);assert.match(f.calls[0].body.toString(),/application\/vnd.google-apps.document/);assert.match(f.calls[0].body.toString(),/Exact original content/);assert.match(result.result.receipt.url,/docs.google.com/);await f.service.approve('owner','step','approve');assert.equal(f.calls.length,1);
});
test('Drive scope upgrade required, View Only protected, another user cannot approve',async()=>{
 const f=fixture();f.c.oauth_scope=manifest.providers.google_drive.readScopes.join(' ');assert.equal((await f.prepare('create_document',{name:'Test',content:'Text'})).error,'reauthorization_required');f.c.oauth_scope=manifest.scopesForMode('google_drive','view_and_take_action').join(' ');f.c.permission_mode='view_only';assert.equal((await f.prepare('create_document',{name:'Test',content:'Text'})).error,'view_only');f.c.permission_mode='view_and_take_action';await f.prepare('create_document',{name:'Test',content:'Text'});assert.equal(await f.service.approve('stranger','step','approve'),null);assert.equal(f.calls.length,0);
});
test('File upload uses owned bytes and rejects inaccessible source without upload',async()=>{
 const f=fixture();await f.prepare('save_file',{name:'Picture.png',attachmentId:'owned-file'});assert.equal((await f.service.approve('owner','step','approve')).ok,true);assert.match(f.calls[0].body.toString(),/image-bytes/);
 const denied=fixture();await denied.prepare('save_file',{name:'Picture.png',attachmentId:'other-file'});assert.equal((await denied.service.approve('owner','step','approve')).ok,false);assert.equal(denied.calls.length,0);
});
test('Gmail draft may omit recipient and never sends',async()=>{
 const f=fixture('gmail');await f.prepare('create_draft',{subject:'Hello',body:'Email body'});assert.equal(f.calls.length,0);const result=await f.service.approve('owner','step','approve');assert.equal(result.ok,true);assert.match(f.calls[0].url,/\/drafts$/);assert.equal(result.result.receipt.url,'https://mail.google.com/mail/u/0/#drafts');await assert.rejects(()=>f.prepare('send_email',{subject:'Hello',body:'Email body'}));
});
