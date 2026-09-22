'use strict';

// Canonical, reviewed operation contracts. Adding a capability here drives OAuth,
// dispatch validation, discovery, and Connections without adding a model tool.
const VERSION='2026-09-22.1';
const audit=require('./marketplace-scopes.json');
const doc=path=>'https://marketplace.gohighlevel.com/docs/ghl/'+path+'/index.html';
const str=(required=false,max=200)=>({type:'string',required,max});
const id=(required=true)=>({...str(required,128),pattern:'^[A-Za-z0-9_-]+$'});
const integer=(min,max,def)=>({type:'integer',min,max,...(def===undefined?{required:true}:{default:def})});
const choice=(values,def)=>({type:'string',enum:values,...(def===undefined?{required:true}:{default:def})});
const date={...str(true,10),pattern:'^\\d{4}-\\d{2}-\\d{2}$',format:'date'};
const page={limit:integer(1,50,20),offset:integer(0,100000,0)};
const emailPage={limit:integer(1,20,10),offset:page.offset,search:str()};
const operations=Object.create(null);
function add(name,family,scope,method,endpoint,fields={},options={}) {
  operations[name]={name,family,scopes:Array.isArray(scope)?scope:[scope],classification:'read',method,endpoint,fields,location:'query',...options};
}
add('get_location','Account','locations.readonly','GET','/locations/:locationId',{}, {location:'path'});
add('search_contacts','Contacts','contacts.readonly','POST','/contacts/search',{query:str(false,75),limit:page.limit,page:integer(1,10000,1)},{location:'body',body:true,rename:{limit:'pageLimit'},docs:doc('contacts/search-contacts-advanced')});
add('get_contact','Contacts','contacts.readonly','GET','/contacts/:contactId',{contactId:id()},{location:'token'});
add('search_opportunities','Opportunities','opportunities.readonly','GET','/opportunities/search',{query:str(false,75),limit:page.limit,page:integer(1,10000,1),pipelineId:id(false),status:choice(['open','won','lost','abandoned','all'],'all')},{rename:{query:'q'},docs:doc('opportunities/search-opportunity')});
add('list_pipelines','Pipelines','pipelines.readonly','GET','/opportunities/pipelines',{}, {docs:doc('opportunities/get-pipelines')});
add('list_workflows','Workflows','workflows.readonly','GET','/workflows/');
add('search_conversations','Conversations / messages','conversations.readonly','GET','/conversations/search',{limit:page.limit,contactId:id(false)});
add('list_messages','Conversations / messages','conversations/message.readonly','GET','/conversations/:conversationId/messages',{conversationId:id(),limit:page.limit,lastMessageId:id(false)},{location:'token',docs:doc('conversations/get-messages')});
add('list_calendars','Calendars / events','calendars.readonly','GET','/calendars/');
add('list_calendar_events','Calendars / events','calendars/events.readonly','GET','/calendars/events',{calendarId:id(),startTime:{...str(true,16),pattern:'^\\d{10,16}$'},endTime:{...str(true,16),pattern:'^\\d{10,16}$'}},{range:['startTime','endTime'],docs:doc('calendars/get-calendar-events')});
add('list_contact_tasks','Tasks / tags / custom fields','contacts.readonly','GET','/contacts/:contactId/tasks',{contactId:id()},{location:'token'});
add('list_tags','Tasks / tags / custom fields','locations/tags.readonly','GET','/locations/:locationId/tags',{}, {location:'path'});
add('list_custom_fields','Tasks / tags / custom fields','locations/customFields.readonly','GET','/locations/:locationId/customFields',{}, {location:'path'});
add('list_funnels','Funnels / pages / redirects','funnels/funnel.readonly','GET','/funnels/funnel/list',{...page,query:str(false,75)},{rename:{query:'name'},fixed:{type:'funnel'},docs:doc('funnels/get-funnels')});
add('latest_funnel','Funnels / pages / redirects','funnels/funnel.readonly','GET','/funnels/funnel/list',{query:str(false,75)},{handler:'latest_funnel',rename:{query:'name'},fixed:{type:'funnel'},docs:doc('funnels/get-funnels')});
add('list_funnel_pages','Funnels / pages / redirects','funnels/page.readonly','GET','/funnels/page',{...page,funnelId:id()},{docs:doc('funnels/get-pages-by-funnel-id')});
add('count_funnel_pages','Funnels / pages / redirects','funnels/pagecount.readonly','GET','/funnels/page/count',{funnelId:id()});
add('list_redirects','Funnels / pages / redirects','funnels/redirect.readonly','GET','/funnels/lookup/redirect/list',{limit:page.limit,offset:page.offset});
add('list_blogs','Blogs','blogs/list.readonly','GET','/blogs/site/all',{...page,query:str()},{rename:{offset:'skip',query:'searchTerm'},docs:doc('blogs/get-blogs')});
add('list_blog_posts','Blogs','blogs/posts.readonly','GET','/blogs/posts/all',{...page,blogId:id(),query:str(),status:choice(['ALL','DRAFT','PUBLISHED','SCHEDULED','SCHEDULE_FAILED','ARCHIVED','DELETED'],'ALL')},{rename:{query:'searchTerm'},docs:doc('blogs/get-blog-post')});
add('list_email_templates','Email templates / campaigns / schedules / stats','emails/templates.readonly','GET','/emails/locations/:locationId/templates',emailPage,{location:'path',docs:doc('emails/list-email-templates')});
add('list_email_campaigns','Email templates / campaigns / schedules / stats','emails/campaigns.readonly','GET','/emails/locations/:locationId/campaigns/emails',{...emailPage,status:choice(['all','sent','failed','archived','draft','processing','scheduled','cancelled','paused'],'all')},{location:'path',docs:doc('emails/list-email-campaigns')});
add('list_scheduled_emails','Email templates / campaigns / schedules / stats','emails/campaigns.readonly','GET','/emails/locations/:locationId/campaigns/emails',emailPage,{location:'path',fixed:{status:'scheduled'},docs:doc('emails/list-email-campaigns')});
add('get_email_stats','Email templates / campaigns / schedules / stats','emails/stats.readonly','GET','/emails/locations/:locationId/campaigns/stats/:source/:sourceId',{source:choice(['email-campaigns','workflow-campaigns','bulk-actions']),sourceId:id(),subSourceId:id(false)},{location:'path',docs:doc('emails/get-campaign-stats')});
add('list_forms','Forms','forms.readonly','GET','/forms/',{limit:page.limit});
add('list_form_submissions','Forms','forms.readonly','GET','/forms/submissions',{formId:id(false),limit:page.limit,page:integer(1,10000,1)});
add('list_social_accounts','Social planner','socialplanner/account.readonly','GET','/social-media-posting/:locationId/accounts',{}, {location:'path'});
add('list_social_posts','Social planner','socialplanner/post.readonly','POST','/social-media-posting/:locationId/posts/list',{limit:page.limit,skip:page.offset},{location:'path',body:true,stringify:['limit','skip'],docs:doc('social-planner/get-posts')});
add('list_media','Media','medias.readonly','GET','/medias/files',{...page,query:str(),type:str(true,30),sortBy:choice(['updatedAt','name'],'updatedAt'),sortOrder:choice(['asc','desc'],'desc')},{location:'alt',docs:doc('medias/fetch-media-content')});
add('list_products','Products / prices / collections','products.readonly','GET','/products/',{...page,search:str()},{docs:doc('products/list-invoices')});
add('list_product_prices','Products / prices / collections','products/prices.readonly','GET','/products/:productId/price',{...page,productId:id()},{docs:doc('products/list-prices-for-product')});
add('list_product_collections','Products / prices / collections','products/collection.readonly','GET','/products/collections',{...page},{location:'alt',docs:doc('products/get-product-collection')});
for(const [name,scope,path] of [['list_orders','orders','orders'],['list_transactions','transactions','transactions'],['list_subscriptions','subscriptions','subscriptions']]) add(name,'Payments / orders / transactions / subscriptions',`payments/${scope}.readonly`,'GET',`/payments/${path}`,{...page},{location:'alt'});
add('list_invoices','Invoices / estimates','invoices.readonly','GET','/invoices/',{...page,search:str()},{location:'alt',docs:doc('invoices/list-invoices')});
add('list_estimates','Invoices / estimates','invoices/estimate.readonly','GET','/invoices/estimate/list',{...page,search:str()},{location:'alt',docs:doc('invoices/list-estimates')});
add('list_knowledge_bases','Knowledge bases','knowledge-bases.readonly','GET','/knowledge-bases/',{query:str(),limit:page.limit,lastKnowledgeBaseId:id(false)},{docs:doc('knowledge-base/list-all-knowledge-bases-paginated')});
add('list_surveys','Surveys','surveys.readonly','GET','/surveys/',{limit:page.limit});
add('list_survey_submissions','Surveys','surveys.readonly','GET','/surveys/submissions',{limit:page.limit,page:integer(1,10000,1),surveyId:id(false)});
add('list_custom_objects','Custom objects','objects/schema.readonly','GET','/objects/');
add('get_custom_object_record','Custom objects','objects/record.readonly','GET','/objects/:schemaKey/records/:recordId',{schemaKey:{...str(true,128),pattern:'^[A-Za-z0-9_.-]+$'},recordId:id()});
add('get_facebook_ad_report','Ad reporting','adPublishing.readonly','GET','/ad-publishing/facebook/reporting',{startDate:date,endDate:date,type:choice(['AD_MANAGER','INTEGRATION']),groupBy:choice(['day','week','month'],'day')},{fixed:{fields:'impressions,clicks,spend,conversions'},range:['startDate','endDate'],docs:doc('ad-publishing/fb-get-reporting'),note:'Requires an existing ad integration. Scope spelling differs in the aggregate docs; Marketplace spelling is authoritative. Provider acceptance still requires live validation.'});

