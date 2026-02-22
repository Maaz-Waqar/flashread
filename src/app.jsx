import { useState, useEffect, useRef, useCallback } from "react";



/* ── helpers ── */

const R = "#c0392b";

const MONO = "'DM Mono','Courier New',monospace";

const SERIF = "'EB Garamond',Georgia,serif";



function sp(t){ return t.split(/\s+/).filter(Boolean); }

function tok(t){ return t.split(/\s+/).map(w=>w.trim()).filter(Boolean); }

function orp(n){ return n<=1?0:n<=5?1:n<=9?2:n<=13?3:4; }

function ft(s){ if(s<60)return`${s}s`; const m=Math.floor(s/60),r=s%60; return r?`${m}m ${r}s`:`${m}m`; }



function loadScript(src,key){

  return new Promise((res,rej)=>{

    if(key&&window[key]){res();return;}

    if(document.querySelector(`script[src="${src}"]`)){

      const t=setInterval(()=>{if(!key||window[key]){clearInterval(t);res();}},50);return;

    }

    const s=document.createElement("script");

    s.src=src;s.onload=res;s.onerror=rej;

    document.head.appendChild(s);

  });

}

async function ensurePdf(){

  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js","pdfjsLib");

  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

}

async function ensureZip(){ await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js","JSZip"); }

async function ensureMam(){ await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js","mammoth"); }



async function readFile(file){

  const ext=file.name.split(".").pop().toLowerCase();

  if(["txt","md","csv","rtf"].includes(ext))return file.text();

  if(["html","htm"].includes(ext))return(await file.text()).replace(/<[^>]+>/g," ");

  if(ext==="pdf"){

    await ensurePdf();

    const buf=await file.arrayBuffer();

    const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;

    let o="";

    for(let i=1;i<=pdf.numPages;i++){

      const pg=await pdf.getPage(i);

      const ct=await pg.getTextContent();

      o+=ct.items.map(x=>x.str).join(" ")+" ";

    }

    return o;

  }

  if(["docx","doc"].includes(ext)){

    await ensureMam();

    const r=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});

    return r.value;

  }

  if(["pptx","ppt"].includes(ext)){

    await ensureZip();

    const zip=await window.JSZip.loadAsync(await file.arrayBuffer());

    const keys=Object.keys(zip.files)

      .filter(n=>/ppt\/slides\/slide\d+\.xml$/.test(n))

      .sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0]));

    let o="";

    for(const k of keys){

      const x=await zip.files[k].async("text");

      o+=(x.match(/<a:t[^>]*>([^<]+)<\/a:t>/g)||[]).map(m=>m.replace(/<[^>]+>/g,"")).join(" ")+" ";

    }

    return o;

  }

  if(ext==="epub"){

    await ensureZip();

    const zip=await window.JSZip.loadAsync(await file.arrayBuffer());

    const hs=Object.keys(zip.files).filter(n=>/\.(html?|xhtml)$/.test(n));

    let o="";

    for(const k of hs){

      const h=await zip.files[k].async("text");

      o+=h.replace(/<[^>]+>/g," ").replace(/&[a-z#0-9]+;/gi," ")+" ";

    }

    return o;

  }

  try{return file.text();}catch{return "";}

}



/* ── THEMES & FONTS ── */

const THEMES=[

  {id:"dark",  bg:"#020202",surface:"#09090f",text:"#ddd",dim:"#888",sub:"#2a2a2a",border:"#111",guide:"rgba(192,57,43,0.14)"},

  {id:"sepia", bg:"#f3e9d8",surface:"#ede0ca",text:"#2c1a0e",dim:"#7a5c3e",sub:"#b09070",border:"#d4c0a0",guide:"rgba(120,70,20,0.18)"},

  {id:"light", bg:"#f7f7f7",surface:"#eeeeee",text:"#111",dim:"#666",sub:"#bbb",border:"#ddd",guide:"rgba(192,57,43,0.14)"},

];

const FONTS=[

  {id:"garamond", label:"EB Garamond",    url:"EB+Garamond:wght@300;400;500",              css:"'EB Garamond',Georgia,serif",         note:"Classical · gold standard for books"},

  {id:"crimson",  label:"Crimson Pro",    url:"Crimson+Pro:wght@300;400;500",              css:"'Crimson Pro',Georgia,serif",         note:"Designed for long-form reading"},

  {id:"basker",   label:"Libre Baskerville",url:"Libre+Baskerville:wght@400",             css:"'Libre Baskerville',Georgia,serif",   note:"High contrast · crisp at small sizes"},

  {id:"atkinson", label:"Atkinson",       url:"Atkinson+Hyperlegible:wght@400;700",        css:"'Atkinson Hyperlegible',sans-serif",  note:"Accessibility-first · max legibility"},

];



/* ── tutorial phases ── */

const PHASES=[

  {wpm:270,badge:"CHAPTER 1 · THE PROBLEM",      words:sp("You read every single day. Emails. Reports. Textbooks. Articles. Yet the average person reads at two hundred and fifty words per minute. That is the same speed humans have read at for centuries. Your brain however is capable of something far more extraordinary.")},

  {wpm:310,badge:"CHAPTER 2 · THE BOTTLENECK",   words:sp("Right now there is a little voice in your head reading these words aloud. Researchers call it subvocalization. It feels helpful but it is your biggest enemy. That voice is capped at the speed of speech. About one hundred and fifty words per minute. It is a ceiling you did not even know existed.")},

  {wpm:360,badge:"CHAPTER 3 · SILENCE THE VOICE",words:sp("Here is your first exercise. Try to read without saying the words internally. Do not mouth them. Just look at the red letter. Let the meaning arrive without speaking it. Your brain decodes language far faster than speech. Trust it. Subvocalization is a habit not a requirement.")},

  {wpm:420,badge:"CHAPTER 4 · THE ANCHOR",       words:sp("See the red letter in every word. That is your Optimal Recognition Point. Research shows your brain identifies an entire word from a single anchor. Your eyes never needed to scan left to right. Fix your gaze here and let words flow into your mind without effort or movement.")},

  {wpm:480,badge:"CHAPTER 5 · WHAT THIS MEANS",  words:sp("At five hundred words per minute you finish a two hundred page book in under three hours instead of eight. You process your inbox in four minutes instead of twenty. A full industry report absorbed during lunch. Every reading hour now returns twice the insight in half the time.")},

  {wpm:540,badge:"CHAPTER 6 · THE SCIENCE",       words:sp("Research confirms speed readers comprehend material as well as or better than traditional readers. Each word arrives at peak focus. No wandering. No re-reading. No zoning out. Pure signal flowing directly into your mind. You are now reading faster than ninety percent of people on this planet.")},

  {wpm:580,badge:"CHAPTER 7 · YOUR NEW REALITY",  words:sp("Imagine finishing every book on your list this year. Staying ahead at work without working longer. Learning a new skill every month. Remembering more. Your library your documents your entire industry all absorbed and retained. Upload your first document. Your old reading speed is already history.")},

];



/* ══════════════════════════════════════════════════════════

   WORD DISPLAY

══════════════════════════════════════════════════════════ */

function WordView({word,fs=64,fontCss,color="#ddd"}){

  const o=orp(word.length),b=word.slice(0,o),p=word[o]||"",a=word.slice(o+1);

  return(

    <div style={{animation:"wIn .14s ease-out both"}}>

      <div style={{display:"flex",alignItems:"baseline",width:"min(640px,88vw)"}}>

        <span style={{fontFamily:fontCss,fontWeight:300,color,letterSpacing:3,flex:"0 0 44%",display:"flex",justifyContent:"flex-end",overflow:"hidden",lineHeight:1,fontSize:fs}}>{b}</span>

        <span style={{fontFamily:fontCss,fontWeight:600,color:R,letterSpacing:3,flex:"0 0 12%",textAlign:"center",lineHeight:1,fontSize:fs}}>{p}</span>

        <span style={{fontFamily:fontCss,fontWeight:300,color,letterSpacing:3,flex:"0 0 44%",display:"flex",justifyContent:"flex-start",overflow:"hidden",lineHeight:1,fontSize:fs}}>{a}</span>

      </div>

    </div>

  );

}



/* ══════════════════════════════════════════════════════════

   TUTORIAL

══════════════════════════════════════════════════════════ */

function Tutorial({onDone}){

  const [started,setStarted]=useState(false);

  const [pi,setPi]=useState(0);

  const [wi,setWi]=useState(0);

  const [between,setBetween]=useState(false);

  const [done,setDone]=useState(false);

  const tRef=useRef(null);

  const piRef=useRef(0);



  const go=useCallback((idx)=>{

    piRef.current=idx; setPi(idx); setWi(0); setBetween(false);

  },[]);



  useEffect(()=>{

    if(!started||between||done)return;

    clearInterval(tRef.current);

    const ph=PHASES[piRef.current];

    const ms=(60/ph.wpm)*1000;

    tRef.current=setInterval(()=>{

      setWi(prev=>{

        if(prev>=ph.words.length-1){clearInterval(tRef.current);setBetween(true);return prev;}

        return prev+1;

      });

    },ms);

    return()=>clearInterval(tRef.current);

  },[started,pi,between,done]);



  useEffect(()=>{

    if(!between)return;

    const next=piRef.current+1;

    if(next>=PHASES.length){

      const t=setTimeout(()=>setDone(true),700);

      return()=>clearTimeout(t);

    }

    const t=setTimeout(()=>go(next),1100);

    return()=>clearTimeout(t);

  },[between,go]);



  const ph=PHASES[pi];

  const pct=started?((pi/PHASES.length)+(wi/(ph.words.length*PHASES.length)))*100:0;



  if(done)return(

    <Page>

      <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",gap:20,textAlign:"center",padding:"0 24px",maxWidth:460,animation:"fadeUp .6s ease both"}}>

        <div style={{fontSize:48,color:"#2e7d32"}}>✓</div>

        <h2 style={{fontFamily:SERIF,fontSize:32,fontWeight:300,color:"#fff"}}>You're ready.</h2>

        <p style={{fontSize:12,color:"#3a3a3a",lineHeight:1.9,maxWidth:340}}>Upload any document and start reading faster than 90% of people — while understanding every word.</p>

        <Btn onClick={onDone}>Upload a Document →</Btn>

      </div>

    </Page>

  );



  if(!started)return(

    <Page>

      <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",gap:16,textAlign:"center",padding:"0 22px",maxWidth:480,animation:"fadeUp .7s ease both"}}>

        <Brand/>

        <h1 style={{fontFamily:SERIF,fontSize:34,fontWeight:300,color:"#fff",lineHeight:1.25}}>Read faster than<br/>90% of people.</h1>

        <p style={{fontSize:12,color:"#323232",lineHeight:1.9,maxWidth:360}}>And remember everything. A 90-second tutorial rewires how your brain absorbs text — permanently.</p>

        <div style={{display:"flex",width:"100%",background:"#07070d",border:"1px solid #0e0e0e",borderRadius:11,overflow:"hidden"}}>

          {[["3×","faster reading"],["90%","comprehension"],["8hrs","saved/week"]].map(([n,l],i,a)=>(

            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"13px 0",gap:3,borderRight:i<a.length-1?"1px solid #0e0e0e":"none"}}>

              <span style={{fontFamily:SERIF,fontSize:20,fontWeight:600,color:R}}>{n}</span>

              <span style={{fontSize:9,color:"#222",letterSpacing:1}}>{l}</span>

            </div>

          ))}

        </div>

        <Btn onClick={()=>setStarted(true)}>Begin Free Tutorial →</Btn>

        <Ghost onClick={onDone}>Skip, take me to upload</Ghost>

      </div>

    </Page>

  );



  return(

    <Page>

      <div style={{position:"absolute",top:18,fontSize:9,color:R,letterSpacing:2,fontFamily:MONO,background:"rgba(192,57,43,0.07)",border:"1px solid rgba(192,57,43,0.12)",padding:"5px 13px",borderRadius:50,zIndex:3,opacity:between?0:1,transition:"opacity .4s"}}>{ph.badge}</div>

      <GuideLines color="rgba(192,57,43,0.12)"/>

      <div style={{position:"relative",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center",width:"100%"}}>

        {between

          ? <div style={{fontSize:14,color:"#1a1a1a",fontFamily:MONO,letterSpacing:3}}>

              {pi+1<PHASES.length?<><span style={{color:R}}>↑</span> {PHASES[pi+1].wpm} wpm</>:"…"}

            </div>

          : <WordView word={ph.words[wi]||""} fs={54} fontCss={SERIF} key={`${pi}-${wi}`}/>

        }

      </div>

      <div style={{position:"absolute",bottom:16,right:18,fontSize:9,color:"#1a1a1a",fontFamily:MONO,letterSpacing:1,zIndex:3}}>{ph.wpm} wpm</div>

      <div style={{position:"absolute",bottom:32,display:"flex",gap:5,zIndex:3}}>

        {PHASES.map((_,i)=>(

          <div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===pi?R:i<pi?"#2a0808":"#0e0e0e",transform:i===pi?"scale(1.5)":"scale(1)",transition:"all .3s"}}/>

        ))}

      </div>

      <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:"#080808"}}>

        <div style={{height:"100%",background:R,width:`${pct}%`,transition:"width .15s"}}/>

      </div>

      <button onClick={onDone} style={{position:"absolute",bottom:12,right:16,background:"transparent",color:"#181818",fontSize:9,fontFamily:MONO,letterSpacing:1,border:"none",cursor:"pointer",zIndex:3}}>Skip →</button>

    </Page>

  );

}



