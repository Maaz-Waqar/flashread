import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const RED = "#e8372a";
const MONO = "'DM Mono','Courier New',monospace";
const SERIF = "'Playfair Display',Georgia,serif";
const SANS = "'DM Sans',system-ui,sans-serif";

function sp(t){ return t.split(/\s+/).filter(Boolean); }
function tok(t){ return t.split(/\s+/).map(w=>w.trim()).filter(Boolean); }
function ft(s){ if(s<60)return`${s}s`; const m=Math.floor(s/60),r=s%60; return r?`${m}m ${r}s`:`${m}m`; }

/* ── persistent anchor letter ── */
const VOWELS = 'aeiouAEIOU';
function getAnchorInfo(word, prevAnchor) {
  if (!word) return { before:'', anchor:'', after:'', anchorChar:'' };
  if (prevAnchor) {
    const idx = word.toLowerCase().indexOf(prevAnchor.toLowerCase());
    if (idx !== -1) return { before:word.slice(0,idx), anchor:word[idx], after:word.slice(idx+1), anchorChar:prevAnchor.toLowerCase() };
  }
  for (let i=0;i<word.length;i++) {
    if (VOWELS.includes(word[i])) return { before:word.slice(0,i), anchor:word[i], after:word.slice(i+1), anchorChar:word[i].toLowerCase() };
  }
  const mid = Math.floor(word.length/2);
  return { before:word.slice(0,mid), anchor:word[mid]||'', after:word.slice(mid+1), anchorChar:(word[mid]||'').toLowerCase() };
}

/* ── themes ── */
const THEMES=[
  {id:"obsidian",bg:"#080810",surface:"#0d0d1a",text:"#e8e4f0",dim:"#666",sub:"#222",border:"rgba(255,255,255,0.06)",guide:"rgba(232,55,42,0.08)"},
  {id:"sepia",   bg:"#f5efe4",surface:"#ede3d2",text:"#2a1a0a",dim:"#7a5c3e",sub:"#c4a882",border:"rgba(0,0,0,0.08)",guide:"rgba(160,80,20,0.12)"},
  {id:"paper",   bg:"#fafafa", surface:"#f2f2f2",text:"#111",   dim:"#888",  sub:"#ccc",  border:"rgba(0,0,0,0.07)", guide:"rgba(232,55,42,0.08)"},
];
const FONTS=[
  {id:"playfair",   label:"Playfair Display",    url:"Playfair+Display:wght@400;500;600",       css:"'Playfair Display',Georgia,serif",       note:"Elegant · editorial"},
  {id:"crimson",    label:"Crimson Pro",          url:"Crimson+Pro:wght@300;400;500",            css:"'Crimson Pro',Georgia,serif",             note:"Long-form reading"},
  {id:"baskerville",label:"Libre Baskerville",    url:"Libre+Baskerville:wght@400",             css:"'Libre Baskerville',Georgia,serif",       note:"High contrast"},
  {id:"atkinson",   label:"Atkinson Hyperlegible",url:"Atkinson+Hyperlegible:wght@400;700",     css:"'Atkinson Hyperlegible',sans-serif",      note:"Max legibility"},
];

