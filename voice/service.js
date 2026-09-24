'use strict';
const crypto=require('crypto');
const MAX_RECORDING_BYTES=3*1024*1024;
const MIME={'audio/webm':'webm','audio/mp4':'m4a','audio/ogg':'ogg','audio/wav':'wav','audio/mpeg':'mp3'};
function spokenText(text){return String(text||'').replace(/```[\s\S]*?```/g,' Code example omitted. ').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/https?:\/\/\S+/g,'').replace(/^[#>*\-]+\s*/gm,'').replace(/[*_`]/g,'').trim();}
async function readRecording(req){
 const mime=String(req.headers['content-type']||'').split(';')[0].toLowerCase();if(!MIME[mime])throw Error('Unsupported recording format. Try Chrome, Edge or Safari.');
 if(Number(req.headers['content-length'])>MAX_RECORDING_BYTES)throw Error('Recording is too large. Please record a shorter prompt.');
 const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_RECORDING_BYTES)throw Error('Recording is too large. Please record a shorter prompt.');parts.push(chunk);}
 if(!size)throw Error('No audio recorded. Please try again.');return {bytes:Buffer.concat(parts),mime};
}
function createVoiceService({sbRest,storageHeaders,fetcher=fetch}){
 const owner=id=>`user_id=eq.${encodeURIComponent(id)}`;
 const url=()=>process.env.NEXT_PUBLIC_SUPABASE_URL;
 async function patch(id,data){await sbRest(`voice_usage?id=eq.${id}`,{method:'PATCH',body:JSON.stringify(data)});}
 async function sign(path){
  const r=await fetcher(`${url()}/storage/v1/object/sign/mod-voice/${path}`,{method:'POST',headers:storageHeaders(true),body:JSON.stringify({expiresIn:900})});const j=await r.json();if(!r.ok)throw Error('Could not load saved audio. Please try again.');const signed=j.signedURL||j.signedUrl;if(!signed)throw Error('Saved audio link unavailable.');return /^https:\/\//.test(signed)?signed:`${url()}/storage/v1${signed.startsWith('/')?'':'/'}${signed}`;
 }
 async function transcribe(userId,recording){
  if(!MIME[recording.mime]||!recording.bytes.length||recording.bytes.length>MAX_RECORDING_BYTES)throw Error('Invalid recording.');
  const id=crypto.randomUUID();await sbRest('voice_usage',{method:'POST',body:JSON.stringify([{id,user_id:userId,kind:'dictation',provider:'openai',model:'whisper-1',status:'pending',input_bytes:recording.bytes.length}])});
  try{
   const form=new FormData();form.append('file',new Blob([recording.bytes],{type:recording.mime}),'prompt.'+MIME[recording.mime]);form.append('model','whisper-1');form.append('response_format','verbose_json');
   const r=await fetcher('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form,signal:AbortSignal.timeout(45000)});
   if(!r.ok)throw Error('Transcription is unavailable right now. Please try again or type your prompt.');const j=await r.json();
   await patch(id,{status:'completed',duration_seconds:Number(j.duration)||null,usage:j.usage||{}});
   if(Number(j.duration)>123)throw Error('Please keep recordings to two minutes or less.');
   return {text:String(j.text||'').trim()};
  }catch(e){await patch(id,{status:'failed'}).catch(()=>{});throw e;}
 }
 async function playback(userId,messageId){
  const rows=await sbRest(`messages?id=eq.${encodeURIComponent(messageId)}&${owner(userId)}&role=eq.assistant&select=id,content&limit=1`);const m=rows?.[0];if(!m)throw Error('Response not found.');
  const text=spokenText(m.content);if(!text)throw Error('There is no text to read.');if(text.length>4000)throw Error('This answer is too long for beta playback. Ask MOD for a shorter spoken summary.');
  const eleven=Boolean(process.env.ELEVENLABS_API_KEY&&process.env.ELEVENLABS_VOICE_ID);
  const provider=eleven?'elevenlabs':'openai',model=eleven?'eleven_multilingual_v2':'gpt-4o-mini-tts',voice=eleven?process.env.ELEVENLABS_VOICE_ID:'coral';
  const key=crypto.createHash('sha256').update(JSON.stringify([userId,m.id,provider,model,voice,text,'v1'])).digest('hex');
  const existing=await sbRest(`voice_usage?${owner(userId)}&cache_key=eq.${key}&select=id,status,storage_path&limit=1`);
  if(existing?.[0])return cached(existing[0]);
  const id=crypto.randomUUID(),path=`${userId}/${key}.mp3`;
  const claimed=await sbRest('voice_usage?on_conflict=cache_key',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify([{id,user_id:userId,message_id:m.id,kind:'playback',provider,model,status:'pending',cache_key:key,input_characters:text.length,storage_path:path}])});
  if(!claimed?.length)return {pending:true};
  try{
   const endpoint=eleven?`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`:'https://api.openai.com/v1/audio/speech';
   const body=eleven?{text,model_id:model}:{model,voice,input:text,response_format:'mp3',instructions:'Read the supplied text aloud exactly, with a warm, confident, conversational tone. Do not add words.'};
   const r=await fetcher(endpoint,{method:'POST',headers:{'content-type':'application/json',...(eleven?{'xi-api-key':process.env.ELEVENLABS_API_KEY}:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`})},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
   if(!r.ok)throw Error('Voice playback is unavailable for this response. You can still read the text.');
   const bytes=Buffer.from(await r.arrayBuffer());if(!bytes.length||bytes.length>10*1024*1024)throw Error('Audio could not be saved.');
   // Record generation before storage so a storage failure never triggers paid regeneration.
   await patch(id,{status:'generated',usage:{input_characters:text.length,output_bytes:bytes.length}});
   const upload=await fetcher(`${url()}/storage/v1/object/mod-voice/${path}`,{method:'POST',headers:storageHeaders(true,{'content-type':'audio/mpeg','x-upsert':'true'}),body:bytes});
   if(!upload.ok)throw Error('Audio was generated but could not be saved. Please contact support.');
   await patch(id,{status:'completed'});
  }catch(e){await patch(id,{status:'failed'}).catch(()=>{});throw e;}
  return {url:await sign(path),cached:false};
  async function cached(row){
   if(row.status==='completed')return {url:await sign(row.storage_path),cached:true};
   if(['pending','generated'].includes(row.status))return {pending:true};
   throw Error('Playback could not be prepared for this response. Please contact support; your text is still available.');
  }
 }
 return {transcribe,playback};
}
module.exports={createVoiceService,readRecording,spokenText,MAX_RECORDING_BYTES};
