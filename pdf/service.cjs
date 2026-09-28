'use strict';
const crypto=require('crypto');
const {renderPdf,plain}=require('./render.cjs');
function createPdfService({sbRest,sign,storageHeaders,fetcher=fetch,render=renderPdf}){
 const valid=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
 const own=id=>`user_id=eq.${encodeURIComponent(id)}`;
 async function exportMessage(userId,messageId){
  if(!valid(messageId))throw Error('Choose a saved MOD response to export.');
  const messages=await sbRest(`messages?id=eq.${messageId}&${own(userId)}&role=eq.assistant&select=id,conversation_id,content&limit=1`);
  const m=messages?.[0];if(!m)throw Error('Response not found.');
  const hash=crypto.createHash('sha256').update(userId+'|'+m.id+'|pdf-v1|'+m.content).digest('hex');
  const id=`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
  const prior=await sbRest(`workspace_items?id=eq.${id}&${own(userId)}&select=id,metadata&limit=1`);
  const storagePath=`${userId}/pdf/${id}.pdf`;
  if(prior?.[0]?.metadata?.generated_pdf&&prior[0].metadata.storage_path===storagePath)return {url:await sign(storagePath),assetId:id,fileName:prior[0].metadata.file_name};
  const title=plain(String(m.content||'').split('\n').find(x=>x.trim())||'MOD document').replace(/^#+\s*/,'').slice(0,100);
  const bytes=await render({title,content:m.content});
  if(bytes.length>20*1024*1024)throw Error('This PDF is too large. Export a shorter response.');
  const upload=await fetcher(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/marina-attachments/${storagePath}`,{method:'POST',headers:storageHeaders(true,{'content-type':'application/pdf','x-upsert':'true'}),body:bytes});
  if(!upload.ok)throw Error('The PDF could not be saved. Please try again.');
  const fileName=(title.replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,80)||'MOD-document')+'.pdf';
  await sbRest('workspace_items?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify([{id,user_id:userId,section:'assets',title,content:m.content,status:'active',pinned:false,source_conversation_id:m.conversation_id,source_message_id:m.id,metadata:{generated_pdf:true,storage_path:storagePath,file_name:fileName,mime_type:'application/pdf',size_bytes:bytes.length}}])});
  return {url:await sign(storagePath),assetId:id,fileName};
 }
 async function download(userId,assetId){
  if(!valid(assetId))throw Error('PDF not found.');
  const rows=await sbRest(`workspace_items?id=eq.${assetId}&${own(userId)}&select=metadata&limit=1`);
  const meta=rows?.[0]?.metadata,expected=`${userId}/pdf/${assetId}.pdf`;
  if(!meta?.generated_pdf||meta.storage_path!==expected)throw Error('PDF not found.');
  return {url:await sign(expected),fileName:meta.file_name};
 }
 return {exportMessage,download};
}
module.exports={createPdfService};
