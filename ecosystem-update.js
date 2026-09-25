'use strict';
const {normalize}=require('./ecosystem');
const strings=['brand_positioning','brand_promise','target_audience','audience_identity','brand_voice','cta_style','visual_direction','movement_or_belief','public_about','social_profiles','preferred_name'];
const lists=['audience_pain_points','audience_desires','buyer_language','tone_traits','signature_phrases','words_to_use','words_to_avoid','differentiators','content_pillars','authority_receipts','emotional_drivers','common_objections'];
function merge(current,patch){
 if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Provide an ecosystem update object.');
 const result={...current};
 for(const [key,value] of Object.entries(patch)){
  if(strings.includes(key)){if(typeof value!=='string')throw Error('Expected text for '+key);result[key]=value.slice(0,12000);}
  else if(lists.includes(key)){if(!Array.isArray(value)||value.some(v=>typeof v!=='string'))throw Error('Expected a text list for '+key);result[key]=value.slice(0,40).map(v=>v.slice(0,2000));}
  else if(key!=='businesses'&&key!=='priorityId')throw Error('Unsupported ecosystem field: '+key);
 }
 if(patch.businesses!==undefined||patch.priorityId!==undefined){
  const eco=current.ecosystem||{businesses:[],priorityId:''};const businesses=(eco.businesses||[]).map(b=>({...b}));
  if(patch.businesses!==undefined&&!Array.isArray(patch.businesses))throw Error('Businesses must be a list.');
  for(const b of patch.businesses||[]){
   if(!b||typeof b!=='object'||!b.id)throw Error('Each business needs an ID.');
   const index=businesses.findIndex(x=>x.id===b.id);
   if(index>=0)businesses[index]={...businesses[index],...b};else businesses.push(b);
  }
  result.ecosystem=normalize({businesses,priorityId:patch.priorityId===undefined?eco.priorityId:patch.priorityId});
 }
 return result;
}
const tool={type:'function',name:'update_my_ecosystem',description:'Update the actual My Ecosystem form fields when the user asks to fill out, update or save their brand, Brand Voice or businesses. A Saved Work document does NOT update these fields. Use verified research and user facts only; keep unknown facts unchanged. patch_json is a JSON object with shared brand fields and optional businesses upserts (id, name, type, company, audience, offers, goal, deadline, current_rank, customer_goal, team_goal, links, channels, follow_up, notes) and priorityId. Use existing IDs from memory; use a new unique ID only for a new business. Types: products_services, network_marketing, affiliate, retail, other. Shared text fields: '+strings.join(', ')+'. Shared text-list fields: '+lists.join(', ')+'. Do not modify unrelated fields or private notes. Report saved only after success.',strict:true,parameters:{type:'object',properties:{patch_json:{type:'string',description:'JSON object containing only the explicitly requested field updates.'}},required:['patch_json'],additionalProperties:false}};
module.exports={merge,tool};