const PHASES=[
  {wpm:270,badge:"01 · THE PROBLEM",       words:sp("You read every single day. Emails. Reports. Textbooks. Articles. Yet the average person reads at two hundred and fifty words per minute. That is the same speed humans have read at for centuries. Your brain however is capable of something far more extraordinary.")},
  {wpm:310,badge:"02 · THE BOTTLENECK",    words:sp("Right now there is a little voice in your head reading these words aloud. Researchers call it subvocalization. It feels helpful but it is your biggest enemy. That voice is capped at the speed of speech. About one hundred and fifty words per minute. It is a ceiling you did not even know existed.")},
  {wpm:360,badge:"03 · SILENCE THE VOICE", words:sp("Try to read without saying the words internally. Do not mouth them. Just look at the red letter. Let the meaning arrive without speaking it. Your brain decodes language far faster than speech. Trust it. Subvocalization is a habit not a requirement.")},
  {wpm:420,badge:"04 · THE ANCHOR",        words:sp("See the red letter in every word. That is your anchor. Research shows your brain identifies an entire word from a single anchor point. The anchor follows you from word to word. Fix your gaze here and let words flow into your mind without effort.")},
  {wpm:480,badge:"05 · WHAT THIS MEANS",   words:sp("At five hundred words per minute you finish a two hundred page book in under three hours instead of eight. You process your inbox in four minutes instead of twenty. Every reading hour now returns twice the insight in half the time.")},
  {wpm:540,badge:"06 · THE SCIENCE",        words:sp("Research confirms speed readers comprehend material as well as or better than traditional readers. Each word arrives at peak focus. No wandering. No re-reading. No zoning out. You are now reading faster than ninety percent of people on this planet.")},
  {wpm:580,badge:"07 · YOUR NEW REALITY",   words:sp("Imagine finishing every book on your list this year. Staying ahead at work without working longer. Learning a new skill every month. Your library your documents your entire industry all absorbed and retained. Your old reading speed is already history.")},
];

