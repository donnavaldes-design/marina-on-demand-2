const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const manifest=require('../bmod/manifest');
const appRequire=require('node:module').createRequire(require('node:path').resolve(__dirname,'../api.js'));
const source=fs.readFileSync(require('node:path').join(__dirname,'../api.js'),'utf8');
function setup(overrides={}) {
  const db={row:{id:'connection',user_id:'user',integration_key:'bmod_tools',status:'connected',oauth_provider:'highlevel',oauth_scope:manifest.scopesForMode('view_only').join(' '),permission_mode:'view_only',provider_account_id:'location',vault_secret_id:'access',refresh_vault_secret_id:'refresh',oauth_connected_at:'2026-09-22T00:00:00Z',token_expires_at:new Date(Date.now()+3600000).toISOString(),updated_at:'2026-09-22T00:00:00Z',allowed_tools:['list_pipelines'],...overrides},access:'access-old',refresh:'refresh-old',lease:null,states:[],refreshCalls:0,pipelineCalls:0,openaiCalls:0,saveCalls:0};
  const result=(body,status=200)=>new Response(body===null?null:JSON.stringify(body),{status});
  const match=(row,u)=>{
    for(const [k,v] of u.searchParams) {
      if(v.startsWith('in.(') && !v.slice(4,-1).split(',').includes(String(row[k]))) return false;
      if(v.startsWith('neq.') && String(row[k])===v.slice(4)) return false;
      if(v.startsWith('eq.') && String(row[k])!==v.slice(3)) return false;
      if(v==='not.in.(disabled,disconnected)' && ['disabled','disconnected'].includes(row[k])) return false;
    }
    return true;
  };
  const fetch=async(url,opts={})=>{
    const u=new URL(url);const body=opts.body?JSON.parse(opts.body.startsWith('{')||opts.body.startsWith('[')?opts.body:'null'):null;
    if(u.pathname==='/auth/v1/user') return result({id:'user',email:'test@example.invalid'});
    if(u.hostname==='api.openai.com') {db.openaiCalls++;throw Error('Native connection must not use MCP');}
    if(u.hostname==='services.leadconnectorhq.com') {
      if(u.pathname==='/oauth/token') {
        db.refreshCalls++;
        if(db.providerFailure) return result(db.providerFailure.body,db.providerFailure.status);
        if(db.onRefresh) await db.onRefresh();
        const params=new URLSearchParams(opts.body);
        if(params.get('grant_type')==='refresh_token') assert.equal(params.get('refresh_token'),db.refresh);
        return result({access_token:'access-'+db.refreshCalls,refresh_token:'refresh-'+db.refreshCalls,expires_in:86400,locationId:'location',...(db.omitScope?{}:{scope:db.rotatedScope ?? db.row.oauth_scope})});
      }
      db.providerRequests ||= [];db.providerRequests.push({path:u.pathname,method:opts.method,query:Object.fromEntries(u.searchParams),body});
      db.pipelineCalls++;
      if(db.onRead) await db.onRead();
      if(db.readFailure) return result({},db.readFailure);
      if(db.rejectOld && opts.headers.authorization==='Bearer access-old') return result({},401);
      if(u.pathname.startsWith('/funnels/')) {db.funnelRequests ||= [];db.funnelRequests.push(u);return result(db.funnelResponse ? db.funnelResponse(u) : {funnels:[],count:0});}
      if(u.pathname==='/contacts/search') {assert.equal(opts.method,'POST');assert.equal(body.locationId,'location');assert.equal(body.page,1);return result({contacts:[]});}
      if(u.pathname==='/opportunities/search') {assert.equal(opts.method,'GET');assert.equal(u.searchParams.get('locationId'),'location');return result({opportunities:[]});}
      if(u.pathname==='/blogs/site/all')return result({data:[]});
      if(u.pathname==='/emails/locations/location/templates')return result({items:[],total:0});
      if(u.pathname==='/products/')return result({products:[],total:[{total:0}]});
      if(u.pathname==='/workflows/')return result({workflows:[]});
      return result({pipelines:[{id:'pipeline-fixture'}]});
    }
    if(u.pathname.includes('/rpc/')) {
      const name=u.pathname.split('/').pop();
      if(name==='get_connection_secret') return result(db.access);
      if(name==='get_connection_refresh_secret') return result(db.refresh);
      if(name!=='bmod_token_transition') throw Error('Unexpected RPC '+name);
      if(body.p_action==='disconnect') {db.row.status='disabled';db.row.allowed_tools=[];db.lease=null;db.states=[];return result(true);}
      if(['disabled','disconnected'].includes(db.row.status)) return result(false);
      if(body.p_action==='claim') {if(db.lease)return result(false);db.lease=body.p_lease;return result(true);}
      if(db.lease!==body.p_lease) return result(false);
      if(body.p_action==='release') {db.lease=null;return result(true);}
      if(body.p_action==='revoke') {db.row.status='auth_required';return result(true);}
      if(body.p_action==='save') {
        db.saveCalls++;
        if(db.failSaveOnce && db.saveCalls===1) return result({error:'storage temporary error'},503);
        const d=body.p_data;db.access=d.access_token;db.refresh=d.refresh_token;
        if(Object.hasOwn(d,'scope'))db.row.oauth_scope=d.scope;
        db.row.allowed_tools=d.allowed_tools;db.row.discovered_tools=d.discovered_tools;
        Object.assign(db.row,{status:'connected',oauth_provider:'highlevel',token_expires_at:new Date(Date.now()+d.expires_in*1000).toISOString(),updated_at:new Date().toISOString()});
        return result(true);
      }
    }
    if(u.pathname.endsWith('/user_connections')) {
      if(db.failMetadataReadOnce && db.refreshCalls>0 && !db.metadataReadFailed && !opts.method){db.metadataReadFailed=true;return result({error:'temporary database read'},503);}
      if(opts.method==='POST') {if(!db.row)db.row=body[0];return result(null);}
      if(opts.method==='PATCH') {if(match(db.row,u))Object.assign(db.row,body);return result(null);}
      return result(db.row && match(db.row,u)?[structuredClone(db.row)]:[]);
    }
    if(u.pathname.endsWith('/integration_catalog'))return result([{integration_key:'bmod_tools',customer_visible:true,default_server_url:'https://services.leadconnectorhq.com',display_name:'BMOD Tools'}]);
    if(u.pathname.endsWith('/connection_oauth_states')) {
      if(opts.method==='DELETE'){const rows=db.states.filter(x=>match(x,u));db.states=db.states.filter(x=>!match(x,u));return result(rows);}
      if(opts.method==='POST'){db.states.push(...body);return result(null);}
      if(opts.method==='PATCH'){db.states.forEach(x=>{if(match(x,u))Object.assign(x,body)});return result(null);}
      return result(db.states.filter(x=>match(x,u)));
    }
    throw Error('Unexpected request '+u.pathname);
  };
  const context=vm.createContext({require:appRequire,module:{exports:{}},process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture',HIGHLEVEL_CLIENT_ID:'fixture-client',HIGHLEVEL_CLIENT_SECRET:'fixture-secret',NEXT_PUBLIC_SITE_URL:'https://app.invalid'}},fetch,URL,URLSearchParams,AbortSignal,setTimeout,console:{info(){},warn(){},error(){}},Buffer});
  vm.runInContext(source+'\nmodule.exports.testing={getHighLevelAccessToken,highLevelApi,refreshHighLevelAccessToken,testBmodConnection,completeBmodOAuth,executeBmodRead};',context);
  const handler=context.module.exports;
  const call=async(method,path,body={})=>{
    const req={method,url:path,headers:{authorization:'Bearer fixture-user',host:'app.invalid'},body};
    let payload; const res={setHeader(){},end(value){payload=value;}};
    await handler(req,res);return {status:res.statusCode,body:payload?JSON.parse(payload):null};
  };
  return {db,api:handler.testing,call};
}
test('connect, pipeline read, expiry refresh, fresh app status read, pipeline read again',async()=>{
  const {db,api,call}=setup({status:'auth_required',oauth_provider:null});
  await api.completeBmodOAuth({integration_key:'bmod_tools',user_id:'user',expires_at:new Date(Date.now()+60000).toISOString(),client_id:'fixture',client_secret:'fixture',redirect_uri:'https://app.invalid'},'fixture-code');
  await api.highLevelApi('user','/opportunities/pipelines');
  db.row.token_expires_at=new Date(0).toISOString();
  await api.highLevelApi('user','/opportunities/pipelines');
  const state=await call('GET','/api/connections');
  assert.equal(state.body.integrations[0].connection.status,'connected');
  await api.highLevelApi('user','/opportunities/pipelines');
  assert.equal(db.refreshCalls,2);assert.equal(db.refresh,'refresh-2');assert.equal(db.row.status,'connected');
});
test('native test does not invoke generic MCP discovery',async()=>{const {db,call}=setup();assert.equal((await call('POST','/api/connections/discover',{integrationKey:'bmod_tools'})).status,200);assert.equal(db.openaiCalls,0);assert.equal(db.pipelineCalls,1);});
test('configuration and repeated OAuth start preserve valid connection',async()=>{const {db,call}=setup();await call('POST','/api/connections',{integrationKey:'bmod_tools'});const response=await call('POST','/api/connections/oauth/start',{integrationKey:'bmod_tools'});assert.equal(db.row.status,'connected');assert.equal(response.body.status,'connected');assert.equal(db.states.length,0);});
test('simultaneous refreshes rotate only once',async()=>{const {db,api}=setup({token_expires_at:new Date(0).toISOString()});await Promise.all([api.getHighLevelAccessToken('user'),api.getHighLevelAccessToken('user'),api.getHighLevelAccessToken('user')]);assert.equal(db.refreshCalls,1);assert.equal(db.refresh,'refresh-1');});
test('401 refreshes and retries once',async()=>{const {db,api}=setup();db.rejectOld=true;await api.highLevelApi('user','/opportunities/pipelines');assert.equal(db.refreshCalls,1);assert.equal(db.pipelineCalls,2);});
test('repeated 401 is bounded and does not falsely revoke authorization',async()=>{const {db,api}=setup();db.readFailure=401;await assert.rejects(api.highLevelApi('user','/opportunities/pipelines'));assert.equal(db.refreshCalls,1);assert.equal(db.pipelineCalls,2);assert.equal(db.row.status,'connected');});
for(const status of [429,500,503])test('provider '+status+' preserves connection',async()=>{const {db,api}=setup({token_expires_at:new Date(0).toISOString()});db.providerFailure={status,body:{error:'unavailable'}};await assert.rejects(api.getHighLevelAccessToken('user'));assert.equal(db.row.status,'connected');assert.equal(db.refresh,'refresh-old');});
test('invalid_grant requires reconnect',async()=>{const {db,api}=setup({token_expires_at:new Date(0).toISOString()});db.providerFailure={status:400,body:{error:'invalid_grant'}};await assert.rejects(api.getHighLevelAccessToken('user'));assert.equal(db.row.status,'auth_required');});
test('invalid_client is a configuration failure, not grant revocation',async()=>{const {db,api}=setup({token_expires_at:new Date(0).toISOString()});db.providerFailure={status:401,body:{error:'invalid_client'}};await assert.rejects(api.getHighLevelAccessToken('user'));assert.equal(db.row.status,'connected');});
test('storage retry persists same rotated pair without another token exchange',async()=>{const {db,api}=setup({token_expires_at:new Date(0).toISOString()});db.failSaveOnce=true;await api.getHighLevelAccessToken('user');assert.equal(db.saveCalls,2);assert.equal(db.refreshCalls,1);});
test('explicit disconnect defeats an in-flight refresh',async()=>{const {db,api,call}=setup({token_expires_at:new Date(0).toISOString()});db.onRefresh=()=>call('DELETE','/api/connections?integrationKey=bmod_tools');await assert.rejects(api.getHighLevelAccessToken('user'));assert.equal(db.row.status,'disabled');assert.equal(db.access,'access-old');});
test('explicit disconnect defeats an in-flight pipeline test',async()=>{const {db,api,call}=setup();db.onRead=()=>call('DELETE','/api/connections?integrationKey=bmod_tools');await assert.rejects(api.testBmodConnection('user'));assert.equal(db.row.status,'disabled');});
test('legacy false-disconnected record is recovered only after native read succeeds',async()=>{const {db,call}=setup({status:'auth_required',oauth_provider:null});await call('GET','/api/connections');assert.equal(db.row.status,'connected');assert.equal(db.pipelineCalls,1);});
test('callback cancellation preserves connected authorization',async()=>{const {db,call}=setup();db.states=[{state:'fixture-state',user_id:'user',integration_key:'bmod_tools',return_url:'https://app.invalid/'}];await call('GET','/api/connections/oauth/callback?state=fixture-state&error=access_denied');assert.equal(db.row.status,'connected');assert.equal(db.states.length,0);});
test('duplicate callback consumes OAuth state only once',async()=>{const {db,call}=setup({status:'auth_required',oauth_provider:null});db.states=[{state:'fixture-state',user_id:'user',integration_key:'bmod_tools',return_url:'https://app.invalid/',expires_at:new Date(Date.now()+60000).toISOString()}];await Promise.all([call('GET','/api/connections/oauth/callback?state=fixture-state&code=fixture'),call('GET','/api/connections/oauth/callback?state=fixture-state&code=fixture')]);assert.equal(db.refreshCalls,1);assert.equal(db.row.status,'connected');});
test('temporary callback verification failure retains saved grant',async()=>{const {db,api}=setup({status:'auth_required',oauth_provider:null});db.readFailure=503;await api.completeBmodOAuth({integration_key:'bmod_tools',user_id:'user',expires_at:new Date(Date.now()+60000).toISOString()},'fixture');assert.equal(db.row.status,'connected');assert.equal(db.refresh,'refresh-1');});

test('legacy grant displays upgrade and starting authorization preserves connected state',async()=>{
  const {db,call}=setup({oauth_scope:'locations.readonly workflows.readonly'});
  const state=await call('GET','/api/connections');
  assert.equal(state.body.integrations[0].connection.reauthorization_required,true);
  assert.ok(!state.body.integrations[0].connection.allowed_tools.includes('list_funnels'));
  const response=await call('POST','/api/connections/oauth/start',{integrationKey:'bmod_tools'});
  assert.equal(response.status,200);assert.equal(db.row.status,'connected');assert.equal(db.states.length,1);
  assert.ok(db.states[0].scopes.includes('funnels/funnel.readonly'));
});
test('missing funnel grant returns actionable error without substituting workflows',async()=>{
  const {db,api}=setup({oauth_scope:'workflows.readonly'});
  const result=await api.executeBmodRead('user',{operation:'latest_funnel'});
  assert.equal(result.error,'reauthorization_required');assert.equal(db.pipelineCalls,0);assert.equal(db.row.status,'connected');
});
test('funnel pagination uses native location-scoped endpoint and refreshes expired tokens',async()=>{
  const {db,api}=setup({token_expires_at:new Date(0).toISOString()});
  db.funnelResponse=()=>({funnels:[{_id:'f',name:'Example',dateAdded:'2026-01-01',trackingCode:'omit'}],count:1});
  const result=await api.executeBmodRead('user',{operation:'list_funnels',offset:10,limit:5,query:'Example'});
  assert.equal(db.refreshCalls,1);assert.equal(db.refresh,'refresh-1');assert.equal(db.row.status,'connected');
  const u=db.funnelRequests[0];assert.equal(u.pathname,'/funnels/funnel/list');assert.equal(u.searchParams.get('locationId'),'location');assert.equal(u.searchParams.get('offset'),'10');assert.equal(u.searchParams.get('name'),'Example');
  assert.equal(result.funnels[0]._id,'f');assert.equal(result.funnels[0].trackingCode,undefined);
});
test('latest funnel scans later pages and sorts creation dates, not workflow dates',async()=>{
  const {db,api}=setup();
  db.funnelResponse=u=>Number(u.searchParams.get('offset'))===0?{funnels:Array.from({length:50},(_,i)=>({_id:'old'+i,dateAdded:'2025-01-01'})),count:51}:{funnels:[{_id:'newest',dateAdded:'2026-09-22'}],count:51};
  const result=await api.executeBmodRead('user',{operation:'latest_funnel'});
  assert.equal(result.complete,true);assert.equal(result.latest_funnel._id,'newest');assert.equal(db.funnelRequests.length,2);
});
test('latest funnel refuses unsupported global claim on repeated pages or missing dates',async()=>{
  for(const missingDate of [false,true]) {
    const {db,api}=setup();db.funnelResponse=()=>({funnels:[{_id:'f',...(missingDate?{}:{dateAdded:'2026-01-01'})}],count:missingDate?1:100});
    const result=await api.executeBmodRead('user',{operation:'latest_funnel'});assert.equal(result.complete,false);assert.equal(result.latest_funnel,null);
  }
});
test('page read and count require funnel ID and their individual scopes',async()=>{
  const {db,api}=setup();
  await assert.rejects(api.executeBmodRead('user',{operation:'list_funnel_pages'}),/funnelId/);
  await api.executeBmodRead('user',{operation:'list_funnel_pages',funnelId:'f',offset:2,limit:3});
  await api.executeBmodRead('user',{operation:'count_funnel_pages',funnelId:'f'});
  assert.equal(db.funnelRequests[0].pathname,'/funnels/page');assert.equal(db.funnelRequests[0].searchParams.get('funnelId'),'f');assert.equal(db.funnelRequests[0].searchParams.get('offset'),'2');assert.equal(db.funnelRequests[1].pathname,'/funnels/page/count');
  db.row.oauth_scope='funnels/funnel.readonly';assert.equal((await api.executeBmodRead('user',{operation:'list_funnel_pages',funnelId:'f'})).error,'reauthorization_required');
});

test('canonical scopes drive OAuth and full business-read refresh cycle',async()=>{
  const {db,api,call}=setup({status:'auth_required'});
  const start=await call('POST','/api/connections/oauth/start',{integrationKey:'bmod_tools'});
  assert.deepEqual(new URL(start.body.authorizeUrl).searchParams.get('scope').split(' '),manifest.scopesForMode('view_only'));
  assert.ok(!start.body.scopes.includes('.write'));
  await api.completeBmodOAuth({...db.states[0]},'fixture-code');
  const ops=['search_contacts','search_opportunities','list_pipelines','list_workflows','list_funnels','list_blogs','list_email_templates','list_products'];
  for(const operation of ops) await api.executeBmodRead('user',{operation,parameters_json:'{}'});
  let state=await call('GET','/api/connections');assert.equal(state.body.integrations[0].connection.reauthorization_required,false);
  db.row.token_expires_at=new Date(0).toISOString();
  for(const operation of ops) await api.executeBmodRead('user',{operation,parameters_json:'{}'});
  state=await call('GET','/api/connections');assert.equal(state.body.integrations[0].connection.status,'connected');assert.equal(db.refreshCalls,2);
  assert.equal(db.refresh,'refresh-2');assert.equal(db.row.permission_mode,'view_only');
});
test('refresh narrowing scopes blocks dispatch but keeps connected',async()=>{
  const {db,api}=setup({token_expires_at:new Date(0).toISOString()});db.rotatedScope='locations.readonly';
  await assert.rejects(api.executeBmodRead('user',{operation:'list_products',parameters_json:'{}'}),/permissions changed/);
  assert.equal(db.pipelineCalls,0);assert.equal(db.row.status,'connected');assert.equal(db.refresh,'refresh-1');
});
test('refresh without scope preserves previous grant and action mode',async()=>{
  const {db,api}=setup({token_expires_at:new Date(0).toISOString(),permission_mode:'view_and_take_action'});db.omitScope=true;
  const before=db.row.oauth_scope;await api.getHighLevelAccessToken('user');assert.equal(db.row.oauth_scope,before);assert.equal(db.row.permission_mode,'view_and_take_action');
});
test('callback without returned scopes never invents grants from requested scopes',async()=>{
  const {db,api}=setup({status:'auth_required'});db.omitScope=true;
  await api.completeBmodOAuth({integration_key:'bmod_tools',user_id:'user',scopes:manifest.scopesForMode('view_only').join(' '),expires_at:new Date(Date.now()+60000).toISOString()},'fixture');
  assert.equal(db.row.oauth_scope,'');assert.equal(db.row.status,'connected');assert.equal(db.pipelineCalls,0);
});
test('connection permission mode defaults closed and survives fresh requests',async()=>{
  const {db,call}=setup();
  assert.equal((await call('PATCH','/api/connections/bmod/permissions',{permissionMode:'admin'})).status,400);
  assert.equal((await call('PATCH','/api/connections/bmod/permissions',{permissionMode:'view_and_take_action'})).status,200);
  let c=(await call('GET','/api/connections')).body.integrations[0].connection;
  assert.equal(c.permission_mode,'view_and_take_action');assert.equal(c.status,'connected');assert.equal(c.reauthorization_required,true);
  await call('PATCH','/api/connections/bmod/permissions',{permissionMode:'view_only'});assert.equal(db.row.permission_mode,'view_only');
});

test('authenticated diagnostic performs reads before and after a real refresh exchange mock',async()=>{
  const {db,call}=setup();const result=await call('POST','/api/connections/bmod/verify');
  assert.equal(result.status,200);assert.equal(result.body.ok,true);assert.equal(result.body.checks.length,16);assert.equal(db.refreshCalls,1);assert.equal(result.body.status,'connected');
  assert.ok(!JSON.stringify(result.body).includes('access-'));assert.ok(!JSON.stringify(result.body).includes('refresh-1'));
});
test('diagnostic marks missing grants rather than disconnecting or pretending all reads passed',async()=>{
  const {db,call}=setup({oauth_scope:'contacts.readonly'});const result=await call('POST','/api/connections/bmod/verify');
  assert.equal(result.body.ok,false);assert.equal(db.row.status,'connected');assert.equal(result.body.refresh,'passed');
  assert.equal(result.body.checks.filter(x=>x.status==='missing_permission').length,14);
});

test('metadata read failure after token exchange retries the returned pair',async()=>{
  const {db,api}=setup({token_expires_at:new Date(0).toISOString()});db.failMetadataReadOnce=true;
  await api.getHighLevelAccessToken('user');assert.equal(db.metadataReadFailed,true);assert.equal(db.refreshCalls,1);assert.equal(db.refresh,'refresh-1');assert.equal(db.row.status,'connected');
});
