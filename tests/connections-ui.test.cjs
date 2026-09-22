const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const manifest=require('../bmod/manifest');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const ctx=vm.createContext({esc:s=>String(s).replaceAll('<','&lt;')});
vm.runInContext(html.slice(html.indexOf('function bmodNeedsPermissions('),html.indexOf('async function updateBmodPermissionMode')),ctx);
const old={status:'connected',...manifest.capabilities({oauth_scope:'locations.readonly contacts.readonly opportunities.readonly pipelines.readonly workflows.readonly'})};
test('old grant shows upgrade, verification and default permission control without disconnect',()=>{
 const controls=ctx.bmodControlsMarkup(old);
 assert.match(controls,/Update permissions/); assert.match(controls,/Verify reads \+ refresh/);
 assert.match(controls,/value="view_only" selected/);assert.match(controls,/View \+ Take Action/);
 assert.doesNotMatch(controls,/<button[^>]*disabled/);
});
test('metadata absence does not hide connection controls',()=>{
 assert.match(ctx.bmodControlsMarkup({status:'connected'}),/Update permissions/);
 assert.match(ctx.bmodControlsMarkup({status:'connected'}),/Connection permission/);
});
test('expanded reads clear upgrade; choosing actions restores upgrade when writes missing',()=>{
 const row={status:'connected',oauth_scope:manifest.scopesForMode('view_only').join(' ')};
 assert.doesNotMatch(ctx.bmodControlsMarkup({...row,...manifest.capabilities(row)}),/Update permissions/);
 assert.match(ctx.bmodControlsMarkup({...row,...manifest.capabilities({...row,permission_mode:'view_and_take_action'})}),/Update permissions/);
});
test('capabilities show readable groups with nested scoped details',()=>{
 const markup=ctx.bmodCapabilitiesMarkup(old);
 assert.match(markup,/<summary><strong>Contacts/);
 assert.match(markup,/1\/1 reads granted|2\/2 reads granted/);
 assert.doesNotMatch(markup,/Additional permissions requested:/);
});
test('diagnostic presents named before and after results and missing permission distinctly',()=>{
 const markup=ctx.bmodVerificationMarkup({refresh:'passed',status:'connected',checks:[{phase:'before_refresh',operation:'search_contacts',status:'passed'},{phase:'after_refresh',operation:'search_contacts',status:'missing_permission'}]});
 assert.match(markup,/Before refresh/);assert.match(markup,/After refresh/);
 assert.match(markup,/<th scope="row">Contacts<\/th><td>Passed<\/td><td>Update permissions required<\/td>/);
});