/* ══════════════════════════════════════
   WORD VIEW
══════════════════════════════════════ */
function WordView({ word, fs=64, fontCss, color="#e8e4f0", anchorCharRef }){
  const info = useMemo(() => {
    const result = getAnchorInfo(word, anchorCharRef.current);
    anchorCharRef.current = result.anchorChar;
    return result;
  }, [word]);
  return (
    <div style={{animation:"wIn .12s ease-out both"}}>
      <div style={{display:"flex",alignItems:"baseline",width:"min(680px,90vw)",justifyContent:"center"}}>
        <span style={{fontFamily:fontCss,fontWeight:400,color,letterSpacing:2,flex:"0 0 44%",display:"flex",justifyContent:"flex-end",overflow:"hidden",lineHeight:1.1,fontSize:fs,opacity:0.5}}>{info.before}</span>
        <span style={{fontFamily:fontCss,fontWeight:700,color:RED,letterSpacing:2,flex:"0 0 12%",textAlign:"center",lineHeight:1.1,fontSize:fs,textShadow:`0 0 24px ${RED}88`}}>{info.anchor}</span>
        <span style={{fontFamily:fontCss,fontWeight:400,color,letterSpacing:2,flex:"0 0 44%",display:"flex",justifyContent:"flex-start",overflow:"hidden",lineHeight:1.1,fontSize:fs,opacity:0.5}}>{info.after}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TUTORIAL
══════════════════════════════════════ */
function Tutorial({onDone}){
  const [started,setStarted]=useState(false);
  const [pi,setPi]=useState(0);
  const [wi,setWi]=useState(0);
  const [between,setBetween]=useState(false);
  const [done,setDone]=useState(false);
  const tRef=useRef(null);
  const piRef=useRef(0);
  const anchorRef=useRef('e');

  const go=useCallback((idx)=>{ piRef.current=idx; setPi(idx); setWi(0); setBetween(false); },[]);

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
    if(next>=PHASES.length){const t=setTimeout(()=>setDone(true),700);return()=>clearTimeout(t);}
    const t=setTimeout(()=>go(next),1100);
    return()=>clearTimeout(t);
  },[between,go]);

  const ph=PHASES[pi];
  const pct=started?((pi/PHASES.length)+(wi/(ph.words.length*PHASES.length)))*100:0;

  if(done) return(
    <Page>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:24,textAlign:"center",padding:"0 24px",maxWidth:480,animation:"fadeUp .7s ease both"}}>
        <div style={{fontSize:56,lineHeight:1}}>✦</div>
        <h2 style={{fontFamily:SERIF,fontSize:36,fontWeight:400,color:"#e8e4f0",lineHeight:1.2}}>You're ready.</h2>
        <p style={{fontSize:13,color:"#888",lineHeight:1.9,maxWidth:320,fontFamily:SANS}}>Upload any document or browse our bookstore to start reading faster.</p>
        <PrimaryBtn onClick={onDone}>Get Started →</PrimaryBtn>
      </div>
    </Page>
  );

  if(!started) return(
    <Page>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,textAlign:"center",padding:"0 28px",maxWidth:500,animation:"fadeUp .7s ease both"}}>
        <BrandMark/>
        <h1 style={{fontFamily:SERIF,fontSize:40,fontWeight:400,color:"#e8e4f0",lineHeight:1.2,letterSpacing:-0.5}}>Read faster than<br/>90% of people.</h1>
        <p style={{fontSize:13,color:"#666",lineHeight:1.9,maxWidth:360,fontFamily:SANS}}>A 90-second tutorial rewires how your brain absorbs text — permanently.</p>
        <div style={{display:"flex",width:"100%",gap:1,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,overflow:"hidden"}}>
          {[["3×","faster"],["90%","comprehension"],["8 hrs","saved/week"]].map(([n,l],i,a)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"18px 0",gap:4,borderRight:i<a.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <span style={{fontFamily:SERIF,fontSize:26,fontWeight:500,color:RED}}>{n}</span>
              <span style={{fontSize:9,color:"#555",letterSpacing:1.5,fontFamily:MONO,textTransform:"uppercase"}}>{l}</span>
            </div>
          ))}
        </div>
        <PrimaryBtn onClick={()=>setStarted(true)}>Begin Tutorial →</PrimaryBtn>
        <GhostBtn onClick={onDone}>Skip, take me to the app</GhostBtn>
      </div>
    </Page>
  );

  return(
    <Page>
      <div style={{position:"absolute",top:20,fontSize:9,color:RED,letterSpacing:3,fontFamily:MONO,background:"rgba(232,55,42,0.08)",border:"1px solid rgba(232,55,42,0.15)",padding:"6px 16px",borderRadius:50,zIndex:3,opacity:between?0:1,transition:"opacity .4s",textTransform:"uppercase"}}>{ph.badge}</div>
      <GuideLines color="rgba(232,55,42,0.08)"/>
      <div style={{position:"relative",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center",width:"100%"}}>
        {between
          ? <div style={{fontSize:12,color:"#333",fontFamily:MONO,letterSpacing:3}}>{pi+1<PHASES.length?<><span style={{color:RED}}>↑</span> {PHASES[pi+1].wpm} wpm</>:"…"}</div>
          : <WordView word={ph.words[wi]||""} fs={56} fontCss={SERIF} anchorCharRef={anchorRef} key={`${pi}-${wi}`}/>
        }
      </div>
      <div style={{position:"absolute",bottom:18,right:20,fontSize:9,color:"#333",fontFamily:MONO,letterSpacing:1,zIndex:3}}>{ph.wpm} wpm</div>
      <div style={{position:"absolute",bottom:34,display:"flex",gap:6,zIndex:3}}>
        {PHASES.map((_,i)=>(
          <div key={i} style={{width:i===pi?18:5,height:5,borderRadius:3,background:i===pi?RED:i<pi?"rgba(232,55,42,0.3)":"rgba(255,255,255,0.06)",transition:"all .35s ease"}}/>
        ))}
      </div>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:"rgba(255,255,255,0.03)"}}>
        <div style={{height:"100%",background:RED,width:`${pct}%`,transition:"width .15s",boxShadow:`0 0 8px ${RED}88`}}/>
      </div>
      <button onClick={onDone} style={{position:"absolute",bottom:14,right:18,background:"transparent",color:"#333",fontSize:9,fontFamily:MONO,letterSpacing:1,border:"none",cursor:"pointer",zIndex:3}}>Skip →</button>
    </Page>
  );
}

