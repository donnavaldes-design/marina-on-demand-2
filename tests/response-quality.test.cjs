const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {RESPONSE_QUALITY}=require('../response-quality');
const source=fs.readFileSync(path.join(__dirname,'../api.js'),'utf8');

for(const action of [false,true])test(`${action?'Action':'Chat'} keeps voice, business context and approval rules after tool calls`,async()=>{
 const requests=[];
 const ctx={process:{env:{}},RESPONSE_QUALITY,MARINA_CORE:'core',MARINA_VOICE_LAYER:'MARINA VOICE',IMAGE_RULES:'',WEB_RESEARCH_RULES:'',CONNECTION_RULES:'APPROVAL REQUIRED',
  WEB_SEARCH_TOOL:{},IMAGE_TOOL:{},ACTION_TOOLS:[],BMOD_READ_TOOL:{},GOOGLE_MANIFEST:{tool:{}},CANVA_MANIFEST:{tool:{}},
  routeMessage:()=>({route:'operator',context:'operator'}),
  getLiveBrainContext:async()=>({core:'live core',liveOverrideText:'',business:[]}),
  publicMemoryContext:m=>m,shouldForceWebSearch:()=>false,
  createActionRun:async()=>({id:'run'}),finalizeActionRun:async()=>{},getActionRun:async()=>({id:'run'}),
  parseOpenAIText:r=>r.answer,extractWebSources:()=>[],
  CANVA:{execute:async()=>({designs:[]})},
  fetch:async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>requests.length===1?{id:'first',output:[{type:'function_call',name:'canva_operation',call_id:'call',arguments:'{"operation":"list_designs"}'}]}:{id:'second',output:[],answer:'finished'}};}
 };
 vm.createContext(ctx);
 const start=source.indexOf(action?'async function runActionAgent(':'async function askOpenAI(');
 const end=source.indexOf(action?'\nasync function ':'\nfunction normalizeEntitlementSource(',start+1);
 vm.runInContext(source.slice(start,end),ctx);
 const memory={primary_offer:'A seven-dollar bio worksheet'};
 const workspace=[{title:'Offer facts',content:'For service providers'}];
 if(action)await ctx.runActionAgent('Write my offer email',[],memory,[],workspace,'user','conversation');
 else await ctx.askOpenAI('Write my offer email',[],memory,[],'coach',workspace);
 assert.equal(requests.length,2);
 assert.equal(requests[1].instructions,requests[0].instructions);
 assert.match(requests[1].instructions,/MARINA VOICE/);
 assert.match(requests[1].instructions,/seven-dollar bio worksheet/);
 assert.match(requests[1].instructions,/For service providers/);
 assert.match(requests[1].instructions,/APPROVAL REQUIRED/);
 assert.ok(requests[1].instructions.endsWith(RESPONSE_QUALITY));
 assert.equal(requests[1].previous_response_id,'first');
});
