const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');const source=fs.readFileSync('index.html','utf8');
function fixture(){const elements=new Map(),get=s=>{if(!elements.has(s))elements.set(s,{value:'',textContent:'',focus(){}});return elements.get(s)},calls=[],state={session:{user:{id:'owner'}},page:'chat',messages:[],pendingFiles:[],mode:'coach',skills:[],conversationId:'a',businessId:'business-a',loading:false};const ctx=vm.createContext({AbortController,state,qs:get,chatRuns:new Map(),crypto:require('node:crypto').webcrypto,URL,voiceCapture:{busy:false},renderPending(){},renderMessages(){},renderThreads(){},startModWorking(){},stopModWorking(){},setMode(m){state.mode=m},loadConversations:async()=>{},uploadPendingFiles:async files=>files.map(f=>({fileName:f.name})),api:async(path,opts)=>new Promise((resolve,reject)=>calls.push({body:JSON.parse(opts.body),signal:opts.signal,resolve,reject}))});vm.runInContext(source.slice(source.indexOf('function updateChatStopButton('),source.indexOf('\nqs("#dictateBtn").onclick')),ctx);return {ctx,state,calls,get};}
const tick=()=>new Promise(r=>setImmediate(r));
test('concurrent conversations completing out of order retain separate context and answers',async()=>{const f=fixture();f.state.pendingFiles=[{name:'a.txt',type:'text/plain',size:2}];const a=f.ctx.send('first');await tick();Object.assign(f.state,{conversationId:'b',businessId:'business-b',messages:[],pendingFiles:[],loading:false});const b=f.ctx.send('second');await tick();assert.equal(f.calls[0].body.conversationId,'a');assert.equal(f.calls[0].body.attachments[0].fileName,'a.txt');assert.equal(f.calls[1].body.businessId,'business-b');f.calls[1].resolve({conversationId:'b',businessId:'business-b',answer:'B answer'});await b;f.calls[0].resolve({conversationId:'a',businessId:'business-a',answer:'A answer'});await a;assert.equal(f.state.conversationId,'b');assert.equal(f.state.messages.at(-1).content,'B answer');assert.equal(f.ctx.chatRuns.get('a').messages.at(-1).content,'A answer');assert.equal(f.ctx.chatRuns.get('a').unread,true);});
test('background failure retains original draft without overwriting active composer',async()=>{const f=fixture();const a=f.ctx.send('original draft');await tick();Object.assign(f.state,{conversationId:'b',messages:[],loading:false});f.get('#input').value='new draft';f.calls[0].reject(Error('offline'));await a;assert.equal(f.get('#input').value,'new draft');assert.equal(f.ctx.chatRuns.get('a').draft,'original draft');assert.match(f.ctx.chatRuns.get('a').error,/could not finish/);});
test('new background conversation replaces temporary ID without taking over active chat',async()=>{const f=fixture();f.state.conversationId='';const a=f.ctx.send('new');await tick();Object.assign(f.state,{conversationId:'b',messages:[],loading:false});f.calls[0].resolve({conversationId:'created',answer:'new answer'});await a;assert.equal(f.state.conversationId,'b');assert.equal(f.ctx.chatRuns.has('created'),true);assert.equal([...f.ctx.chatRuns.keys()].some(k=>k.startsWith('pending-')),false);});

test('provider quota error is member friendly and retains retry contents',async()=>{const f=fixture();f.state.pendingFiles=[{name:'brief.txt',type:'text/plain',size:2}];const pending=f.ctx.send('keep this');await tick();f.calls[0].reject(Error('OPENAI_429: You have no credits remaining. Add credits https://platform.openai.com/billing'));await pending;assert.match(f.ctx.chatRuns.get('a').error,/temporarily unavailable/);assert.doesNotMatch(f.ctx.chatRuns.get('a').error,/OPENAI|credits|billing|https:/);assert.equal(f.get('#input').value,'keep this');assert.equal(f.state.pendingFiles[0].name,'brief.txt');});

test('stop restores attachments and prompt, aborts request, and ignores a late answer',async()=>{
 const f=fixture();f.state.pendingFiles=[{name:'brief.txt',type:'text/plain',size:2}];
 const pending=f.ctx.send('unfinished prompt');await tick();f.ctx.stopChatResponse();
 assert.equal(f.calls[0].signal.aborted,true);assert.equal(f.state.loading,false);
 assert.equal(f.get('#input').value,'unfinished prompt');assert.equal(f.state.pendingFiles[0].name,'brief.txt');
 f.calls[0].resolve({conversationId:'a',answer:'late answer'});await pending;
 assert.equal(f.state.messages.some(m=>m.content==='late answer'),false);
});
test('stopped response cannot overwrite a new run or a newer unsent draft',async()=>{
 const f=fixture();const old=f.ctx.send('old prompt');await tick();f.get('#input').value='new draft';
 f.ctx.stopChatResponse();assert.equal(f.get('#input').value,'new draft');
 const next=f.ctx.send('corrected prompt');await tick();f.calls[0].reject(Error('aborted'));await old;
 assert.equal(f.state.loading,true);assert.equal(f.ctx.chatRuns.get('a').draft,'corrected prompt');
 f.calls[1].resolve({conversationId:'a',answer:'correct answer'});await next;
 assert.equal(f.state.messages.at(-1).content,'correct answer');
});
test('stop during upload prevents chat request from starting',async()=>{
 const f=fixture();let finish;f.ctx.uploadPendingFiles=()=>new Promise(resolve=>finish=resolve);
 const pending=f.ctx.send('not ready');f.ctx.stopChatResponse();finish([]);await pending;
 assert.equal(f.calls.length,0);assert.equal(f.get('#input').value,'not ready');
});