/* ══════════════════════════════════════════════════════════

   HOME

══════════════════════════════════════════════════════════ */

function Home({onStart}){

  const [tab,setTab]=useState("upload");

  return(

    <Page>

      <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:560,height:"100%",maxHeight:"94vh",display:"flex",flexDirection:"column"}}>

        <div style={{padding:"16px 20px 0",flexShrink:0,display:"flex",flexDirection:"column",gap:12}}>

          <Brand/>

          <div style={{display:"flex",background:"#07070d",border:"1px solid #0e0e0e",borderRadius:9,overflow:"hidden"}}>

            {[["upload","📁 My Library"],["store","🛒 Book Store"]].map(([id,lbl])=>(

              <button key={id} onClick={()=>setTab(id)}

                style={{flex:1,padding:"9px",fontSize:11,fontFamily:MONO,border:"none",cursor:"pointer",background:tab===id?R:"transparent",color:tab===id?"#fff":"#282828",transition:"all .2s",letterSpacing:.5}}>

                {lbl}

              </button>

            ))}

          </div>

        </div>

        <div style={{flex:1,overflow:"hidden",padding:"0 20px 16px"}}>

          {tab==="upload"?<UploadTab onStart={onStart}/>:<StoreTab onStart={onStart}/>}

        </div>

      </div>

    </Page>

  );

}



