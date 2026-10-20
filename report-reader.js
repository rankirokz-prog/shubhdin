// Reads the already approved PDF bytes. No client report generator or persistent PDF cache.
import {getDocument,GlobalWorkerOptions} from './vendor/pdfjs/pdf.min.mjs';
GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).href;
const LABELS={
 en:['My reports','Previous','Next','Page','Loading report…','Could not open the report. Close and try again.','Close','Zoom in','Zoom out'],
 te:['నా నివేదికలు','మునుపటి','తదుపరి','పేజీ','నివేదిక తెరుస్తున్నాము…','నివేదిక తెరవలేకపోయాము. మూసివేసి మళ్లీ ప్రయత్నించండి.','మూసివేయి','పెద్దగా చూపు','చిన్నగా చూపు'],
 hi:['मेरी रिपोर्ट','पिछला','अगला','पृष्ठ','रिपोर्ट खुल रही है…','रिपोर्ट नहीं खुल सकी। बंद करके फिर प्रयास करें।','बंद करें','बड़ा करें','छोटा करें'],
 kn:['ನನ್ನ ವರದಿಗಳು','ಹಿಂದಿನ','ಮುಂದಿನ','ಪುಟ','ವರದಿ ತೆರೆಯುತ್ತಿದೆ…','ವರದಿಯನ್ನು ತೆರೆಯಲಾಗಲಿಲ್ಲ. ಮುಚ್ಚಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.','ಮುಚ್ಚಿ','ದೊಡ್ಡದಾಗಿಸಿ','ಚಿಕ್ಕದಾಗಿಸಿ'],
 ta:['எனது அறிக்கைகள்','முந்தைய','அடுத்தது','பக்கம்','அறிக்கை திறக்கப்படுகிறது…','அறிக்கையைத் திறக்க முடியவில்லை. மூடி மீண்டும் முயற்சிக்கவும்.','மூடு','பெரிதாக்கு','சிறிதாக்கு'],
 bn:['আমার রিপোর্ট','আগের','পরের','পৃষ্ঠা','রিপোর্ট খুলছে…','রিপোর্ট খোলা যায়নি। বন্ধ করে আবার চেষ্টা করুন।','বন্ধ করুন','বড় করুন','ছোট করুন'],
 mr:['माझे अहवाल','मागील','पुढील','पृष्ठ','अहवाल उघडत आहे…','अहवाल उघडला नाही. बंद करून पुन्हा प्रयत्न करा.','बंद करा','मोठे करा','लहान करा'],
 gu:['મારા અહેવાલો','પાછલું','આગળનું','પાનું','અહેવાલ ખૂલી રહ્યો છે…','અહેવાલ ખોલી શકાયો નથી. બંધ કરીને ફરી પ્રયાસ કરો.','બંધ કરો','મોટું કરો','નાનું કરો'],
 as:['মোৰ প্ৰতিবেদন','আগৰ','পৰৱৰ্তী','পৃষ্ঠা','প্ৰতিবেদন খোলা হৈছে…','প্ৰতিবেদন খুলিব পৰা নগ’ল। বন্ধ কৰি পুনৰ চেষ্টা কৰক।','বন্ধ কৰক','ডাঙৰ কৰক','সৰু কৰক']
};
let active=null;
export function close(){
 const s=active;if(!s)return;active=null;s.closed=true;s.abort.abort();
 if(s.renderTask)s.renderTask.cancel();
 if(s.task)s.task.destroy().catch(()=>{});
 window.removeEventListener('resize',s.resize);window.removeEventListener('popstate',s.pop);
 s.dialog.remove();document.body.style.overflow=s.overflow;
 if(s.focus&&s.focus.isConnected)s.focus.focus();
 if(history.state&&history.state.sdPdfReader)history.back();
}
export async function open(url,options={}){
 close();if(!options.authorized||!options.authorized())return;
 const t=LABELS[options.lang]||LABELS.en;
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label',t[0]);
 dialog.style.cssText='position:fixed;inset:0;margin:0;padding:0;border:0;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;background:#242424;color:#fff;z-index:10000;';
 dialog.innerHTML=`<style>
 .sd-reader-bar{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;padding:10px;background:#1b120b;position:sticky;top:0;z-index:1}
 .sd-reader-bar button{font:inherit;font-size:14px;padding:9px 12px;min-height:44px;border:1px solid #a88845;border-radius:8px;background:#372a18;color:#fff;cursor:pointer}
 .sd-reader-bar button:disabled{opacity:.4;cursor:default}
 .sd-reader-status{text-align:center;padding:14px;font:16px sans-serif}
 .sd-reader-scroll{overflow:auto;height:calc(100dvh - 160px);padding:12px;box-sizing:border-box}
 .sd-reader-scroll canvas{display:block;margin:auto;background:white}
 .sd-reader-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
 </style><div class="sd-reader-bar"><button data-close></button><button data-download></button></div>
 <div class="sd-reader-bar"><button data-prev></button><span data-page aria-live="polite"></span><button data-next></button><button data-out>−</button><button data-in>+</button></div>
 <div class="sd-reader-status" role="status"></div><div class="sd-reader-scroll"><canvas></canvas><div class="sd-reader-sr" data-text></div></div>`;
 document.body.appendChild(dialog);
 const q=x=>dialog.querySelector(x),status=q('[role=status]'),canvas=q('canvas'),scroll=q('.sd-reader-scroll');
 const s={dialog,abort:new AbortController(),closed:false,page:1,zoom:1,sequence:0,overflow:document.body.style.overflow,focus:document.activeElement};
 active=s;document.body.style.overflow='hidden';
 q('[data-close]').textContent=t[6];q('[data-download]').textContent=options.downloadLabel||'Download PDF';
 q('[data-prev]').textContent=t[1];q('[data-next]').textContent=t[2];
 q('[data-in]').setAttribute('aria-label',t[7]);q('[data-out]').setAttribute('aria-label',t[8]);
 q('[data-close]').onclick=close;
 q('[data-download]').onclick=()=>{if(options.authorized())options.download();else close();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 s.pop=()=>close();window.addEventListener('popstate',s.pop);
 history.pushState({sdPdfReader:true},'',location.href);
 dialog.showModal();status.textContent=t[4];canvas.hidden=true;
 const controls=()=>{
  q('[data-prev]').disabled=!s.pdf||s.page<=1;q('[data-next]').disabled=!s.pdf||s.page>=s.pdf.numPages;
  q('[data-in]').disabled=!s.pdf||s.zoom>=2;q('[data-out]').disabled=!s.pdf||s.zoom<=1;
 };
 async function render(){
  if(s.closed||!s.pdf)return;
  const seq=++s.sequence;if(s.renderTask){s.renderTask.cancel();try{await s.renderTask.promise;}catch(e){}}
  if(s.closed||seq!==s.sequence)return;
  controls();status.textContent=t[4];
  try{
   const page=await s.pdf.getPage(s.page);if(s.closed||seq!==s.sequence)return;
   const base=page.getViewport({scale:1}),width=Math.max(240,scroll.clientWidth-24)*s.zoom;
   const viewport=page.getViewport({scale:width/base.width});
   const ratio=Math.min(devicePixelRatio||1,2,Math.sqrt(8000000/(viewport.width*viewport.height)));
   canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);
   canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';canvas.hidden=false;
   s.renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[ratio,0,0,ratio,0,0]});
   await s.renderTask.promise;if(s.closed||seq!==s.sequence)return;
   q('[data-page]').textContent=t[3]+' '+s.page+' / '+s.pdf.numPages;
   canvas.setAttribute('aria-label',q('[data-page]').textContent);status.textContent='';scroll.scrollTo(0,0);
   const text=await page.getTextContent();if(!s.closed&&seq===s.sequence)q('[data-text]').textContent=text.items.map(i=>i.str).join(' ');
  }catch(e){if(!s.closed&&seq===s.sequence&&e.name!=='RenderingCancelledException')status.textContent=t[5];}
 }
 q('[data-prev]').onclick=()=>{if(s.page>1){s.page--;render();}};
 q('[data-next]').onclick=()=>{if(s.pdf&&s.page<s.pdf.numPages){s.page++;render();}};
 q('[data-in]').onclick=()=>{s.zoom=Math.min(2,s.zoom+.25);render();};
 q('[data-out]').onclick=()=>{s.zoom=Math.max(1,s.zoom-.25);render();};
 s.resize=()=>render();window.addEventListener('resize',s.resize);controls();
 try{
  const source=new URL(url);source.searchParams.delete('download');source.searchParams.set('v',Date.now());
  const response=await fetch(source.href,{cache:'no-store',credentials:'omit',signal:s.abort.signal});
  if(!response.ok)throw Error('PDF unavailable');
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(s.closed)return;if(!options.authorized()){close();return;}
  s.task=getDocument({data:bytes,isEvalSupported:false});s.pdf=await s.task.promise;
  if(s.closed)return;if(!options.authorized()){close();return;}
  await render();
 }catch(e){if(!s.closed)status.textContent=t[5];}
}
