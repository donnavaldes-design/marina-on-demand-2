'use strict';
const TYPES=['products_services','network_marketing','affiliate','retail','other'];
function normalize(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid ecosystem.');
 const businesses=Array.isArray(value.businesses)?value.businesses:[];
 if(businesses.length>12)throw Error('Use up to 12 income sources.');
 const ids=new Set();
 const clean=businesses.map(b=>{
  if(!b||!/^[a-zA-Z0-9-]{1,80}$/.test(b.id||'')||ids.has(b.id))throw Error('Invalid income source ID.');ids.add(b.id);
  if(!TYPES.includes(b.type))throw Error('Choose an income source type.');
  const row={id:b.id,type:b.type};
  for(const key of ['name','company','audience','offers','goal','deadline','current_rank','customer_goal','team_goal','links','channels','follow_up','notes'])row[key]=String(b[key]||'').trim().slice(0,key==='notes'?12000:4000);
  if(!row.name)throw Error('Give each income source a name.');return row;
 });
 const priorityId=String(value.priorityId||'');if(priorityId&&!ids.has(priorityId))throw Error('Choose an existing income source as your priority.');
 return {version:1,priorityId,businesses:clean};
}
function scopeMemory(memory,businessId){
 const eco=memory?.brand_brain?.ecosystem;
 if(!eco?.businesses?.length)return memory;
 const selected=eco.businesses.find(b=>b.id===businessId);
 if(businessId&&!selected)throw Error('This income source is unavailable. Choose another context.');
 const result={...memory,ecosystem_context:{selected_business:selected||null,priority_id:eco.priorityId||null,instruction:'The selected income source identifies this conversation. The current user request wins. If no source is selected and the request is ambiguous, ask which business. Never mix offers, customers, compensation plans or goals between businesses. Marketing channels may support multiple sources. Treat missing results as unknown. Uploaded compensation plans are references, not income guarantees. Ask for current qualification facts before planning rank goals.'}};
 for(const key of ['business_type','company_or_vehicle','primary_offer','target_audience','primary_goal','current_constraint','current_framework','preferred_platform','last_assignment','last_assignment_status','important_business_context'])delete result[key];
 if(selected)Object.assign(result,{business_type:selected.type,company_or_vehicle:selected.company,primary_offer:selected.offers,target_audience:selected.audience,primary_goal:selected.goal});
 return result;
}
module.exports={normalize,scopeMemory};
