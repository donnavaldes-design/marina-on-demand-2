const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../api.js'),'utf8');
test('reference-only personal notes are excluded from AI memory without deleting stored notes',()=>{
 const ctx={};vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function publicMemoryContext('),source.indexOf('function memorySnapshot(')),ctx);
 const memory={primary_goal:'Launch',brand_brain:{private_about:'Private reference',public_about:'I love gardening',business_links:[{name:'Website',url:'https://example.com'}]}};
 const result=ctx.publicMemoryContext(memory);assert.equal(result.brand_brain.private_about,undefined);assert.equal(result.brand_brain.public_about,'I love gardening');assert.equal(result.brand_brain.business_links[0].url,'https://example.com');assert.equal(memory.brand_brain.private_about,'Private reference');assert.equal(ctx.publicMemoryContext(null),null);
 assert.equal((source.match(/JSON.stringify\(publicMemoryContext\(memory\)\)/g)||[]).length,2);
});
