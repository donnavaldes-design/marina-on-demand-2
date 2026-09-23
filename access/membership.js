'use strict';
function accessFromTags(values){
 const tags=new Set((Array.isArray(values)?values:[]).map(x=>String(x).trim().toLowerCase()));
 const bmod=tags.has('bmod client')&&!tags.has('bmod terminated');
 const direct=tags.has('mod sale')&&!tags.has('mod inactive');
 return {active:bmod||direct,bmod,direct};
}
function createMembershipService({sbRest,connection,call}){
 async function check(email){
  const normalized=String(email||'').trim().toLowerCase();
  if(!normalized)return {active:false,bmod:false,direct:false};
  const settings=await sbRest('runtime_settings?key=eq.membership_access&select=value&limit=1');
  const config=settings?.[0]?.value;
  if(!config?.connection_user_id||!config?.location_id)throw Error('ACCESS_CHECK_UNAVAILABLE');
  const linked=await connection(config.connection_user_id);
  if(!linked||linked.provider_account_id!==config.location_id)throw Error('ACCESS_CHECK_UNAVAILABLE');
  const result=await call(config.connection_user_id,'/contacts/search',{method:'POST',requiredScopes:['contacts.readonly'],body:{locationId:config.location_id,query:normalized,pageLimit:100,page:1}});
  if(!Array.isArray(result?.contacts))throw Error('ACCESS_CHECK_UNAVAILABLE');
  const matches=result.contacts.filter(c=>String(c.email||'').trim().toLowerCase()===normalized);
  // Refuse ambiguous duplicate contacts rather than selecting an arbitrary grant.
  if(matches.length>1)throw Error('ACCESS_CHECK_UNAVAILABLE');
  if(!matches.length)return {active:false,bmod:false,direct:false};
  const contact=matches[0];
  if(contact.locationId&&contact.locationId!==config.location_id)throw Error('ACCESS_CHECK_UNAVAILABLE');
  return accessFromTags(contact.tags);
 }
 return {check};
}
module.exports={accessFromTags,createMembershipService};
