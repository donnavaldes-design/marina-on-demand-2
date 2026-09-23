const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function setup(status='pending'){
 const m={id:'m1',imageJob:{status}},requests=[],timers=new Map(),notice={},buttons={};let rendered=0,alive=true;
 for(const name of status==='pending'?['check']:['save','edit'])buttons['[data-image-'+name+']']={};
 const root={dataset:{imageMessage:'m1'},querySelector:s=>s==='[data-image-status]'?notice:buttons[s]};
 const input={focus:()=>{}},state={page:'chat',messages:[m]};
 const ctx={state,esc:String,document:{contains:()=>alive},qs:s=>s==='#messages'?{querySelectorAll:()=>[root]}:s==='#input'?input:notice,clearTimeout:id=>timers.delete(id),setTimeout:f=>{const id=Symbol();timers.set(id,f);return id;},api:async(url,opts)=>{requests.push({url,opts});return url.includes('status')?{id:'m1',imageJob:{status:'completed'},attachments:[{}],content:'Done'}:{ok:true};},renderMessages:()=>rendered++};
 vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function renderImageJob('),html.indexOf('function renderMessages(')),ctx);ctx.wireImageJobs();
 return {ctx,state,m,requests,timers,buttons,notice,input,rendered:()=>rendered,leave:()=>{alive=false;state.page='home';}};
}
test('re-render replaces polling timer and completion updates the existing chat message',async()=>{
 const f=setup();f.ctx.wireImageJobs();assert.equal(f.timers.size,1);await [...f.timers.values()][0]();await new Promise(setImmediate);assert.equal(f.requests.length,1);assert.equal(f.m.imageJob.status,'completed');assert.equal(f.rendered(),1);
});
test('leaving chat prevents its detached timer from polling',async()=>{const f=setup();f.leave();await [...f.timers.values()][0]();assert.equal(f.requests.length,0);});
test('save stores the selected message and edit keeps its exact reference',async()=>{
 const f=setup('completed');await f.buttons['[data-image-save]'].onclick();assert.equal(JSON.parse(f.requests[0].opts.body).messageId,'m1');assert.match(f.notice.textContent,/My Assets/);
 f.buttons['[data-image-edit]'].onclick();assert.equal(f.state.imageReferenceId,'m1');assert.equal(f.input.value,'Edit this image: ');
});
test('status failure offers a safe read-only retry',async()=>{
 const f=setup();f.ctx.api=async()=>{throw Error('offline')};await f.buttons['[data-image-check]'].onclick();assert.match(f.notice.textContent,/will not create another image/);assert.equal(f.buttons['[data-image-check]'].disabled,false);
});
