const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const cancel=require('../chat-cancellation');
test('disconnect cancels only that request and blocks further work',async()=>{
 let release;const gate=new Promise(r=>release=r),signals=[];
 const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{signals.push(options.signal);return {};};
 const handler=cancel.wrap(async()=>{await cancel.fetch('https://example.com');await gate;cancel.checkpoint();});
 const a=new EventEmitter(),b=new EventEmitter();
 try{
  const first=handler({method:'POST',url:'/api/chat'},a),second=handler({method:'POST',url:'/api/chat'},b);
  await new Promise(r=>setImmediate(r));a.emit('close');
  assert.equal(signals[0].aborted,true);assert.equal(signals[1].aborted,false);
  release();await assert.rejects(first,{name:'AbortError'});await second;
  assert.equal(a.listenerCount('close'),0);assert.equal(b.listenerCount('close'),0);
 }finally{globalThis.fetch=original;}
});
test('normal response completion does not cancel work',async()=>{
 const res=new EventEmitter();await cancel.wrap(async()=>{res.writableEnded=true;res.emit('close');cancel.checkpoint();})({method:'POST',url:'/api/chat'},res);
});
