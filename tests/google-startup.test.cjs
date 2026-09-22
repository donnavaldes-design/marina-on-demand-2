const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('OAuth startup renders Google controls before later module declarations execute',async()=>{
 const declaration=html.match(/const googleKeys=.*?;/)[0];
 assert.ok(html.indexOf(declaration)<html.indexOf('const config = await fetch'));
 const start=html.indexOf('function googleControlsMarkup');
 const end=html.indexOf('async function verifyGoogle',start);
 const context={esc:String};vm.createContext(context);
 const rendered=await vm.runInContext(`(async()=>{${declaration}\nreturn googleKeys.map(key=>googleControlsMarkup(key,{status:'connected',permission_mode:'view_only',operations:[]}));\n${html.slice(start,end)}\n})()`,context);
 assert.equal(rendered.length,3);for(const card of rendered){assert.match(card,/Verify reads \+ refresh/);assert.match(card,/View Only/);}
});
