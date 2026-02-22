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
      <label style={{display:"block",cursor:"pointer"}}>
        <input
          type="file"
          accept=".pdf,.docx,.doc,.epub,.txt,.md,.csv,.rtf,.html"
          style={{position:"absolute",width:1,height:1,opacity:0,overflow:"hidden"}}
          onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}
        />
        <div style={{width:"100%",border:"1.5px dashed rgba(255,255,255,0.18)",borderRadius:16,padding:"52px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:14,background:"rgba(255,255,255,0.02)",cursor:"pointer"}}>
          <div style={{fontSize:40,lineHeight:1}}>📂</div>
          <div>
            <div style={{fontSize:14,color:"#ccc",fontFamily:SANS,textAlign:"center",marginBottom:6}}>Tap to choose a file</div>
            <div style={{fontSize:10,color:"#555",fontFamily:MONO,textAlign:"center",letterSpacing:.5}}>PDF · DOCX · TXT · EPUB · MD</div>
          </div>
        </div>
      </label>

      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
        <span style={{fontSize:10,color:"#444",fontFamily:MONO}}>OR</span>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
      </div>

      <button onClick={()=>setMode("paste")}
        style={{width:"100%",padding:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#aaa",fontFamily:MONO,fontSize:12,cursor:"pointer",letterSpacing:.5,transition:"all .2s"}}
        onMouseEnter={e=>{e.target.style.borderColor="rgba(232,55,42,0.4)";e.target.style.color="#fff";}}
        onMouseLeave={e=>{e.target.style.borderColor="rgba(255,255,255,0.1)";e.target.style.color="#aaa";}}>
        ✏️ Paste Text Directly
      </button>

      {err&&<div style={{fontSize:11,color:RED,padding:"10px 14px",background:"rgba(232,55,42,0.06)",borderRadius:10,fontFamily:MONO,border:"1px solid rgba(232,55,42,0.15)"}}>{err}</div>}
    </div>
  );
}

/* ══════════════════════════════════════
   STORE TAB — Open Library search + Amazon Associates
   ↓ REPLACE THIS WITH YOUR TRACKING ID ↓
══════════════════════════════════════ */
const AMAZON_TAG = "thynkmore-01-20";

const TRENDING = [
  {key:"atomic habits",label:"Atomic Habits"},
  {key:"dune frank herbert",label:"Dune"},
  {key:"sapiens harari",label:"Sapiens"},
  {key:"1984 orwell",label:"1984"},
  {key:"thinking fast slow",label:"Thinking Fast & Slow"},
  {key:"meditations aurelius",label:"Meditations"},
  {key:"deep work newport",label:"Deep Work"},
  {key:"the alchemist",label:"The Alchemist"},
];

function amazonLink(book){
  // Try ISBN first (most accurate), fallback to title+author search
  const isbn = book.isbn13?.[0] || book.isbn?.[0];
  if(isbn){
    return `https://www.amazon.com/s?k=${encodeURIComponent(isbn)}&tag=${AMAZON_TAG}`;
  }
  const q = encodeURIComponent(`${book.title} ${book.authorName||""}`);
  return `https://www.amazon.com/s?k=${q}&tag=${AMAZON_TAG}`;
}

function coverUrl(book){
  if(book.coverId) return `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`;
  const isbn = book.isbn13?.[0] || book.isbn?.[0];
  if(isbn) return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  return null;
}

async function searchOpenLibrary(query){
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=24&fields=key,title,author_name,isbn,isbn13,cover_i,first_publish_year,subject,number_of_pages_median,ratings_average`;
  const r = await fetch(url);
  const d = await r.json();
  return (d.docs||[]).map(doc=>({
    id: doc.key,
    title: doc.title||"Unknown",
    authorName: (doc.author_name||[])[0]||"Unknown",
    isbn: doc.isbn||[],
    isbn13: doc.isbn13||[],
    coverId: doc.cover_i,
    year: doc.first_publish_year,
    pages: doc.number_of_pages_median,
    rating: doc.ratings_average ? doc.ratings_average.toFixed(1) : null,
    subjects: (doc.subject||[]).slice(0,3),
  }));
}

function StoreTab(){
  const [q,setQ]=useState("");
  const [results,setResults]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const [selected,setSelected]=useState(null);
  const [err,setErr]=useState("");

  const doSearch=async(term)=>{
    const query=(term||q).trim();
    if(!query)return;
    setQ(query);
    setLoading(true);setSearched(true);setResults([]);setErr("");
    try{
      const books=await searchOpenLibrary(query);
      setResults(books);
      if(books.length===0) setErr("No results. Try a different search.");
    }catch(e){
      setErr("Search failed. Check your internet connection.");
    }
    setLoading(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12,paddingTop:16,height:"100%"}}>

      {/* Affiliate notice */}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:"rgba(232,55,42,0.06)",border:"1px solid rgba(232,55,42,0.12)",borderRadius:8,flexShrink:0}}>
        <span style={{fontSize:10}}>🛒</span>
        <span style={{fontSize:9,color:"#888",fontFamily:MONO,lineHeight:1.5}}>Books sold via Amazon. Tap any book → "Buy on Amazon". Commission supports FlashRead.</span>
      </div>

      {/* Search */}
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&doSearch()}
          placeholder="Search any book, author, ISBN…"
          style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"11px 14px",fontSize:12,color:"#ccc",fontFamily:SANS,outline:"none"}}
          onFocus={e=>e.target.style.borderColor="rgba(232,55,42,0.5)"}
          onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}
        />
        <button onClick={()=>doSearch()}
          style={{background:RED,color:"#fff",fontSize:11,fontFamily:MONO,border:"none",cursor:"pointer",padding:"11px 18px",borderRadius:10,flexShrink:0,letterSpacing:.5}}>
          {loading?"…":"Search"}
        </button>
      </div>

      {/* Trending chips */}
      {!searched&&(
        <div style={{display:"flex",gap:5,flexWrap:"nowrap",overflowX:"auto",paddingBottom:2,flexShrink:0}}>
          {TRENDING.map(t=>(
            <button key={t.key} onClick={()=>doSearch(t.key)}
              style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"5px 13px",fontSize:10,color:"#888",fontFamily:MONO,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .15s"}}
              onMouseEnter={e=>{e.target.style.borderColor=RED;e.target.style.color="#fff";}}
              onMouseLeave={e=>{e.target.style.borderColor="rgba(255,255,255,0.08)";e.target.style.color="#888";}}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Results info */}
      {searched&&!loading&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <span style={{fontSize:9,color:"#555",fontFamily:MONO}}>{results.length} results for "{q}" via Open Library</span>
          <button onClick={()=>{setSearched(false);setResults([]);setQ("");setErr("");}}
            style={{fontSize:9,color:"#555",fontFamily:MONO,background:"transparent",border:"none",cursor:"pointer"}}>
            Clear ×
          </button>
        </div>
      )}

      {/* Error */}
      {err&&<div style={{fontSize:11,color:RED,fontFamily:MONO,padding:"8px 12px",background:"rgba(232,55,42,0.06)",borderRadius:8,flexShrink:0}}>{err}</div>}

      {/* Grid */}
      <div style={{flex:1,overflowY:"auto",marginRight:-4,paddingRight:4}}>
        {loading&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}>
            <div style={{fontSize:24,color:RED,animation:"spin 1s linear infinite",display:"inline-block"}}>◌</div>
            <span style={{fontSize:11,color:"#555",fontFamily:MONO,letterSpacing:1}}>Searching millions of books…</span>
          </div>
        )}

        {!loading&&!searched&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:16,textAlign:"center"}}>
            <div style={{fontSize:48}}>📚</div>
            <div style={{fontSize:14,color:"#888",fontFamily:SANS}}>Search any book</div>
            <div style={{fontSize:11,color:"#444",fontFamily:MONO,maxWidth:280,lineHeight:1.7}}>Millions of books via Open Library. Tap one to see details and buy on Amazon.</div>
          </div>
        )}

        {!loading&&results.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:16,paddingBottom:16}}>
            {results.map(book=>(
              <BookCard key={book.id} book={book} onClick={()=>setSelected(book)}/>
            ))}
          </div>
        )}
      </div>

      {selected&&(
        <BookDetailModal
          book={selected}
          onClose={()=>setSelected(null)}
        />
      )}
    </div>
  );
}

function BookCard({book,onClick}){
  const cover=coverUrl(book);
  const [imgFailed,setImgFailed]=useState(false);
  return(
    <div onClick={onClick}
      style={{cursor:"pointer",display:"flex",flexDirection:"column",gap:8,transition:"transform .18s"}}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
      <div style={{width:"100%",aspectRatio:"2/3",borderRadius:10,overflow:"hidden",background:"linear-gradient(145deg,#0d0d1a,#1a1228)",border:"1px solid rgba(255,255,255,0.07)",position:"relative",flexShrink:0}}>
        {cover&&!imgFailed
          ? <img src={cover} alt={book.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setImgFailed(true)}/>
          : <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 8px"}}>
              <div style={{fontSize:22}}>📖</div>
              <div style={{fontSize:9,color:"#aaa",fontFamily:SERIF,textAlign:"center",lineHeight:1.3}}>{book.title}</div>
            </div>
        }
        {book.rating&&(
          <div style={{position:"absolute",bottom:4,right:4,background:"rgba(0,0,0,0.75)",borderRadius:4,padding:"2px 5px",fontSize:8,color:"#ffd700",fontFamily:MONO}}>★ {book.rating}</div>
        )}
      </div>
      <div>
        <div style={{fontSize:11,color:"#d0cce0",fontFamily:SANS,fontWeight:500,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{book.title}</div>
        <div style={{fontSize:9,color:"#555",fontFamily:MONO,marginTop:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{book.authorName}</div>
        {book.year&&<div style={{fontSize:9,color:"#444",fontFamily:MONO,marginTop:1}}>{book.year}</div>}
      </div>
    </div>
  );
}

function BookDetailModal({book,onClose}){
  const cover=coverUrl(book);
  const [imgFailed,setImgFailed]=useState(false);
  const [descLoading,setDescLoading]=useState(true);
  const [description,setDescription]=useState("");

  useEffect(()=>{
    setDescLoading(true);setDescription("");
    const olKey=book.id; // e.g. /works/OL12345W
    fetch(`https://openlibrary.org${olKey}.json`)
      .then(r=>r.json())
      .then(d=>{
        const desc=typeof d.description==="string"?d.description:d.description?.value||"";
        setDescription(desc.slice(0,500)+(desc.length>500?"…":""));
        setDescLoading(false);
      })
      .catch(()=>{ setDescription("No description available."); setDescLoading(false); });
  },[book.id]);

  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:"fixed",inset:0,zIndex:60,background:"rgba(4,4,12,0.94)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn .2s ease",backdropFilter:"blur(8px)"}}>
      <div style={{width:"100%",maxWidth:460,background:"#0d0d1a",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"fadeUp .25s ease both"}}>

        {/* Header */}
        <div style={{display:"flex",gap:16,padding:"20px 20px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{width:72,height:108,borderRadius:8,overflow:"hidden",background:"linear-gradient(145deg,#0d0d1a,#1a1228)",flexShrink:0,border:"1px solid rgba(255,255,255,0.07)"}}>
            {cover&&!imgFailed
              ? <img src={cover} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setImgFailed(true)}/>
              : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>📖</div>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,color:"#e8e4f0",fontFamily:SERIF,fontWeight:500,lineHeight:1.35,marginBottom:5}}>{book.title}</div>
            <div style={{fontSize:10,color:"#666",fontFamily:MONO,marginBottom:8}}>{book.authorName}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {book.year&&<span style={{fontSize:8,color:"#555",fontFamily:MONO,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,padding:"2px 7px"}}>{book.year}</span>}
              {book.pages&&<span style={{fontSize:8,color:"#555",fontFamily:MONO,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,padding:"2px 7px"}}>{book.pages} pages</span>}
              {book.rating&&<span style={{fontSize:8,color:"#ffd700",fontFamily:MONO,background:"rgba(255,215,0,0.07)",border:"1px solid rgba(255,215,0,0.15)",borderRadius:4,padding:"2px 7px"}}>★ {book.rating}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{background:"transparent",color:"#444",fontSize:20,border:"none",cursor:"pointer",alignSelf:"flex-start",lineHeight:1,padding:"0 0 0 4px",flexShrink:0}}>×</button>
        </div>

        {/* Description */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          <div style={{fontSize:9,color:"#444",fontFamily:MONO,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>About</div>
          {descLoading
            ? <div style={{display:"flex",alignItems:"center",gap:8,color:"#444",fontSize:11,fontFamily:MONO}}>
                <div style={{fontSize:14,color:RED,animation:"spin 1s linear infinite",display:"inline-block"}}>◌</div> Loading…
              </div>
            : <div style={{fontSize:13,color:"#888",lineHeight:1.85,fontFamily:SANS}}>{description||"No description available for this edition."}</div>
          }
          {book.subjects.length>0&&(
            <div style={{marginTop:14,display:"flex",gap:5,flexWrap:"wrap"}}>
              {book.subjects.map((s,i)=>(
                <span key={i} style={{fontSize:8,color:"#555",fontFamily:MONO,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,padding:"2px 8px"}}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",gap:10}}>
          <a href={amazonLink(book)} target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:RED,color:"#fff",fontSize:12,fontFamily:MONO,textDecoration:"none",padding:"13px",borderRadius:10,letterSpacing:.5,boxShadow:`0 4px 20px ${RED}44`,transition:"transform .15s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.01)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <span>🛒</span>
            <span>Buy on Amazon →</span>
          </a>
          <div style={{display:"flex",gap:8,fontSize:9,color:"#333",fontFamily:MONO,justifyContent:"center",alignItems:"center",gap:6}}>
            <span>Opens Amazon · Affiliate link</span>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   READER
══════════════════════════════════════ */
function Reader({words,fileName,initialWpm,initialIdx,onExit}){
  const [idx,setIdx]=useState(initialIdx);
  const [wpm,setWpm]=useState(initialWpm);
  const [playing,setPlaying]=useState(false);
  const [done,setDone]=useState(false);
  const [paused,setPaused]=useState(false);
  const [menuTab,setMenuTab]=useState("text");
  const [theme,setTheme]=useState(THEMES[0]);
  const [fontIdx,setFontIdx]=useState(0);
  const [fontSize,setFontSize]=useState(64);
  const [showCtrl,setShowCtrl]=useState(true);
  const tRef=useRef(null);
  const hideRef=useRef(null);
  const wordRefs=useRef({});
  const panelRef=useRef(null);
  const anchorRef=useRef('e');
  const font=FONTS[fontIdx];
  const T=theme;

  useEffect(()=>{
    const id=`ff-${font.id}`;
    if(!document.getElementById(id)){
      const l=document.createElement("link");
      l.id=id;l.rel="stylesheet";
      l.href=`https://fonts.googleapis.com/css2?family=${font.url}&display=swap`;
      document.head.appendChild(l);
    }
  },[font]);

  const bump=useCallback(()=>{
    setShowCtrl(true);clearTimeout(hideRef.current);
    if(playing&&!paused)hideRef.current=setTimeout(()=>setShowCtrl(false),2500);
  },[playing,paused]);

  useEffect(()=>{
    if(playing&&!paused)hideRef.current=setTimeout(()=>setShowCtrl(false),2500);
    else{clearTimeout(hideRef.current);setShowCtrl(true);}
    return()=>clearTimeout(hideRef.current);
  },[playing,paused]);

  useEffect(()=>{
    if(!playing||done||paused)return;
    clearInterval(tRef.current);
    const ms=(60/wpm)*1000;
    tRef.current=setInterval(()=>{
      setIdx(prev=>{
        if(prev>=words.length-1){clearInterval(tRef.current);setPlaying(false);setDone(true);return prev;}
        return prev+1;
      });
    },ms);
    return()=>clearInterval(tRef.current);
  },[playing,wpm,done,paused,words.length]);

  useEffect(()=>{
    if(!paused)return;
    setTimeout(()=>{
      const el=wordRefs.current[idx];
      if(el&&panelRef.current){
        const p=panelRef.current;
        p.scrollTop=el.offsetTop-p.offsetHeight/2+el.offsetHeight/2;
      }
    },60);
  },[paused,idx]);

  const toggle=useCallback(()=>{
    if(done){setIdx(initialIdx);setDone(false);setPlaying(true);setPaused(false);anchorRef.current='e';return;}
    if(!paused){setPlaying(false);setPaused(true);}
    else{setPaused(false);setPlaying(true);}
  },[done,initialIdx,paused]);

  useEffect(()=>{
    const h=e=>{
      if(e.key===" "||e.key==="k"){e.preventDefault();toggle();}
      if(e.key==="Escape"){if(paused)setPaused(false);else onExit();}
      if(!paused){
        if(e.key==="ArrowRight")setIdx(p=>Math.min(p+50,words.length-1));
        if(e.key==="ArrowLeft") setIdx(p=>Math.max(p-50,0));
      }
      bump();
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[toggle,onExit,words.length,paused,bump]);

  const word=words[idx]||"";
  const progress=((idx+1)/words.length)*100;
  const remaining=ft(Math.ceil(((words.length-idx)/wpm)*60));
  const gradTop=`linear-gradient(to bottom,${T.bg}f5,transparent)`;
  const gradBot=`linear-gradient(to top,${T.bg}f8,transparent)`;

  return(
    <div style={{position:"fixed",inset:0,background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}} onMouseMove={bump}>
      <GuideLines color={T.guide}/>
      <div style={{position:"absolute",inset:0,zIndex:2,cursor:"pointer"}} onClick={toggle}/>
      <div style={{position:"relative",zIndex:3,display:"flex",alignItems:"center",justifyContent:"center",width:"100%",pointerEvents:"none"}}>
        {done
          ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,animation:"fadeUp .5s ease both"}}>
              <div style={{fontSize:48,color:"#4caf50",lineHeight:1}}>✓</div>
              <div style={{fontFamily:font.css,fontSize:26,fontWeight:300,color:T.dim,letterSpacing:4}}>Finished</div>
            </div>
          : <WordView word={word} fs={fontSize} fontCss={font.css} color={T.text} anchorCharRef={anchorRef} key={idx}/>
        }
      </div>
      <div style={{position:"absolute",bottom:18,right:18,fontSize:9,color:T.dim,fontFamily:MONO,zIndex:6,pointerEvents:"none",opacity:showCtrl?.6:.05,transition:"opacity .4s"}}>{wpm} wpm</div>
      <div style={{position:"absolute",inset:0,zIndex:5,display:"flex",flexDirection:"column",justifyContent:"space-between",opacity:showCtrl?1:0,transition:"opacity .4s",pointerEvents:showCtrl?"auto":"none"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",background:gradTop}}>
          <button onClick={onExit} style={{background:"transparent",color:T.dim,fontSize:11,fontFamily:MONO,border:"none",cursor:"pointer",opacity:.7}}>← Exit</button>
          <span style={{fontSize:9,color:T.dim,fontFamily:MONO,opacity:.4,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fileName}</span>
          <span style={{fontSize:9,color:T.dim,fontFamily:MONO,opacity:.4}}>{remaining} left</span>
        </div>
        <div style={{padding:"14px 20px 20px",background:gradBot,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:6}}>
            <div style={{width:"100%",height:1,background:T.border,overflow:"hidden",borderRadius:1}}>
              <div style={{height:"100%",background:RED,width:`${progress}%`,transition:"width .15s",boxShadow:`0 0 6px ${RED}66`}}/>
            </div>
            <div style={{fontSize:9,color:T.dim,fontFamily:MONO,textAlign:"center",opacity:.4}}>{idx+1} / {words.length}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>setIdx(p=>Math.max(p-50,0))} style={{background:"transparent",color:T.dim,fontSize:14,border:"none",cursor:"pointer",opacity:.5}}>⏮</button>
            <button onClick={toggle} style={{width:52,height:52,borderRadius:"50%",background:RED,color:"#fff",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",boxShadow:`0 4px 20px ${RED}55`}}>
              {done?"↺":playing&&!paused?"⏸":"▶"}
            </button>
            <button onClick={()=>setIdx(p=>Math.min(p+50,words.length-1))} style={{background:"transparent",color:T.dim,fontSize:14,border:"none",cursor:"pointer",opacity:.5}}>⏭</button>
          </div>
          <div style={{fontSize:9,color:T.dim,fontFamily:MONO,opacity:.2,letterSpacing:1}}>Click · Space · ← → · Esc</div>
        </div>
      </div>
      {paused&&(
        <div style={{position:"absolute",inset:0,zIndex:20,background:T.bg,display:"flex",flexDirection:"column",animation:"fadeIn .18s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            <div style={{display:"flex",gap:3,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",padding:3}}>
              {[["text","📖 Text"],["settings","⚙ Settings"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setMenuTab(id)}
                  style={{padding:"7px 14px",fontSize:10,fontFamily:MONO,border:"none",cursor:"pointer",background:menuTab===id?RED:"transparent",color:menuTab===id?"#fff":T.dim,transition:"all .15s",borderRadius:7}}>
                  {lbl}
                </button>
              ))}
            </div>
            <button onClick={()=>{setPaused(false);setPlaying(true);}}
              style={{background:RED,color:"#fff",fontSize:10,fontFamily:MONO,border:"none",cursor:"pointer",padding:"8px 16px",borderRadius:20}}>
              ▶ Resume
            </button>
          </div>
          {menuTab==="text"&&(
            <div ref={panelRef} style={{flex:1,overflowY:"auto",padding:"16px 20px",lineHeight:1.9}}>
              <div style={{maxWidth:620,margin:"0 auto",fontFamily:font.css,fontSize:15,color:T.text}}>
                {words.map((w,i)=>(
                  <span key={i} ref={el=>{if(el)wordRefs.current[i]=el;}}
                    onClick={()=>{setIdx(i);setPaused(false);setPlaying(true);anchorRef.current='e';}}
                    style={{cursor:"pointer",background:i===idx?RED:"transparent",color:i===idx?"#fff":i<idx?T.dim:T.text,borderRadius:3,padding:"0 2px",fontSize:i===idx?15:14,transition:"background .1s"}}>
                    {w}{" "}
                  </span>
                ))}
              </div>
            </div>
          )}
          {menuTab==="settings"&&(
            <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14,maxWidth:480,margin:"0 auto",width:"100%"}}>
              <SCard2 label="Theme" T={T}>
                <div style={{display:"flex",gap:8}}>
                  {THEMES.map(t=>(
                    <button key={t.id} onClick={()=>setTheme(t)}
                      style={{flex:1,padding:"12px 8px",background:t.bg,border:`2px solid ${T.id===t.id?RED:t.border}`,borderRadius:10,cursor:"pointer",color:t.text,fontSize:10,fontFamily:MONO}}>
                      {t.id==="obsidian"?"🌑 Dark":t.id==="sepia"?"🟤 Sepia":"☀️ Light"}
                    </button>
                  ))}
                </div>
              </SCard2>
              <SCard2 label="Reading Font" T={T}>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {FONTS.map((f,i)=>(
                    <button key={f.id} onClick={()=>setFontIdx(i)}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:fontIdx===i?"rgba(232,55,42,0.07)":"transparent",border:`1px solid ${fontIdx===i?RED:T.border}`,borderRadius:10,cursor:"pointer"}}>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontFamily:f.css,fontSize:15,color:T.text,fontWeight:400}}>The quick brown fox</div>
                        <div style={{fontSize:9,color:T.dim,fontFamily:MONO,marginTop:2}}>{f.label} · {f.note}</div>
                      </div>
                      {fontIdx===i&&<div style={{width:6,height:6,borderRadius:"50%",background:RED,flexShrink:0}}/>}
                    </button>
                  ))}
                </div>
              </SCard2>
              <SCard2 label="Font Size" T={T}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:RED,fontFamily:MONO,minWidth:36}}>{fontSize}px</span>
                  <input type="range" min={36} max={96} step={4} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{flex:1}}/>
                </div>
              </SCard2>
              <SCard2 label="Reading Speed" T={T}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:RED,fontFamily:MONO,minWidth:56}}>{wpm} wpm</span>
                  <input type="range" min={50} max={1200} step={25} value={wpm} onChange={e=>setWpm(+e.target.value)} style={{flex:1}}/>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {[150,250,300,400,500,600,750,900].map(w=>(
                    <button key={w} onClick={()=>setWpm(w)}
                      style={{background:wpm===w?"rgba(232,55,42,0.08)":"transparent",border:`1px solid ${wpm===w?RED:T.border}`,color:wpm===w?RED:T.dim,borderRadius:6,padding:"5px 8px",fontSize:9,fontFamily:MONO,cursor:"pointer"}}>
                      {w}
                    </button>
                  ))}
                </div>
              </SCard2>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── shared ── */
function Page({children}){
  return <div style={{position:"fixed",inset:0,background:"#080810",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:MONO,overflow:"hidden"}}>{children}</div>;
}
function BrandMark(){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${RED},#c0291c)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,boxShadow:`0 4px 14px ${RED}44`}}>⚡</div>
      <span style={{fontFamily:SERIF,fontSize:22,fontWeight:500,color:"#e8e4f0",letterSpacing:.3}}>FlashRead</span>
    </div>
  );
}
function PrimaryBtn({children,onClick}){
  return <button onClick={onClick}
    style={{padding:"12px 32px",background:RED,color:"#fff",fontSize:12,borderRadius:50,letterSpacing:1,fontFamily:MONO,border:"none",cursor:"pointer",alignSelf:"center",boxShadow:`0 4px 22px ${RED}50`}}>
    {children}
  </button>;
}
function GhostBtn({children,onClick}){
  return <button onClick={onClick} style={{background:"transparent",color:"#444",fontSize:10,fontFamily:MONO,letterSpacing:1,border:"none",cursor:"pointer",alignSelf:"center"}}>{children}</button>;
}
function GuideLines({color}){
  return(
    <>
      <div style={{position:"absolute",left:0,right:0,height:1,background:color,top:"38%",zIndex:1,pointerEvents:"none"}}/>
      <div style={{position:"absolute",left:0,right:0,height:1,background:color,top:"62%",zIndex:1,pointerEvents:"none"}}/>
      <div style={{position:"absolute",left:"50%",top:"28%",bottom:"28%",width:1,background:color,transform:"translateX(-50%)",zIndex:1,pointerEvents:"none"}}/>
    </>
  );
}
function SCard({label,children}){
  return(
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
      <div style={{fontSize:9,color:"#555",letterSpacing:2,textTransform:"uppercase",fontFamily:MONO}}>{label}</div>
      {children}
    </div>
  );
}
function SCard2({label,T,children}){
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
      <div style={{fontSize:9,color:T.dim,letterSpacing:2,textTransform:"uppercase",fontFamily:MONO,opacity:.7}}>{label}</div>
      {children}
    </div>
  );
}

export default function App(){
  const [screen,setScreen]=useState("tutorial");
  const [words,setWords]=useState([]);
  const [meta,setMeta]=useState({name:"",wpm:300,idx:0});
  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Mono:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;background:#080810;overflow:hidden}
        button{cursor:pointer;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wIn{0%{opacity:0;transform:scale(.96)}40%{opacity:1;transform:scale(1)}100%{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        input[type=range]{-webkit-appearance:none;appearance:none;height:2px;background:rgba(255,255,255,0.08);border-radius:1px;outline:none;flex:1}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#e8372a;cursor:pointer;box-shadow:0 0 8px rgba(232,55,42,0.4)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        ::selection{background:rgba(232,55,42,0.25)}
      `}</style>
      {screen==="tutorial"&&<Tutorial onDone={()=>setScreen("home")}/>}
      {screen==="home"    &&<Home onStart={(w,name,wpm,idx)=>{setWords(w);setMeta({name,wpm,idx});setScreen("reading");}}/>}
      {screen==="reading" &&<Reader words={words} fileName={meta.name} initialWpm={meta.wpm} initialIdx={meta.idx} onExit={()=>setScreen("home")}/>}
    </>
  );
}