/* ══════════════════════════════════════
   HOME
══════════════════════════════════════ */
function Home({onStart}){
  const [tab,setTab]=useState("upload");
  return(
    <Page>
      <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:600,height:"100%",maxHeight:"96vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"20px 24px 0",flexShrink:0,display:"flex",flexDirection:"column",gap:16}}>
          <BrandMark/>
          <div style={{display:"flex",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,overflow:"hidden",padding:3,gap:3}}>
            {[["upload","📁 Library"],["store","🛒 Bookstore"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{flex:1,padding:"10px",fontSize:11,fontFamily:MONO,border:"none",cursor:"pointer",background:tab===id?RED:"transparent",color:tab===id?"#fff":"#666",transition:"all .2s",letterSpacing:.5,borderRadius:9}}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflow:"hidden",padding:"0 24px 20px"}}>
          {tab==="upload"?<UploadTab onStart={onStart}/>:<StoreTab/>}
        </div>
      </div>
    </Page>
  );
}

/* ══════════════════════════════════════
   UPLOAD TAB — file + text paste
══════════════════════════════════════ */
const WPRESETS=[
  {label:"Comfortable",sub:"~200 wpm",range:[0,275],   pick:200},
  {label:"Normal",     sub:"~300 wpm",range:[275,375], pick:300},
  {label:"Fast",       sub:"~420 wpm",range:[375,525], pick:420},
  {label:"Expert",     sub:"~600 wpm",range:[525,725], pick:600},
  {label:"Blazing",    sub:"900+ wpm",range:[725,9999],pick:900},
];

