'use strict';
const manifest=require('./manifest');
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function validateValue(value,rule,name) {
  if(rule.type==='integer') {
    if(!Number.isSafeInteger(value)||value<rule.min||value>rule.max) throw Error(`Invalid ${name}: expected integer ${rule.min}..${rule.max}.`);
  } else if(rule.type==='boolean') {
    if(typeof value!=='boolean') throw Error(`Invalid ${name}: expected boolean.`);
  } else if(rule.type==='array') {
    if(!Array.isArray(value)||value.length<rule.min||value.length>rule.max) throw Error(`Invalid ${name}: array length out of range.`);
    value=value.map(v=>validateValue(v,rule.items,name));
  } else {
    if(typeof value!=='string'||!value.trim()||value.length>(rule.max||1000)) throw Error(`Invalid ${name}: expected a nonempty string.`);
    if(rule.pattern&&!new RegExp(rule.pattern).test(value)) throw Error(`Invalid ${name}: unsupported format.`);
    if(rule.format==='datetime' && (!/^\d{4}-\d{2}-\d{2}T/.test(value)||!Number.isFinite(Date.parse(value)))) throw Error(`Invalid ${name}: ISO timestamp required.`);
    if(rule.format==='date' && (!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)) throw Error(`Invalid ${name}: calendar date required.`);
    if(rule.format==='https') {let url;try{url=new URL(value);}catch{}if(!url||url.protocol!=='https:'||url.username||url.password)throw Error(`Invalid ${name}: HTTPS URL required.`);}
  }
  if(rule.enum&&!rule.enum.includes(value)) throw Error(`Invalid ${name}: use ${rule.enum.join(', ')}.`);
  return value;
}
function validate(operation,input={}) {
  if(!input||typeof input!=='object'||Array.isArray(input)) throw Error('Operation parameters must be a JSON object.');
  for(const key of Object.keys(input)) if(!own(operation.fields,key)) throw Error(`Unsupported parameter: ${key}.`);
  const values={};
  for(const [name,rule] of Object.entries(operation.fields)) {
    let value=input[name];
    if(value===undefined || value==='') {
      if(own(rule,'default')) value=rule.default;
      else if(rule.required) throw Error(`Required parameter: ${name}.`);
      else continue;
    }
    values[name]=validateValue(value,rule,name);
  }
  if(operation.range) {const [a,b]=operation.range;if(values[a]>=values[b]) throw Error(`${b} must follow ${a}.`);}
  return values;
}
function requestFor(operation,values,locationId) {
  if(!locationId || typeof locationId!=='string') throw Error('Connected HighLevel location is missing.');
  const params={...values},path=operation.endpoint.replace(/:([A-Za-z]+)/g,(_,key)=>{
    const value=key==='locationId'?locationId:params[key];delete params[key];
    if(!value||value==='.'||value==='..')throw Error(`Invalid path parameter: ${key}.`);
    return encodeURIComponent(value);
  });
  for(const [from,to] of Object.entries(operation.rename||{})) if(own(params,from)){params[to]=params[from];delete params[from];}
  Object.assign(params,operation.fixed||{});
  if(operation.location==='query'||operation.location==='body') params.locationId=locationId;
  if(operation.location==='alt') Object.assign(params,{altId:locationId,altType:'location'});
  for(const key of operation.stringify||[]) if(own(params,key))params[key]=String(params[key]);
  if(operation.body) return {path,method:operation.method,body:params};
  const query=new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)]));
  return {path:path+(query.size?'?'+query:''),method:operation.method};
}
function scopeError(op,connection) {
  const scopes=manifest.parseScopes(connection.oauth_scope),missing=op.scopes.filter(s=>!scopes.has(s));
  return missing.length?{error:'reauthorization_required',missing_scopes:missing,message:'Open Connections and choose Update permissions for BMOD Tools. Missing permissions do not disconnect your account.'}:null;
}
async function latestFunnel(call,op,values,locationId) {
  const req=requestFor(op,values,locationId),seen=new Map();let complete=false;
  for(let page=0;page<20;page++) {
    const u=new URL(req.path,'https://services.leadconnectorhq.com');u.searchParams.set('limit','50');u.searchParams.set('offset',String(page*50));
    const data=await call(u.pathname+u.search);
    if(!data||!own(data,'funnels'))throw Error('HighLevel returned an unrecognized funnel response.');
    const batch=Array.isArray(data.funnels)?data.funnels:data.funnels?[data.funnels]:[];
    let added=0;
    for(const f of batch){const id=f._id||f.id;if(!id)throw Error('HighLevel returned a funnel without an ID.');if(!seen.has(id)){seen.set(id,f);added++;}}
    const count=data.count==null?null:Number(data.count);
    if((count!==null&&Number.isFinite(count)&&seen.size>=count)||(batch.length<50&&!(count>seen.size))){complete=true;break;}
    if(!added)break;
  }
  const funnels=[...seen.values()].filter(f=>!f.deleted),dated=funnels.filter(f=>Number.isFinite(Date.parse(f.dateAdded)));
  dated.sort((a,b)=>Date.parse(b.dateAdded)-Date.parse(a.dateAdded));
  const verified=complete&&dated.length===funnels.length;
  return {latest_funnel:verified&&dated.length?funnelMetadata(dated[0]):null,complete:verified,scanned:seen.size,message:verified?(dated.length?'Newest funnel by creation date across matching funnels.':'No matching funnels found.'):'Unable to verify the latest funnel: incomplete pagination or missing creation dates. Do not claim a global latest result.'};
}
const funnelMetadata=f=>({_id:f._id||f.id,name:f.name,dateAdded:f.dateAdded,dateUpdated:f.dateUpdated,locationId:f.locationId,type:f.type,steps:f.steps});
async function execute({connection,operation,parameters={},call}) {
  if(operation==='describe_operations') {
    if(Object.keys(parameters).some(k=>k!=='family'))throw Error('Discovery supports only family.');
    const info=manifest.capabilities(connection);
    return {...info,operations:info.operations.filter(o=>!parameters.family||o.family.toLowerCase().includes(String(parameters.family).toLowerCase())).map(o=>({...o,parameters:manifest.operations[o.name].fields,note:manifest.operations[o.name].note}))};
  }
  if(!own(manifest.operations,operation))throw Error('Unsupported BMOD operation. Use describe_operations.');
  const op=manifest.operations[operation];
  if(op.classification==='write'&&manifest.modeOf(connection)!=='view_and_take_action')return {error:'view_only',executed:false,message:'This connection is View only. Writes are disabled.'};
  const missing=scopeError(op,connection);if(missing)return missing;
  const values=validate(op,parameters),request=requestFor(op,values,connection.provider_account_id);
  if(op.classification==='write') return {status:'approval_bridge_required',executed:false,approval_required:true,operation,parameters:values,message:'Validated preparation only. Queue this exact operation and parameters through Marina Action Mode. The approval execution bridge is not enabled; nothing has been changed.'};
  const invoke=(path,options={})=>call(path,{...options,requiredScopes:op.scopes});
  if(op.handler==='latest_funnel')return latestFunnel(invoke,op,values,connection.provider_account_id);
  const data=await invoke(request.path,{method:request.method,body:request.body});
  if(operation==='list_funnels')return {funnels:(Array.isArray(data?.funnels)?data.funnels:data?.funnels?[data.funnels]:[]).map(funnelMetadata),count:data?.count,offset:values.offset,limit:values.limit};
  return data;
}
module.exports={execute,validate,requestFor,scopeError};
