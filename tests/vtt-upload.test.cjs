const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {File}=require('node:buffer');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function uploadMimeType('),html.indexOf('async function uploadPendingFiles('));
const context=vm.createContext({File});
vm.runInContext(source,context);
test('VTT multipart payload is plain text and preserves all transcript bytes',async()=>{
  const transcript='WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello Queen! Café 👑\n';
  for(const type of ['text/vtt','application/octet-stream','']){
    const original=new File([transcript],'Training.VTT',{type});
    const body=context.uploadFileBody(original);
    assert.equal(body.type,'text/plain');
    assert.equal(body.name,'Training.VTT.txt');
    assert.equal(await body.text(),transcript);
    assert.equal(original.name,'Training.VTT');
    const form=new FormData();form.append('',body);
    const wire=await new Request('https://example.test',{method:'POST',body:form}).text();
    assert.match(wire,/Content-Type: text\/plain/);
    assert.doesNotMatch(wire,/Content-Type: text\/vtt/);
  }
});
test('other file uploads retain their original body',()=>{
  const file=new File(['pdf'],'document.pdf',{type:'application/pdf'});
  assert.equal(context.uploadFileBody(file),file);
});
