'use strict';
const PDFDocument=require('pdfkit');
const path=require('path');

const plain=s=>String(s||'').replace(/!\[([^\]]*)\]\([^)]*\)/g,'[Image: $1]').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1 ($2)').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/<[^>]*>/g,'').replace(/[\u{1F000}-\u{1FFFF}\uFE0F]/gu,'');
async function renderPdf({title,content}){
 const {marked}=await import('marked');
 if(!content||content.length>150000)throw Error('PDF exports support up to 150,000 characters. Export a shorter response.');
 const doc=new PDFDocument({size:'A4',margins:{top:72,bottom:66,left:52,right:52},bufferPages:true,info:{Title:plain(title),Author:'Marina On Demand'}});
 doc.registerFont('Body',path.join(__dirname,'fonts/Poppins-Regular.ttf'));
 doc.registerFont('Bold',path.join(__dirname,'fonts/Poppins-Bold.ttf'));
 const chunks=[];const done=new Promise((resolve,reject)=>{doc.on('data',x=>chunks.push(x));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 const width=491; const bottom=doc.page.height-66;
 const ensure=h=>{if(doc.y+h>bottom)doc.addPage();};
 function text(s,{size=10,font='Body',color='#332922',indent=0,raw=false}={}){
  const value=raw?String(s):plain(s); if(!value)return;
  doc.font(font).fontSize(size).fillColor(color);
  doc.text(value,52+indent,doc.y,{width:width-indent,lineGap:4,paragraphGap:6});
  doc.x=52;
 }
 function blocks(tokens){for(const t of tokens){
  if(t.type==='space')continue;
  if(t.type==='heading'){ensure(65);doc.moveDown(.5);text(t.text,{size:t.depth===1?20:t.depth===2?15:12,font:'Bold',color:'#087E80'});}
  else if(t.type==='paragraph'||t.type==='text'){text(t.text);doc.moveDown(.45);}
  else if(t.type==='list'){for(let i=0;i<t.items.length;i++){ensure(30);text((t.ordered?String(Number(t.start||1)+i)+'. ':'• ')+t.items[i].text,{indent:12});}doc.moveDown(.4);}
  else if(t.type==='table'){
   // Stacked records stay readable on phones, including wide or very long tables.
   const headers=t.header.map(c=>plain(c.text));
   for(let i=0;i<t.rows.length;i++){ensure(55);doc.moveDown(.3);text(t.rows[i].map((c,j)=>`${headers[j]}: ${plain(c.text)}`).join('\n'));doc.moveDown(.35);doc.moveTo(52,doc.y).lineTo(543,doc.y).strokeColor('#E8DCD5').stroke();doc.moveDown(.4);}
  }
  else if(t.type==='blockquote'){ensure(40);text(t.text,{indent:14,color:'#62564F'});doc.moveDown(.5);}
  else if(t.type==='code'){ensure(35);text(t.text,{size:8,indent:10,raw:true});doc.moveDown(.5);}
  else if(t.type==='hr'){ensure(20);doc.moveTo(52,doc.y).lineTo(543,doc.y).strokeColor('#D8EBE9').stroke();doc.moveDown();}
  else if(t.raw){text(t.raw);}
 }}
 text(title,{size:24,font:'Bold'});doc.moveDown(.6);
 blocks(marked.lexer(content));
 const pages=doc.bufferedPageRange();
 for(let i=pages.start;i<pages.start+pages.count;i++){
  doc.switchToPage(i);doc.save();
  const bottomMargin=doc.page.margins.bottom;doc.page.margins.bottom=0;
  doc.rect(0,0,doc.page.width,7).fill('#0ABAB5');
  doc.font('Bold').fontSize(9).fillColor('#087E80').text('MARINA ON DEMAND',52,30,{lineBreak:false});
  doc.font('Body').fontSize(8).fillColor('#756960').text(`${i+1} / ${pages.count}`,52,doc.page.height-40,{width:491,align:'right',lineBreak:false});
  doc.page.margins.bottom=bottomMargin;doc.restore();
 }
 doc.end();return done;
}
module.exports={renderPdf,plain};