// Validated write preparation only. No write dispatcher is enabled in this release.
const write={classification:'write',approvalRequired:true,execution:'approval_bridge_required',body:true,location:'token'};
add('create_contact_task','Tasks / tags / custom fields','contacts.write','POST','/contacts/:contactId/tasks',{contactId:id(),title:str(true,200),body:str(false,5000),dueDate:{...str(true,40),format:'datetime'},completed:{type:'boolean',default:false}}, {...write,docs:doc('contacts/create-task')});
add('add_contact_note','Contacts','contacts.write','POST','/contacts/:contactId/notes',{contactId:id(),body:str(true,10000)},write);
add('add_contact_tags','Tasks / tags / custom fields','contacts.write','POST','/contacts/:contactId/tags',{contactId:id(),tags:{type:'array',min:1,max:20,items:str(true,100)}},write);
add('update_opportunity_status','Opportunities','opportunities.write','PUT','/opportunities/:opportunityId/status',{opportunityId:id(),status:choice(['open','won','lost','abandoned'])},write);
add('create_url_redirect','Funnels / pages / redirects','funnels/redirect.write','POST','/funnels/lookup/redirect',{domain:{...str(true,253),pattern:'^[A-Za-z0-9.-]+$'},path:{...str(true,2000),pattern:'^/(?!/)'},target:{...str(true,2000),format:'https'}},{...write,location:'body',fixed:{action:'url'},docs:doc('funnels/create-redirect')});