/* ── Upload Tab ── */

const WPRESETS=[

  {label:"Comfortable",sub:"~200 wpm",range:[0,275],   pick:200},

  {label:"Normal",     sub:"~300 wpm",range:[275,375], pick:300},

  {label:"Fast",       sub:"~420 wpm",range:[375,525], pick:420},

  {label:"Expert",     sub:"~600 wpm",range:[525,725], pick:600},

  {label:"Blazing",    sub:"900+ wpm",range:[725,9999],pick:900},

];



function UploadTab({onStart}){

  const [dragging,setDragging]=useState(false);

  const [file,setFile]=useState(null);

  const [loading,setLoading]=useState(false);

  const [err,setErr]=useState("");

  const [words,setWords]=useState([]);

  const [wpm,setWpm]=useState(300);

  const [si,setSi]=useState(0);

  const [step,setStep]=useState("drop");

  const uid=useRef("fr-"+Math.random().toString(36).slice(2));



  const handleF=async(f)=>{

    if(!f)return;

    setFile(f);setErr("");setLoading(true);

    try{

      const text=await readFile(f);

      const w=tok(text);

      if(w.length<10){setErr("Couldn't extract enough text.");setLoading(false);return;}

      setWords(w);setSi(0);setStep("config");

    }catch(e){setErr("Error: "+(e.message||""));}

    setLoading(false);

  };



  const sel=WPRESETS.find(p=>wpm>=p.range[0]&&wpm<p.range[1]);

  const eta=ft(Math.ceil(((words.length-si)/wpm)*60));

  const preview=words.slice(si,si+14).join(" ")+(words.length>si+14?"…":"");



  if(step==="config")return(

    <div style={{display:"flex",flexDirection:"column",gap:12,paddingTop:12,overflowY:"auto",height:"100%",paddingBottom:4}}>

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",background:"#07070d",border:"1px solid #0e0e0e",borderRadius:8}}>

        <span>📄</span>

        <span style={{flex:1,fontSize:11,color:"#555",fontFamily:MONO,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</span>

        <span style={{fontSize:10,color:"#222",fontFamily:MONO,whiteSpace:"nowrap"}}>{words.length.toLocaleString()} words</span>

      </div>



      <Card label="Reading Speed">

        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>

          {WPRESETS.map(p=>(

            <button key={p.label} onClick={()=>setWpm(p.pick)}

              style={{flex:1,minWidth:70,background:sel?.label===p.label?"rgba(192,57,43,0.08)":"transparent",border:`1px solid ${sel?.label===p.label?R:"#0e0e0e"}`,borderRadius:7,padding:"7px 3px",display:"flex",flexDirection:"column",gap:2,alignItems:"center",cursor:"pointer"}}>

              <span style={{fontSize:10,color:sel?.label===p.label?R:"#3a3a3a",fontFamily:MONO}}>{p.label}</span>

              <span style={{fontSize:8,color:"#1e1e1e",fontFamily:MONO}}>{p.sub}</span>

            </button>

          ))}

        </div>

        <div style={{display:"flex",alignItems:"center",gap:10}}>

          <span style={{fontSize:11,color:R,fontFamily:MONO,minWidth:52}}>{wpm} wpm</span>

          <input type="range" min={50} max={1200} step={25} value={wpm} onChange={e=>setWpm(+e.target.value)} style={{flex:1}}/>

        </div>

        <div style={{display:"flex",justifyContent:"space-between"}}>

          <span style={{fontSize:10,color:"#1a1a1a",fontFamily:MONO}}>Reading time:</span>

          <span style={{fontSize:10,color:"#3a3a3a",fontFamily:MONO}}>{eta}</span>

        </div>

      </Card>



      <Card label="Start Position">

        <div style={{display:"flex",alignItems:"center",gap:8}}>

          <span style={{fontSize:10,color:"#3a3a3a",fontFamily:MONO,minWidth:58}}>Word {si+1}</span>

          <input type="range" min={0} max={Math.max(0,words.length-1)} value={si} onChange={e=>setSi(+e.target.value)} style={{flex:1}}/>

          <span style={{fontSize:10,color:"#222",fontFamily:MONO,minWidth:34,textAlign:"right"}}>{words.length}</span>

        </div>

        <div style={{background:"#040404",border:"1px solid #0a0a0a",borderRadius:6,padding:"8px 10px",fontSize:11,color:"#363636",lineHeight:1.7,fontFamily:SERIF,minHeight:38}}>

          <span style={{fontSize:9,color:"#141414",fontFamily:MONO}}>Starts: </span>{preview}

        </div>

        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>

          {[["Beginning",0],["Skip intro ~8%",Math.floor(words.length*.08)],["25%",Math.floor(words.length*.25)],["50%",Math.floor(words.length*.5)]].map(([l,v])=>(

            <button key={l} onClick={()=>setSi(v)} style={{background:"transparent",border:"1px solid #0d0d0d",borderRadius:5,padding:"3px 8px",fontSize:9,color:"#222",fontFamily:MONO,cursor:"pointer"}}>{l}</button>

          ))}

        </div>

      </Card>



      <Btn onClick={()=>onStart(words,file.name,wpm,si)}>Start Reading →</Btn>

      <Ghost onClick={()=>setStep("drop")}>← Change file</Ghost>

    </div>

  );



  return(

    <div style={{display:"flex",flexDirection:"column",gap:12,paddingTop:12}}>

      <label htmlFor={uid.current} style={{display:"block",cursor:"pointer"}}>

        <input id={uid.current} type="file" style={{display:"none"}} accept=".pdf,.docx,.doc,.pptx,.ppt,.epub,.txt,.md,.csv,.rtf,.html"

          onChange={e=>{if(e.target.files[0])handleF(e.target.files[0]);}}/>

        <div

          onDragOver={e=>{e.preventDefault();setDragging(true);}}

          onDragLeave={()=>setDragging(false)}

          onDrop={e=>{e.preventDefault();setDragging(false);if(!loading&&e.dataTransfer.files[0])handleF(e.dataTransfer.files[0]);}}

          style={{width:"100%",border:`1px dashed ${dragging?R:"#0e0e0e"}`,borderRadius:13,padding:"34px 18px",display:"flex",flexDirection:"column",alignItems:"center",gap:9,background:dragging?"rgba(192,57,43,0.04)":"#07070d",opacity:loading?.7:1,transition:"all .2s",cursor:"pointer"}}>

    
