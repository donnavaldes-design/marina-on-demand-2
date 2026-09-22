const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../bmod/manifest');
const r=require('../bmod/router');
const connection={status:'connected',permission_mode:'view_only',provider_account_id:'owned-location',oauth_scope:m.scopesForMode('view_and_take_action').join(' ')};
test('requested scopes are curated and every operation has an audited contract',()=>{
  assert.equal(m.audit.selected_scopes.length,120);
  assert.equal(m.scopesForMode('view_only').some(s=>s.endsWith('.write')),false);
  for(const op of Object.values(m.operations)) {
    assert.ok(op.endpoint.startsWith('/')&&!op.endpoint.startsWith('//'));
    assert.ok(op.scopes.length && op.scopes.every(s=>m.audit.selected_scopes.includes(s)));
    if(op.classification==='write')assert.equal(op.approvalRequired,true);
  }
  assert.ok(!m.scopesForMode('view_and_take_action').includes('adPublishing.write'));
  assert.ok(!m.scopesForMode('view_only').includes('courses.readonly'));
});
test('every read fails closed for a missing grant without making an HTTP request',async()=>{
  for(const op of Object.values(m.operations).filter(o=>o.classification==='read')) {
    const result=await r.execute({connection:{...connection,oauth_scope:''},operation:op.name,call:()=>assert.fail('must not dispatch')});
    assert.equal(result.error,'reauthorization_required',op.name);
  }
});
test('every write is blocked in default mode even with a broad token',async()=>{
  for(const op of Object.values(m.operations).filter(o=>o.classification==='write')) {
    const result=await r.execute({connection,operation:op.name,call:()=>assert.fail('write dispatched')});
    assert.equal(result.error,'view_only');assert.equal(result.executed,false);
  }
});
test('action mode prepares a validated task but never executes',async()=>{
  const c={...connection,permission_mode:'view_and_take_action'};
  const p={contactId:'contact-1',title:'Follow up',dueDate:'2026-10-01T12:00:00Z'};
  const result=await r.execute({connection:c,operation:'create_contact_task',parameters:p,call:()=>assert.fail('write dispatched')});
  assert.equal(result.status,'approval_bridge_required');assert.equal(result.executed,false);
  for(const injection of [{approved:true},{locationId:'other'},{method:'DELETE'},{url:'https://evil.invalid'},{approval_status:'approved'}])
    await assert.rejects(r.execute({connection:c,operation:'create_contact_task',parameters:{...p,...injection}}),/Unsupported parameter/);
});
test('router rejects arbitrary operations, cross-account parameters and unsafe IDs',async()=>{
  for(const operation of ['__proto__','constructor','/contacts/','delete_contact'])await assert.rejects(r.execute({connection,operation}),/Unsupported/);
  await assert.rejects(r.execute({connection,operation:'list_products',parameters:{locationId:'other'}}),/Unsupported/);
  await assert.rejects(r.execute({connection,operation:'get_contact',parameters:{contactId:'../contacts?locationId=other'}}),/format/);
  await assert.rejects(r.execute({connection,operation:'list_products',parameters:{limit:Infinity}}),/integer/);
  await assert.rejects(r.execute({connection,operation:'list_products',parameters:[]}),/JSON object/);
});
test('critical request contracts use correct verbs, pagination and tenant identifiers',()=>{
  const make=(name,p={})=>r.requestFor(m.operations[name],r.validate(m.operations[name],p),'owned-location');
  const opp=make('search_opportunities',{query:'hello'});assert.equal(opp.method,'GET');assert.match(opp.path,/q=hello/);
  const contact=make('search_contacts');assert.equal(contact.method,'POST');assert.equal(contact.body.locationId,'owned-location');assert.equal(contact.body.page,1);
  const social=make('list_social_posts');assert.equal(social.body.limit,'20');assert.equal(social.body.skip,'0');assert.match(social.path,/owned-location/);
  const blog=make('list_blogs',{offset:5});assert.match(blog.path,/skip=5/);
  assert.match(make('list_product_collections').path,/altId=owned-location/);
  assert.match(make('list_orders').path,/altId=owned-location/);
  assert.match(make('list_invoices').path,/altType=location/);
  assert.match(make('list_email_templates').path,/emails\/locations\/owned-location\/templates/);
  assert.equal(new URL(make('list_email_templates').path,'https://fixture.invalid').searchParams.get('limit'),'10');
});
test('draft preparation cannot be escalated into publishing or sending',async()=>{
  const c={...connection,permission_mode:'view_and_take_action'};
  const p={blogId:'blog',title:'Test',rawHTML:'<p>Test</p>'};
  const result=await r.execute({connection:c,operation:'create_blog_draft',parameters:p,call:()=>assert.fail('dispatch')});
  assert.equal(result.executed,false);
  await assert.rejects(r.execute({connection:c,operation:'create_blog_draft',parameters:{...p,status:'PUBLISHED'}}),/Unsupported parameter/);
  const req=r.requestFor(m.operations.create_blog_draft,r.validate(m.operations.create_blog_draft,p),'owned-location');assert.equal(req.body.status,'DRAFT');
});
test('discovery is generated from actual token grants and mode',async()=>{
  const data=await r.execute({connection:{...connection,oauth_scope:'contacts.readonly'},operation:'describe_operations',parameters:{family:'Contacts'}});
  assert.equal(data.reauthorization_required,true);
  assert.ok(data.operations.some(o=>o.name==='search_contacts'&&o.status==='available'));
  assert.ok(data.operations.every(o=>o.parameters));
  assert.equal(data.operations.find(o=>o.name==='add_contact_note').status,'view_only');
});