add('create_blog_draft','Blogs','blogs/post.write','POST','/blogs/posts',{blogId:id(),title:str(true,300),rawHTML:str(true,40000),description:str(false,1000),urlSlug:{...str(false,200),pattern:'^[a-z0-9-]+$'}},{...write,location:'body',fixed:{status:'DRAFT'},docs:doc('blogs/create-blog-post')});
add('create_email_template','Email templates / campaigns / schedules / stats','emails/templates.write','POST','/emails/locations/:locationId/templates',{name:str(true,200),editorType:choice(['html','text']),editorContent:str(true,40000),subjectLine:str(false,200),previewText:str(false,300)},{...write,location:'path',docs:doc('emails/create-email-template')});
add('create_social_draft','Social planner','socialplanner/post.write','POST','/social-media-posting/:locationId/posts',{summary:str(true,3000)},{...write,location:'path',fixed:{status:'draft',type:'post'},docs:doc('social-planner/create-post')});

const limitations=[
  {family:'Courses',status:'unverified_read_endpoint',scopes:['courses.readonly'],note:'Marketplace selects courses.readonly, but the published Courses reference exposes only course import. No course listing endpoint is invented or requested.'},
  {family:'Funnels / pages / redirects',status:'unsupported_write',note:'No documented funnel/page content or layout write endpoint in the reviewed public API. Redirect creation is a separate supported preparation.'},
  {family:'Workflows',status:'unsupported_write',note:'Workflow listing is supported; no workflow-definition editor is documented in the reviewed public API.'},
  {family:'Forms',status:'unsupported_write',note:'forms.write documents file uploads, not a form-builder editor.'},
  {family:'Ad publishing',status:'deferred_write',note:'Publishing endpoints exist. Ad-spend and publish operations are intentionally excluded until the approval/idempotency bridge and budget validation are implemented.'}
];
const scopesForMode=mode=>[...new Set(Object.values(operations).filter(o=>o.classification==='read'||mode==='view_and_take_action').flatMap(o=>o.scopes))].sort();
const parseScopes=value=>new Set((Array.isArray(value)?value:String(value||'').split(/\s+/)).filter(Boolean));
const modeOf=c=>c?.permission_mode==='view_and_take_action'?'view_and_take_action':'view_only';
function capabilities(c={}) {
  const granted=parseScopes(c.oauth_scope),mode=modeOf(c),requested=scopesForMode(mode);
  const ops=Object.values(operations).map(o=>({name:o.name,family:o.family,classification:o.classification,required_scopes:o.scopes,missing_scopes:o.scopes.filter(s=>!granted.has(s)),status:o.classification==='write'?(mode==='view_only'?'view_only':o.scopes.every(s=>granted.has(s))?'approval_bridge_required':'reauthorization_required'):(o.scopes.every(s=>granted.has(s))?'available':'reauthorization_required')}));
  return {manifest_version:VERSION,permission_mode:mode,granted_scopes:[...granted].sort(),requested_scopes:requested,missing_scopes:requested.filter(s=>!granted.has(s)),reauthorization_required:requested.some(s=>!granted.has(s)),operations:ops,limitations};
}
for(const o of Object.values(operations)) {
  if(!o.docs) o.docs='https://marketplace.gohighlevel.com/docs/Authorization/Scopes/index.html';
  for(const scope of o.scopes) if(!audit.selected_scopes.includes(scope)) throw Error(`BMOD scope absent from audited Marketplace selection: ${scope}`);
  Object.freeze(o);
}
Object.freeze(operations);
module.exports={VERSION,operations,limitations,scopesForMode,parseScopes,modeOf,capabilities,audit};
