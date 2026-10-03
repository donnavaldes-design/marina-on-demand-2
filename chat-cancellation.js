const {AsyncLocalStorage}=require('node:async_hooks');
const context=new AsyncLocalStorage();
function checkpoint(){context.getStore()?.signal.throwIfAborted();}
function scopedFetch(url,options={}){
  const signal=context.getStore()?.signal;
  if(!signal)return globalThis.fetch(url,options);
  signal.throwIfAborted();
  return globalThis.fetch(url,{...options,signal:options.signal?AbortSignal.any([signal,options.signal]):signal});
}
function wrap(handler){
  return async function(req,res){
    if(req.method!=='POST'||new URL(req.url,'https://local.invalid').pathname!=='/api/chat')return handler(req,res);
    const controller=new AbortController();
    const close=()=>{if(!res.writableEnded)controller.abort(new DOMException('Response stopped','AbortError'));};
    const error=e=>{if(e?.message==='aborted'||e?.code==='ECONNRESET')close();};
    res.once('close',close);req.on?.('error',error);req.signal?.addEventListener('abort',close,{once:true});
    if(req.signal?.aborted)close();
    try{return await context.run({signal:controller.signal},()=>handler(req,res));}
    finally{res.removeListener('close',close);req.removeListener?.('error',error);req.signal?.removeEventListener('abort',close);}
  };
}
module.exports={wrap,fetch:scopedFetch,checkpoint};