function UploadTab({onStart}){
  const [mode,setMode]=useState("drop"); // drop | paste | loading | config
  const [pasteText,setPasteText]=useState("");
  const [err,setErr]=useState("");
  const [words,setWords]=useState([]);
  const [fileName,setFileName]=useState("");
  const [wpm,setWpm]=useState(300);
  const [si,setSi]=useState(0);

  const processText=(text,name)=>{
    const w=tok(text);
    if(!w||w.length<5){setErr("Not enough text found. Try pasting the text directly.");setMode("drop");return;}
    setWords(w);setFileName(name);setSi(0);setMode("config");
  };

  const handleFile=async(f)=>{
    if(!f)return;
    setErr("");setMode("loading");
    try{
      const ext=f.name.split(".").pop().toLowerCase();
      let text="";
      if(["txt","md","csv","rtf"].includes(ext)) text=await f.text();
      else if(["html","htm"].includes(ext)) text=(await f.text()).replace(/<[^>]+>/g," ");
      else if(ext==="pdf"){
        await new Promise((res,rej)=>{
          if(window.pdfjsLib){res();return;}
          const s=document.createElement("script");
          s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";res();};
          s.onerror=rej;document.head.appendChild(s);
        });
        const buf=await f.arrayBuffer();
        const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;
        for(let i=1;i<=pdf.numPages;i++){
          const pg=await pdf.getPage(i);
          const ct=await pg.getTextContent();
          text+=ct.items.map(x=>x.str).join(" ")+" ";
        }
      } else if(["docx","doc"].includes(ext)){
        await new Promise((res,rej)=>{
          if(window.mammoth){res();return;}
          const s=document.createElement("script");
          s.src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
          s.onload=res;s.onerror=rej;document.head.appendChild(s);
        });
        const r=await window.mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()});
        text=r.value;
      } else {
        try{ text=await f.text(); }catch{ setErr("Unsupported format. Try pasting text directly.");setMode("drop");return; }
      }
      processText(text,f.name);
    }catch(e){
      setErr("Couldn't read file. Try the 'Paste Text' option below.");
      setMode("drop");
    }
  };

  const sel=WPRESETS.find(p=>wpm>=p.range[0]&&wpm<p.range[1]);
  const eta=words.length?ft(Math.ceil(((words.length-si)/wpm)*60)):"";
  const preview=words.slice(si,si+12).join(" ")+(words.length>si+12?"…":"");

  if(mode==="loading") return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16}}>
      <div style={{fontSize:28,color:RED,animation:"spin 1s linear infinite",display:"inline-block"}}>◌</div>
      <div style={{fontSize:11,color:"#666",fontFamily:MONO,letterSpacing:1}}>Reading file…</div>
    </div>
  );

  if(mode==="paste") return(
    <div style={{display:"flex",flexDirection:"column",gap:12,paddingTop:16,height:"100%"}}>
      <div style={{fontSize:12,color:"#888",fontFamily:SANS}}>Paste any text below — article, essay, book chapter, anything.</div>
      <textarea
        value={pasteText}
        onChange={e=>setPasteText(e.target.value)}
        placeholder="Paste your text here…"
        style={{flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"14px",fontSize:13,color:"#ccc",fontFamily:SANS,outline:"none",resize:"none",lineHeight:1.7,minHeight:200}}
      />
      {err&&<div style={{fontSize:11,color:RED,fontFamily:MONO,padding:"8px 12px",background:"rgba(232,55,42,0.06)",borderRadius:8,border:"1px solid rgba(232,55,42,0.15)"}}>{err}</div>}
      <PrimaryBtn onClick={()=>{if(pasteText.trim().length>10)processText(pasteText,"Pasted Text");else setErr("Please paste some text first.")}}>Read This Text →</PrimaryBtn>
      <GhostBtn onClick={()=>{setMode("drop");setErr("");}}>← Back</GhostBtn>
    </div>
  );

  if(mode==="config") return(
    <div style={{display:"flex",flexDirection:"column",gap:12,paddingTop:16,overflowY:"auto",height:"100%",paddingBottom:4}}>
      <SCard label="Document">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:22}}>📄</div>
          <div>
            <div style={{fontSize:12,color:"#ccc",fontFamily:SANS,fontWeight:500}}>{fileName}</div>
            <div style={{fontSize:10,color:"#666",fontFamily:MONO,marginTop:2}}>{words.length.toLocaleString()} words · {eta} at {wpm} wpm</div>
          </div>
        </div>
      </SCard>
      <SCard label="Reading Speed">
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {WPRESETS.map(p=>(
            <button key={p.label} onClick={()=>setWpm(p.pick)}
              style={{padding:"6px 11px",fontSize:9,fontFamily:MONO,border:`1px solid ${sel?.label===p.label?RED:"rgba(255,255,255,0.1)"}`,borderRadius:6,background:sel?.label===p.label?"rgba(232,55,42,0.12)":"transparent",color:sel?.label===p.label?RED:"#888",cursor:"pointer",transition:"all .15s"}}>
              {p.label}<span style={{opacity:.5,marginLeft:4}}>{p.sub}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:RED,fontFamily:MONO,minWidth:56}}>{wpm} wpm</span>
          <input type="range" min={50} max={1200} step={25} value={wpm} onChange={e=>setWpm(+e.target.value)} style={{flex:1}}/>
        </div>
      </SCard>
      <SCard label="Start Position">
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,color:"#888",fontFamily:MONO,minWidth:58}}>Word {si+1}</span>
          <input type="range" min={0} max={Math.max(0,words.length-1)} value={si} onChange={e=>setSi(+e.target.value)} style={{flex:1}}/>
          <span style={{fontSize:10,color:"#666",fontFamily:MONO,minWidth:34,textAlign:"right"}}>{words.length}</span>
        </div>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#aaa",lineHeight:1.7,fontFamily:SERIF,minHeight:40}}>{preview}</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["Start",0],["Skip intro",Math.floor(words.length*.08)],["25%",Math.floor(words.length*.25)],["50%",Math.floor(words.length*.5)]].map(([l,v])=>(
            <button key={l} onClick={()=>setSi(v)} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,padding:"4px 9px",fontSize:9,color:"#888",fontFamily:MONO,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
      </SCard>
      <PrimaryBtn onClick={()=>onStart(words,fileName,wpm,si)}>Start Reading →</PrimaryBtn>
      <GhostBtn onClick={()=>{setMode("drop");setWords([]);setFileName("");}}>← Change file</GhostBtn>
    </div>
  );

  // Drop zone — use real label wrapping for reliable mobile file pick
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14,paddingTop:16}}>
      <label style={{display:"
