const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');const source=html.slice(html.indexOf('// Session maintenance must'),html.indexOf('\nqs("#loginForm")'));
const session=(id='u',token='first')=>({user:{id,email:'test@example.com'},access_token:token});
async function setup(initial=session(),search=''){
 const elements={},timers=[],calls={dashboard:0,connections:0,loads:0,getSession:0};let listener;
 const state={session:null,messages:['ongoing answer'],conversationId:'chat-1',pendingFiles:['draft'],loading:true};
 state.supabase={auth:{getSession:async()=>{calls.getSession++;return {data:{session:initial}};},onAuthStateChange:fn=>{listener=fn;}}};
 const context={state,URLSearchParams,window:{location:{search,pathname:'/'}},document:{title:'Marina'},history:{replaceState:()=>{}},qs:key=>elements[key]??=( {style:{},textContent:''}),setTimeout:fn=>timers.push(fn),loadConversations:async()=>{calls.loads++;},loadAdminStatus:async()=>{},loadSkills:async()=>{},renderDashboard:async()=>{calls.dashboard++;},openConnectionsPage:async()=>{calls.connections++;}};
 vm.createContext(context);await vm.runInContext('(async()=>{'+source+'})()',context);
 return {state,calls,elements,event:async(event,s)=>{listener(event,s);while(timers.length){timers.shift()();await new Promise(setImmediate);}}};
}
test('refresh and repeated sign-in events keep chat, draft, and active request intact',async()=>{const f=await setup();for(const e of ['TOKEN_REFRESHED','SIGNED_IN','USER_UPDATED','INITIAL_SESSION'])await f.event(e,session('u',e));assert.equal(f.calls.dashboard,1);assert.equal(f.calls.loads,1);assert.equal(f.calls.getSession,1);assert.equal(f.state.session.access_token,'INITIAL_SESSION');assert.equal(f.state.conversationId,'chat-1');assert.deepEqual(f.state.messages,['ongoing answer']);assert.deepEqual(f.state.pendingFiles,['draft']);assert.equal(f.state.loading,true);});
test('OAuth return opens Connections once and survives subsequent refresh',async()=>{const f=await setup(session(),'?oauth=success&connection=canva');await f.event('TOKEN_REFRESHED',session('u','rotated'));assert.equal(f.calls.connections,1);assert.equal(f.calls.dashboard,0);});
test('logged-out startup stays on login; actual sign-in initializes once',async()=>{const f=await setup(null);assert.equal(f.calls.dashboard,0);await f.event('SIGNED_IN',session());await f.event('SIGNED_IN',session());assert.equal(f.calls.dashboard,1);});
test('actual sign-out hides app and a subsequent login initializes again',async()=>{const f=await setup();await f.event('SIGNED_OUT',null);assert.equal(f.elements['#app'].style.display,'none');assert.equal(f.state.session,null);await f.event('SIGNED_IN',session());assert.equal(f.calls.dashboard,2);});
test('different authenticated user initializes their own view',async()=>{const f=await setup();await f.event('SIGNED_IN',session('other'));assert.equal(f.calls.dashboard,2);});
