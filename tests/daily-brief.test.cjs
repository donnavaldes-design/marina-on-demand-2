const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const api=fs.readFileSync(require('node:path').join(__dirname,'../api.js'),'utf8');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('shared summary separates snoozed tasks, restores expired tasks, and links owned conversations',async()=>{
 const calls=[];const ctx={sbRest:async p=>{calls.push(p);if(p.includes('step_type=eq.user_task'))return [{id:'due',run_id:'r',result:{snoozed_until:'2000-01-01'}},{id:'later',run_id:'r',result:{snoozed_until:'2099-01-01'}}];if(p.includes('approval_status'))return [{id:'approval',run_id:'r'}];if(p.includes('id=in.'))return [{id:'r',conversation_id:'chat'}];return [];}};
 vm.createContext(ctx);vm.runInContext(api.slice(api.indexOf('async function getOpenLoopsSummary'),api.indexOf('function safeTimeZone')),ctx);
 const r=await ctx.getOpenLoopsSummary('owner');assert.deepEqual(Array.from(r.tasks,x=>x.id),['due']);assert.deepEqual(Array.from(r.snoozed_tasks,x=>x.id),['later']);assert.equal(r.approvals[0].conversation_id,'chat');assert.equal(r.counts.your_tasks,1);assert.ok(calls.every(p=>p.includes('user_id=eq.owner')));
});
async function patch(body,step={id:'t',run_id:'r',status:'planned',result:{other:'keep'}}){
 const writes=[];const ctx={req:{method:'PATCH'},path:'/api/open-loops/task',user:{id:'owner'},res:{},readBody:async()=>body,json:(_,status,data)=>({status,data}),sbRest:async(p,o)=>{assert.ok(p.includes('user_id=eq.owner'));if(!o)return step?[step]:[];writes.push(JSON.parse(o.body));return [step];},refreshActionRunStatus:async()=>{}};vm.createContext(ctx);
 const start=api.indexOf('    if (req.method === "PATCH" && path === "/api/open-loops/task")');const end=api.indexOf('    if (req.method === "GET" && path === "/api/momentum")',start);
 const result=await vm.runInContext('(async()=>{'+api.slice(start,end)+'})()',ctx);return {result,writes};
}
test('snooze persists with existing task data; completion clears it',async()=>{
 const snoozed=await patch({stepId:'t',snooze:true});assert.equal(snoozed.result.status,200);assert.ok(Date.parse(snoozed.writes[0].result.snoozed_until)>Date.now());assert.equal(snoozed.writes[0].result.other,'keep');
 const done=await patch({stepId:'t',done:true},{id:'t',run_id:'r',status:'planned',result:snoozed.writes[0].result});assert.equal(done.writes[0].status,'completed');assert.equal(done.writes[0].result.snoozed_until,undefined);
 const resume=await patch({stepId:'t',snooze:false});assert.equal(resume.writes[0].result.snoozed_until,undefined);
});
test('missing or completed tasks cannot be snoozed',async()=>{assert.equal((await patch({stepId:'t',snooze:true},null)).result.status,404);const x=await patch({stepId:'t',snooze:true},{status:'completed'});assert.equal(x.result.status,409);assert.equal(x.writes.length,0);});
test('brief exposes approval review without executing and escapes task titles',()=>{
 const ctx={state:{conversations:[{id:'chat'}]},esc:s=>String(s).replaceAll('<','&lt;').replaceAll('"','&quot;'),formatDate:String,workspaceLabel:String};vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function renderBriefLoops'),html.indexOf('function bindBriefLoops')),ctx);
 const markup=ctx.renderBriefLoops({approvals:[{id:'a',title:'Review',conversation_id:'chat'}],tasks:[{id:'t',title:'<script>',conversation_id:'chat'}]});assert.ok(markup.includes('Review in Action Mode'));assert.ok(markup.includes('&lt;script>'));assert.ok(markup.includes('Snooze 24 hours'));assert.ok(!markup.includes('data-loop-approve'));assert.ok(!html.includes('id="openLoopsBtn"'));
});
test('daily batch ignores legacy hour preferences, honors local weekly day, and avoids duplicates',async()=>{
 const rows=[{id:'d',user_id:'user',schedule_type:'daily_brief',timezone:'America/New_York',local_hour:19},{id:'w',user_id:'user',schedule_type:'weekly_review',timezone:'America/New_York',local_hour:7,weekday:3},{id:'other',user_id:'user',schedule_type:'weekly_review',timezone:'America/New_York',local_hour:8,weekday:4}];
 const saved=new Set(),writes=[];const ctx={getDailyBrief:async()=>({}),summarizeScheduledBrief:async()=> 'Brief',sbRest:async(p,o)=>{if(p.startsWith('agent_schedules?enabled'))return rows;if(p.startsWith('agent_briefs?run_key'))return saved.has(decodeURIComponent(p.split('eq.')[1].split('&')[0]))?[{id:'existing'}]:[];if(o?.method==='POST'){const r=JSON.parse(o.body)[0];saved.add(r.run_key);writes.push(r);return [{id:'saved'}];}return [];}};
 vm.createContext(ctx);vm.runInContext(api.slice(api.indexOf('function safeTimeZone'),api.indexOf('async function summarizeScheduledBrief')),ctx);vm.runInContext(api.slice(api.indexOf('async function runDueAgentSchedules'),api.indexOf('async function getDailyBrief')),ctx);
 const first=await ctx.runDueAgentSchedules(new Date('2026-09-23T12:45:00Z'));assert.equal(first.length,2);assert.equal(writes[0].brief_date,'2026-09-23');assert.equal((await ctx.runDueAgentSchedules(new Date('2026-09-23T12:55:00Z'))).length,0);
});
