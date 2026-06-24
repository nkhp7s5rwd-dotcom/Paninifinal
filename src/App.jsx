import { useState, useEffect, useMemo, useCallback, createContext, useContext, useRef } from "react";
import { supabase } from "./supabaseClient";

const ThemeContext = createContext({ dark: false, s: {} });
function useTheme() { return useContext(ThemeContext); }

const LIGHT = {
  bg:"#F3ECD9",bgDark:"#E8DEC4",card:"#FFFCF4",cardAlt:"#F3ECD9",
  ink:"#1C2541",inkLight:"#665f45",header:"#1C2541",headerText:"#FFFCF4",
  gold:"#D9A441",border:"#C9C2AC",have:"#2E7D5B",haveLight:"#DCEEE3",
  dup:"#E2862F",dupLight:"#FBE6CC",missingText:"#9b9477",chipBg:"#FFFCF4",
  tabInactive:"#E8DEC4",select:"#FFFCF4",noteText:"#8a8265",
};
const DARK = {
  bg:"#0f1117",bgDark:"#1a1d27",card:"#1e2130",cardAlt:"#161922",
  ink:"#e8e0cc",inkLight:"#a89f88",header:"#0f1117",headerText:"#e8e0cc",
  gold:"#D9A441",border:"#3a3d50",have:"#2E7D5B",haveLight:"#1a3328",
  dup:"#E2862F",dupLight:"#2e1f0a",missingText:"#6b6655",chipBg:"#1e2130",
  tabInactive:"#1a1d27",select:"#1e2130",noteText:"#6b6655",
};

function buildStyles(c, dark) {
  return {
    app:{minHeight:"100vh",background:c.bg,fontFamily:"'Manrope',sans-serif",color:c.ink,paddingBottom:40},
    header:{background:c.header,color:c.headerText,padding:"10px 18px 16px",borderBottom:`4px solid ${c.gold}`},
    headerRibbon:{fontFamily:"'Anton',sans-serif",fontSize:12,letterSpacing:2,color:c.gold,marginBottom:6},
    headerRow:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"},
    headerName:{fontFamily:"'Anton',sans-serif",fontSize:24,letterSpacing:0.5},
    headerStats:{fontSize:12.5,opacity:0.85,marginTop:2},
    headerRight:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},
    progressOuter:{position:"relative",width:110,height:22,background:"rgba(255,255,255,0.1)",borderRadius:999,overflow:"hidden",border:"1px solid rgba(255,255,255,0.2)"},
    progressInner:{position:"absolute",top:0,left:0,bottom:0,background:c.gold},
    progressLabel:{position:"relative",zIndex:1,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#1C2541"},
    logoutBtn:{background:"transparent",border:`1px solid ${c.gold}`,color:c.gold,borderRadius:8,padding:"6px 10px",fontSize:12,cursor:"pointer",fontWeight:700},
    darkToggle:{background:"transparent",border:`1px solid ${c.border}`,color:c.headerText,borderRadius:8,padding:"6px 10px",fontSize:14,cursor:"pointer"},
    tabs:{display:"flex",gap:4,padding:"14px 14px 0",background:c.bg,overflowX:"auto"},
    tabButton:{flex:1,minWidth:70,padding:"10px 6px",borderRadius:"10px 10px 0 0",border:"none",background:c.tabInactive,color:c.ink,fontWeight:700,fontSize:11.5,cursor:"pointer",opacity:0.7,whiteSpace:"nowrap",position:"relative"},
    tabButtonActive:{background:c.card,opacity:1,color:c.ink,boxShadow:`0 -2px 0 0 ${c.gold} inset`},
    pdfButton:{minWidth:55,padding:"10px 8px",borderRadius:"10px 10px 0 0",border:"none",background:c.header,color:c.gold,fontWeight:700,fontSize:11.5,cursor:"pointer"},
    tabBadge:{position:"absolute",top:4,right:4,background:"#E2862F",color:"white",fontSize:9,fontWeight:900,borderRadius:999,padding:"1px 5px",lineHeight:1.4},
    main:{padding:"16px 14px 0",maxWidth:720,margin:"0 auto"},
    footer:{textAlign:"center",fontSize:11.5,color:c.noteText,padding:"26px 24px 0"},
    countryList:{display:"flex",flexDirection:"column",gap:10},
    countryCard:{background:c.card,borderRadius:12,boxShadow:dark?"0 1px 4px rgba(0,0,0,0.4)":"0 1px 3px rgba(28,37,65,0.12)",overflow:"hidden"},
    countryHeader:{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"13px 14px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",color:c.ink},
    countryHeaderComplete:{background:c.haveLight},
    countryName:{fontFamily:"'Anton',sans-serif",fontSize:15,flex:1,letterSpacing:0.3},
    countryProgress:{fontSize:12.5,fontWeight:700,color:c.inkLight},
    chevron:{fontSize:11,opacity:0.5},
    stickerGrid:{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:8,padding:"4px 14px 16px"},
    sticker:{position:"relative",aspectRatio:"1",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",border:`2px dashed ${c.border}`,background:c.bg},
    stickerMissing:{background:c.cardAlt,borderColor:c.border,color:c.missingText},
    stickerHave:{background:c.haveLight,borderStyle:"solid",borderColor:c.have,color:c.have},
    stickerDuplicate:{background:c.dupLight,borderStyle:"solid",borderColor:c.dup,color:dark?"#e2862f":"#8a4f12"},
    stickerRequested:{background:dark?"#0d2a4a":"#dbeafe",borderStyle:"solid",borderColor:"#3b82f6",color:"#3b82f6"},
    stickerNumber:{fontFamily:"'Anton',sans-serif",fontSize:15},
    stickerBadge:{position:"absolute",top:-6,right:-6,background:c.dup,color:"white",fontSize:9,fontWeight:800,borderRadius:999,padding:"2px 5px"},
    stickerCheck:{position:"absolute",top:-6,right:-6,color:c.have,fontSize:13,fontWeight:900},
    stickerReqBadge:{position:"absolute",top:-6,right:-6,background:"#3b82f6",color:"white",fontSize:9,fontWeight:800,borderRadius:999,padding:"2px 5px"},
    selectRow:{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"},
    selectLabel:{fontSize:13,fontWeight:700},
    select:{flex:1,minWidth:160,padding:"9px 10px",borderRadius:8,border:`1px solid ${c.border}`,background:c.select,color:c.ink,fontSize:14},
    note:{fontSize:13.5,color:c.inkLight,padding:"10px 0"},
    sectionTitle:{fontFamily:"'Anton',sans-serif",fontSize:16,margin:"18px 0 8px",letterSpacing:0.3,color:c.ink},
    tradeList:{listStyle:"none",margin:0,padding:0,display:"flex",flexDirection:"column",gap:8},
    tradeItem:{background:c.card,borderRadius:10,padding:"10px 12px",fontSize:13,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",boxShadow:dark?"0 1px 4px rgba(0,0,0,0.3)":"0 1px 3px rgba(28,37,65,0.1)",color:c.ink},
    tradeBadgeGreen:{background:c.have,color:"white",fontSize:10,fontWeight:800,borderRadius:999,padding:"2px 7px",flexShrink:0},
    tradeBadgeAmber:{background:c.dup,color:"white",fontSize:10,fontWeight:800,borderRadius:999,padding:"2px 7px",flexShrink:0},
    tradeBadgePurple:{background:"#7a6fa0",color:"white",fontSize:10,fontWeight:800,borderRadius:999,padding:"2px 7px",flexShrink:0},
    emptyState:{fontSize:13.5,color:c.noteText,background:c.bgDark,borderRadius:10,padding:"16px 14px"},
    userPickerGrid:{display:"flex",flexWrap:"wrap",gap:8,margin:"10px 0 14px"},
    userChip:{padding:"8px 14px",borderRadius:999,border:`2px solid ${c.border}`,background:c.chipBg,color:c.ink,fontWeight:700,fontSize:13,cursor:"pointer"},
    userChipActive:{background:c.ink,color:c.gold,borderColor:c.ink},
    searchButton:{width:"100%",padding:"13px",borderRadius:10,border:"none",background:c.gold,color:"#1C2541",fontFamily:"'Anton',sans-serif",fontSize:15,letterSpacing:0.5,cursor:"pointer",marginBottom:4},
    requestBtn:{marginLeft:"auto",padding:"5px 12px",borderRadius:8,border:"none",background:c.ink,color:c.gold,fontSize:11.5,fontWeight:700,cursor:"pointer",flexShrink:0},
    requestBtnSent:{marginLeft:"auto",padding:"5px 12px",borderRadius:8,border:`1px solid ${c.border}`,background:"transparent",color:c.inkLight,fontSize:11.5,cursor:"default",flexShrink:0},
    inboxCard:{background:c.card,borderRadius:12,padding:"14px",marginBottom:10,boxShadow:dark?"0 1px 4px rgba(0,0,0,0.3)":"0 1px 3px rgba(28,37,65,0.1)"},
    inboxSticker:{fontFamily:"'Anton',sans-serif",fontSize:14,marginBottom:4,color:c.ink},
    inboxFrom:{fontSize:12.5,color:c.inkLight,marginBottom:10},
    inboxActions:{display:"flex",gap:8},
    acceptBtn:{flex:1,padding:"9px",borderRadius:8,border:"none",background:c.have,color:"white",fontWeight:700,fontSize:13,cursor:"pointer"},
    declineBtn:{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${c.border}`,background:"transparent",color:c.inkLight,fontWeight:700,fontSize:13,cursor:"pointer"},
    sentCard:{background:c.card,borderRadius:12,padding:"12px 14px",marginBottom:8,fontSize:13,display:"flex",alignItems:"center",gap:8,color:c.ink,flexWrap:"wrap",boxShadow:dark?"0 1px 4px rgba(0,0,0,0.3)":"0 1px 3px rgba(28,37,65,0.1)"},
    loginWrap:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:dark?"#0a0c12":"#1C2541",padding:20},
    loginCard:{background:c.bg,borderRadius:18,padding:"26px 24px 22px",maxWidth:360,width:"100%",boxShadow:"0 20px 50px rgba(0,0,0,0.5)",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"},
    loginRibbon:{position:"absolute",top:14,right:-38,background:c.gold,color:"#1C2541",fontFamily:"'Anton',sans-serif",fontSize:12,padding:"4px 40px",transform:"rotate(35deg)",letterSpacing:1,fontWeight:700},
    loginTitle:{fontFamily:"'Anton',sans-serif",fontSize:30,margin:"8px 0 6px",textAlign:"center",lineHeight:1.15,color:c.ink},
    loginSub:{fontSize:13.5,textAlign:"center",color:c.inkLight,marginBottom:18,lineHeight:1.5},
    loginInput:{width:"100%",padding:"13px 14px",borderRadius:10,border:`2px solid ${c.border}`,fontSize:15,marginBottom:10,background:c.card,color:c.ink},
    loginError:{color:"#b3401a",fontSize:12.5,marginBottom:8},
    loginButton:{width:"100%",padding:"13px 14px",borderRadius:10,border:"none",background:"#1C2541",color:c.gold,fontFamily:"'Anton',sans-serif",fontSize:15,letterSpacing:0.5,cursor:"pointer"},
    loginNote:{fontSize:11.5,color:c.inkLight,marginTop:16,textAlign:"center",lineHeight:1.5},
    debugBanner:{background:"#B3401A",color:"white",fontSize:12.5,padding:"10px 38px 10px 14px",position:"relative",lineHeight:1.4},
    debugClose:{position:"absolute",top:6,right:10,background:"transparent",border:"none",color:"white",fontSize:16,cursor:"pointer"},
    msgHistory:{flex:1,overflowY:"auto",padding:"8px 0",display:"flex",flexDirection:"column",gap:6},
    msgInputRow:{display:"flex",gap:8,marginTop:10},
    msgInput:{flex:1,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${c.border}`,background:c.card,color:c.ink,fontSize:14},
    msgSendBtn:{padding:"10px 16px",borderRadius:10,border:"none",background:c.ink,color:c.gold,fontWeight:700,fontSize:14,cursor:"pointer"},
    c, // expose color palette
  };
}

const DEFAULT_SECTIONS = [
  {name:"FWC – Sondersticker",count:20,startAt:0},
  {name:"Mexiko (A)",count:20},{name:"Südafrika (A)",count:20},{name:"Südkorea (A)",count:20},{name:"Tschechien (A)",count:20},
  {name:"Kanada (B)",count:20},{name:"Bosnien-Herzegowina (B)",count:20},{name:"Katar (B)",count:20},{name:"Schweiz (B)",count:20},
  {name:"Brasilien (C)",count:20},{name:"Haiti (C)",count:20},{name:"Marokko (C)",count:20},{name:"Schottland (C)",count:20},
  {name:"USA (D)",count:20},{name:"Australien (D)",count:20},{name:"Paraguay (D)",count:20},{name:"Türkei (D)",count:20},
  {name:"Deutschland (E)",count:20},{name:"Curaçao (E)",count:20},{name:"Ecuador (E)",count:20},{name:"Elfenbeinküste (E)",count:20},
  {name:"Niederlande (F)",count:20},{name:"Japan (F)",count:20},{name:"Schweden (F)",count:20},{name:"Tunesien (F)",count:20},
  {name:"Belgien (G)",count:20},{name:"Ägypten (G)",count:20},{name:"Iran (G)",count:20},{name:"Neuseeland (G)",count:20},
  {name:"Spanien (H)",count:20},{name:"Kap Verde (H)",count:20},{name:"Saudi-Arabien (H)",count:20},{name:"Uruguay (H)",count:20},
  {name:"Frankreich (I)",count:20},{name:"Irak (I)",count:20},{name:"Norwegen (I)",count:20},{name:"Senegal (I)",count:20},
  {name:"Argentinien (J)",count:20},{name:"Algerien (J)",count:20},{name:"Jordanien (J)",count:20},{name:"Österreich (J)",count:20},
  {name:"Portugal (K)",count:20},{name:"DR Kongo (K)",count:20},{name:"Kolumbien (K)",count:20},{name:"Usbekistan (K)",count:20},
  {name:"England (L)",count:20},{name:"Ghana (L)",count:20},{name:"Kroatien (L)",count:20},{name:"Panama (L)",count:20},
];

const STATUS_CYCLE = {missing:"have",have:"duplicate",duplicate:"missing"};
const LOCAL_KEY = "tauschboerse_profile";
const DARK_KEY = "tauschboerse_dark";
const ACCESS_CODE = "panini2026";
const ACCESS_KEY = "tauschboerse_access";

function stickerKey(sec, n) { return `${sec}#${n}`; }
function stickerLabel(key) { const i = key.lastIndexOf("#"); return `${key.slice(0,i)} #${key.slice(i+1)}`; }
function statusLabel(st) { return {pending:"⏳ Ausstehend",accepted:"✓ Angenommen",completed:"✅ Abgeschlossen",declined:"❌ Abgelehnt",cancelled:"🚫 Abgebrochen"}[st]||st; }
function statusColor(st) { return {accepted:"#2E7D5B",completed:"#2E7D5B",declined:"#b3401a",cancelled:"#666",pending:"#7a6fa0"}[st]||"#7a6fa0"; }

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem(DARK_KEY) === "1");
  const s = useMemo(() => buildStyles(dark ? DARK : LIGHT, dark), [dark]);
  const toggleDark = () => setDark(d => { localStorage.setItem(DARK_KEY, d?"0":"1"); return !d; });

  const [accessGranted, setAccessGranted] = useState(() => localStorage.getItem(ACCESS_KEY) === "1");
  const [accessInput, setAccessInput] = useState("");
  const [accessError, setAccessError] = useState("");
  const handleAccessCode = (e) => {
    e.preventDefault();
    if (accessInput.trim() === ACCESS_CODE) { localStorage.setItem(ACCESS_KEY,"1"); setAccessGranted(true); }
    else setAccessError("Falscher Code.");
  };

  const [profile, setProfile] = useState(undefined);
  const [users, setUsers] = useState([]);
  const [myStickers, setMyStickers] = useState(null);
  const [tab, setTab] = useState("sammlung");
  const [openSection, setOpenSection] = useState(null);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [debugMessage, setDebugMessage] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { document.title = "Tauschbörse"; }, []);
  useEffect(() => { document.body.style.background = dark ? "#0a0c12" : "#F3ECD9"; }, [dark]);

  const loadUnread = useCallback(async (uid) => {
    if (!uid) return;
    const { count } = await supabase.from("messages").select("id",{count:"exact",head:true}).eq("to_user_id",uid).eq("read",false);
    setUnreadCount(count||0);
  }, []);

  const loadRequests = useCallback(async (uid) => {
    const { data: inc } = await supabase.from("trade_requests").select("id,from_user_id,sticker_id,status,created_at").eq("to_user_id",uid).in("status",["pending","accepted"]).order("created_at",{ascending:false});
    setIncomingRequests(inc||[]);
    const { data: sent } = await supabase.from("trade_requests").select("id,to_user_id,sticker_id,status,created_at").eq("from_user_id",uid).order("created_at",{ascending:false});
    setSentRequests(sent||[]);
  }, []);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) { try { setProfile(JSON.parse(raw)); } catch(e) { setProfile(null); } } else setProfile(null);
      const { data } = await supabase.from("profiles").select("id,name").order("name");
      if (data) setUsers(data);
    })();
  }, []);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from("user_stickers").select("sticker_id,status").eq("user_id",profile.id);
      const map = {};
      (data||[]).forEach(r => { map[r.sticker_id]=r.status; });
      setMyStickers(map);
    })();
    loadRequests(profile.id);
    loadUnread(profile.id);
    const iv = setInterval(() => { loadRequests(profile.id); loadUnread(profile.id); }, 15000);
    return () => clearInterval(iv);
  }, [profile, loadRequests, loadUnread]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const name = loginInput.trim();
    if (!name||name.length>30) { setLoginError("Name ungültig."); return; }
    setBusy(true); setLoginError("");
    try {
      const { data: ex } = await supabase.from("profiles").select("id,name").ilike("name",name).maybeSingle();
      let p = ex;
      if (!p) {
        const { data: cr, error } = await supabase.from("profiles").insert({name}).select("id,name").single();
        if (error) throw error;
        p = cr;
        setUsers(prev => [...prev,p].sort((a,b)=>a.name.localeCompare(b.name)));
      }
      localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
      setProfile(p);
    } catch(err) { setLoginError("Fehler: "+err.message); }
    finally { setBusy(false); }
  };

  const handleLogout = () => { localStorage.removeItem(LOCAL_KEY); setProfile(null); setMyStickers(null); };

  const toggleSticker = useCallback(async (secName, idx) => {
    if (!myStickers||!profile) return;
    const key = stickerKey(secName, idx+1);
    const next = STATUS_CYCLE[myStickers[key]||"missing"];
    const updated = {...myStickers};
    if (next==="missing") delete updated[key]; else updated[key]=next;
    setMyStickers(updated);
    try {
      if (next==="missing") {
        const {error} = await supabase.from("user_stickers").delete().eq("user_id",profile.id).eq("sticker_id",key);
        if (error) throw error;
      } else {
        const {error} = await supabase.from("user_stickers").upsert({user_id:profile.id,sticker_id:key,status:next},{onConflict:"user_id,sticker_id"});
        if (error) throw error;
      }
      setDebugMessage(null);
    } catch(err) {
      setDebugMessage(err?.message+(err?.hint?" · "+err.hint:"")+(err?.code?" · "+err.code:""));
      setMyStickers(myStickers);
    }
  }, [myStickers, profile]);

  const sendRequest = async (toUserId, stickerId) => {
    if (!profile) return;
    const {error} = await supabase.from("trade_requests").insert({from_user_id:profile.id,to_user_id:toUserId,sticker_id:stickerId});
    if (error) { setDebugMessage("Anfrage fehlgeschlagen: "+error.message); return; }
    await loadRequests(profile.id);
  };

  const acceptRequest = async (req) => {
    await supabase.from("trade_requests").update({status:"accepted"}).eq("id",req.id);
    await supabase.from("trade_requests").update({status:"declined"}).eq("to_user_id",profile.id).eq("sticker_id",req.sticker_id).eq("status","pending").neq("id",req.id);
    await loadRequests(profile.id);
  };

  const completeRequest = async (req) => {
    await supabase.from("user_stickers").upsert({user_id:profile.id,sticker_id:req.sticker_id,status:"have"},{onConflict:"user_id,sticker_id"});
    await supabase.from("user_stickers").upsert({user_id:req.from_user_id,sticker_id:req.sticker_id,status:"have"},{onConflict:"user_id,sticker_id"});
    await supabase.from("trade_requests").update({status:"completed"}).eq("id",req.id);
    setMyStickers(prev => ({...prev,[req.sticker_id]:"have"}));
    await loadRequests(profile.id);
  };

  const declineRequest = async (reqId) => {
    await supabase.from("trade_requests").update({status:"declined"}).eq("id",reqId);
    await loadRequests(profile.id);
  };

  const cancelRequest = async (reqId) => {
    await supabase.from("trade_requests").update({status:"cancelled"}).eq("id",reqId);
    await loadRequests(profile.id);
  };

  const exportPDF = useCallback(() => {
    if (!myStickers||!profile) return;
    const miss=[],dups=[];
    DEFAULT_SECTIONS.forEach(sec => {
      const start=sec.startAt??1;
      const sm=[],sd=[];
      for(let i=0;i<sec.count;i++){
        const n=start+i;
        const st=myStickers[stickerKey(sec.name,n)];
        const label=sec.startAt===0?String(n).padStart(2,"0"):n;
        if(!st||st==="missing")sm.push(label);else if(st==="duplicate")sd.push(label);
      }
      if(sm.length)miss.push({section:sec.name,numbers:sm});
      if(sd.length)dups.push({section:sec.name,numbers:sd});
    });
    const rows=list=>list.map(r=>`<tr><td>${r.section}</td><td>${r.numbers.join(", ")}</td></tr>`).join("");
    const html=`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Tauschboerse</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#1C2541;padding:28px;font-size:11px}
h1{font-size:22px;margin-bottom:2px}.sub{font-size:11px;color:#665f45;margin-bottom:20px}h2{font-size:14px;margin:18px 0 6px}
.b{display:inline-block;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:700;margin-left:6px;vertical-align:middle}
.bd{background:#1C2541;color:white}.ba{background:#E2862F;color:white}
table{width:100%;border-collapse:collapse}th{background:#1C2541;color:#D9A441;padding:6px 10px;text-align:left}
td{padding:5px 10px;border-bottom:1px solid #e8dec4;vertical-align:top}tr:nth-child(even) td{background:#f9f5ec}
.empty{color:#8a8265;font-style:italic;margin:8px 0}@media print{body{padding:10px}}</style></head>
<body><h1>Tauschbörse</h1><div class="sub">WM 2026 · ${profile.name} · ${new Date().toLocaleDateString("de-DE")}</div>
<h2>Fehlende Sticker <span class="b bd">${miss.reduce((a,r)=>a+r.numbers.length,0)}</span></h2>
${miss.length===0?'<div class="empty">Keine!</div>':`<table><thead><tr><th>Abschnitt</th><th>Nummern</th></tr></thead><tbody>${rows(miss)}</tbody></table>`}
<h2>Doppelte Sticker <span class="b ba">${dups.reduce((a,r)=>a+r.numbers.length,0)}</span></h2>
${dups.length===0?'<div class="empty">Keine.</div>':`<table><thead><tr><th>Abschnitt</th><th>Nummern</th></tr></thead><tbody>${rows(dups)}</tbody></table>`}
<script>window.onload=function(){window.print()}<\/script></body></html>`;
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
    a.target="_blank";a.rel="noopener noreferrer";a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  }, [myStickers, profile]);

  const myStats = useMemo(() => {
    if (!myStickers) return null;
    let have=0,dup=0;
    Object.values(myStickers).forEach(st=>{if(st==="have")have++;else if(st==="duplicate")dup++;});
    const total=DEFAULT_SECTIONS.reduce((sum,s)=>sum+s.count,0);
    return {have,dup,missing:total-have-dup,total};
  }, [myStickers]);

  const pendingCount = incomingRequests.filter(r=>r.status==="pending").length;
  const requestedKeys = useMemo(() => new Set(sentRequests.filter(r=>r.status==="pending"||r.status==="accepted").map(r=>r.sticker_id)), [sentRequests]);
  const otherUsers = useMemo(() => users.filter(u=>u.id!==profile?.id), [users, profile]);

  // Access gate
  if (!accessGranted) return (
    <ThemeContext.Provider value={{dark,s}}>
      <FontStyles />
      <div style={s.loginWrap}>
        <div style={s.loginCard}>
          <div style={s.loginRibbon}>WM 2026</div>
          <h1 style={s.loginTitle}>Tauschbörse</h1>
          <p style={s.loginSub}>Nur für eingeladene Sammler.</p>
          <form onSubmit={handleAccessCode} style={{width:"100%"}}>
            <input style={s.loginInput} placeholder="Zugangscode" type="password" value={accessInput} onChange={e=>setAccessInput(e.target.value)} autoFocus />
            {accessError&&<div style={s.loginError}>{accessError}</div>}
            <button type="submit" style={s.loginButton}>Einloggen</button>
          </form>
        </div>
      </div>
    </ThemeContext.Provider>
  );

  if (profile===undefined) return (
    <ThemeContext.Provider value={{dark,s}}><FontStyles />
      <div style={{...s.app,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
        <span style={{fontFamily:"'Anton',sans-serif",fontSize:22}}>Wird geladen …</span>
      </div>
    </ThemeContext.Provider>
  );

  if (!profile) return (
    <ThemeContext.Provider value={{dark,s}}><FontStyles />
      <div style={s.loginWrap}>
        <div style={s.loginCard}>
          <div style={s.loginRibbon}>WM 2026</div>
          <h1 style={s.loginTitle}>Tauschbörse</h1>
          <p style={s.loginSub}>Trag deinen Namen ein.{users.length>0&&<> Schon <b>{users.length}</b> Sammler.</>}</p>
          <form onSubmit={handleLogin} style={{width:"100%"}}>
            <input style={s.loginInput} placeholder="Dein Name" value={loginInput} onChange={e=>setLoginInput(e.target.value)} autoFocus maxLength={30} />
            {loginError&&<div style={s.loginError}>{loginError}</div>}
            <button type="submit" style={s.loginButton} disabled={busy}>{busy?"Moment …":"Heft öffnen"}</button>
          </form>
        </div>
      </div>
    </ThemeContext.Provider>
  );

  return (
    <ThemeContext.Provider value={{dark,s}}>
      <FontStyles />
      <div style={s.app}>
        {debugMessage&&<div style={s.debugBanner}>⚠️ {debugMessage}<button style={s.debugClose} onClick={()=>setDebugMessage(null)}>✕</button></div>}
        <header style={s.header}>
          <div style={s.headerRibbon}>TAUSCHBÖRSE · WM 2026</div>
          <div style={s.headerRow}>
            <div>
              <div style={s.headerName}>{profile.name}</div>
              {myStats&&<div style={s.headerStats}>{myStats.have+myStats.dup}/{myStats.total} geklebt · {myStats.dup} doppelt · {myStats.missing} fehlen</div>}
            </div>
            <div style={s.headerRight}>
              {myStats&&<div style={s.progressOuter}><div style={{...s.progressInner,width:`${Math.round((myStats.have+myStats.dup)/myStats.total*100)}%`}}/><span style={s.progressLabel}>{Math.round((myStats.have+myStats.dup)/myStats.total*100)}%</span></div>}
              <button style={s.darkToggle} onClick={toggleDark}>{dark?"☀️":"🌙"}</button>
              <button style={s.logoutBtn} onClick={handleLogout}>Abmelden</button>
            </div>
          </div>
        </header>
        <nav style={s.tabs}>
          <TabBtn label="Sammlung" active={tab==="sammlung"} onClick={()=>setTab("sammlung")} />
          <TabBtn label="Sammler" active={tab==="sammler"} onClick={()=>setTab("sammler")} />
          <TabBtn label="Tausch" active={tab==="tausch"} onClick={()=>setTab("tausch")} />
          <TabBtn label="Anfragen" active={tab==="anfragen"} onClick={()=>setTab("anfragen")} badge={pendingCount} />
          <TabBtn label="💬" active={tab==="nachrichten"} onClick={()=>{setTab("nachrichten");setUnreadCount(0);}} badge={unreadCount} />
          <button onClick={exportPDF} style={s.pdfButton}>📄</button>
        </nav>
        <main style={s.main}>
          {tab==="sammlung"&&myStickers&&<CollectionView data={myStickers} openSection={openSection} setOpenSection={setOpenSection} onToggle={toggleSticker} editable requestedKeys={requestedKeys} />}
          {tab==="sammler"&&<OthersView users={otherUsers} profile={profile} />}
          {tab==="tausch"&&myStickers&&<TradeView profile={profile} myStickers={myStickers} users={otherUsers} sentRequests={sentRequests} onSendRequest={sendRequest} />}
          {tab==="anfragen"&&<AnfragenView incomingRequests={incomingRequests} sentRequests={sentRequests} users={users} onAccept={acceptRequest} onComplete={completeRequest} onDecline={declineRequest} onCancel={cancelRequest} onRefresh={()=>loadRequests(profile.id)} />}
          {tab==="nachrichten"&&<NachrichtenView profile={profile} users={otherUsers} onMarkRead={()=>loadUnread(profile.id)} />}
        </main>
        <footer style={s.footer}>Sticker antippen: leer → habe ich → doppelt</footer>
      </div>
    </ThemeContext.Provider>
  );
}

function TabBtn({label,active,onClick,badge}) {
  const {s}=useTheme();
  return <button onClick={onClick} style={{...s.tabButton,...(active?s.tabButtonActive:{})}}>{label}{badge>0&&<span style={s.tabBadge}>{badge}</span>}</button>;
}

function CollectionView({data,openSection,setOpenSection,onToggle,editable,requestedKeys=new Set()}) {
  const {s}=useTheme();
  return (
    <div style={s.countryList}>
      {DEFAULT_SECTIONS.map(sec=>{
        let have=0,dup=0;
        const start=sec.startAt??1;
        for(let i=0;i<sec.count;i++){const st=data[stickerKey(sec.name,start+i)];if(st==="have")have++;else if(st==="duplicate")dup++;}
        const complete=have+dup===sec.count;
        const isOpen=openSection===sec.name;
          return (
          <div key={sec.name} style={s.countryCard}>
            <button style={{...s.countryHeader,...(complete?s.countryHeaderComplete:{})}} onClick={()=>setOpenSection(isOpen?null:sec.name)}>
              <span style={s.countryName}>{sec.name}</span>
              <span style={s.countryProgress}>{have+dup}/{sec.count}{dup>0?` · ${dup}×2`:""}</span>
              <span style={s.chevron}>{isOpen?"▲":"▼"}</span>
            </button>
            {isOpen&&<div style={s.stickerGrid}>
              {Array.from({length:sec.count},(_,i)=>start+i).map(n=>{
                const key=stickerKey(sec.name,n);
                const st=data[key]||"missing";
                const req=requestedKeys.has(key);
                const label=sec.startAt===0?String(n).padStart(2,"0"):n;
                return <StickerCell key={n} number={label} status={st} requested={req} onClick={editable?()=>onToggle(sec.name,n):undefined}/>;
              })}
            </div>}
          </div>
        );
      })}
    </div>
  );
}


function StickerCell({number,status,requested,onClick}) {
  const {s}=useTheme();
  const styleMap={missing:s.stickerMissing,have:s.stickerHave,duplicate:s.stickerDuplicate};
  return (
    <button onClick={onClick} disabled={!onClick} style={{...s.sticker,...(requested?s.stickerRequested:styleMap[status]),cursor:onClick?"pointer":"default"}}>
      <span style={s.stickerNumber}>{number}</span>
      {!requested&&status==="duplicate"&&<span style={s.stickerBadge}>2×</span>}
      {!requested&&status==="have"&&<span style={s.stickerCheck}>✓</span>}
      {requested&&<span style={s.stickerReqBadge}>↗</span>}
    </button>
  );
}

function OthersView({users,profile}) {
  const {s}=useTheme();
  const [viewUserId,setViewUserId]=useState("");
  const [data,setData]=useState(null);
  const [openSection,setOpenSection]=useState(null);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    if(!viewUserId){setData(null);return;}
    setLoading(true);
    supabase.from("user_stickers").select("sticker_id,status").eq("user_id",viewUserId).then(({data:rows})=>{
      const map={};(rows||[]).forEach(r=>{map[r.sticker_id]=r.status;});
      setData(map);setLoading(false);
    });
  },[viewUserId]);
  if(users.length===0) return <div style={s.emptyState}>Noch keine anderen Sammler.</div>;
  return (
    <div>
      <div style={s.selectRow}>
        <label style={s.selectLabel}>Sammler:</label>
        <select style={s.select} value={viewUserId} onChange={e=>{setViewUserId(e.target.value);setOpenSection(null);}}>
          <option value="">– bitte wählen –</option>
          {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      {loading&&<div style={s.note}>Lade …</div>}
      {data&&!loading&&<CollectionView data={data} openSection={openSection} setOpenSection={setOpenSection} onToggle={()=>{}} editable={false}/>}
    </div>
  );
}

function TradeView({profile,myStickers,users,sentRequests,onSendRequest}) {
  const {s}=useTheme();
  const [selectedIds,setSelectedIds]=useState([]);
  const [allRows,setAllRows]=useState(null);
  const [loading,setLoading]=useState(false);
  const [sending,setSending]=useState(null);

  const nameOf=useCallback(id=>users.find(u=>u.id===id)?.name||"?",[users]);

  const toggleUser=id=>{setSelectedIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);setAllRows(null);};
  const search=async()=>{
    if(!selectedIds.length)return;setLoading(true);
    const {data}=await supabase.from("user_stickers").select("user_id,sticker_id,status").in("user_id",selectedIds);
    setAllRows(data||[]);setLoading(false);
  };

  const myMissing=useMemo(()=>{
    const set=new Set();
    DEFAULT_SECTIONS.forEach(sec=>{
      const start=sec.startAt??1;
      for(let i=0;i<sec.count;i++){if(!myStickers[stickerKey(sec.name,start+i)])set.add(stickerKey(sec.name,start+i));}
    });
    return set;
  },[myStickers]);
  const myDups=useMemo(()=>Object.entries(myStickers).filter(([,st])=>st==="duplicate").map(([k])=>k),[myStickers]);

  const alreadySent=useMemo(()=>{const set=new Set();sentRequests.filter(r=>r.status==="pending"||r.status==="accepted").forEach(r=>set.add(`${r.to_user_id}::${r.sticker_id}`));return set;},[sentRequests]);
  const alreadySentStickers=useMemo(()=>{const set=new Set();sentRequests.filter(r=>r.status==="pending"||r.status==="accepted").forEach(r=>set.add(r.sticker_id));return set;},[sentRequests]);

  const offersForMe=useMemo(()=>allRows?allRows.filter(r=>r.status==="duplicate"&&myMissing.has(r.sticker_id)).map(r=>({userId:r.user_id,user:nameOf(r.user_id),key:r.sticker_id})):[],[allRows,myMissing,nameOf]);
  const wantFromMe=useMemo(()=>{
    if(!allRows)return[];
    const presence={};allRows.forEach(r=>{if(!presence[r.user_id])presence[r.user_id]=new Set();presence[r.user_id].add(r.sticker_id);});
    const reqs=[];myDups.forEach(key=>{selectedIds.forEach(uid=>{if(!presence[uid]?.has(key))reqs.push({user:nameOf(uid),key});});});
    return reqs;
  },[allRows,myDups,selectedIds,nameOf]);

  if(users.length===0) return <div style={s.emptyState}>Noch keine anderen Sammler.</div>;
  return (
    <div>
      <h2 style={s.sectionTitle}>Mit wem tauschen?</h2>
      <div style={s.userPickerGrid}>{users.map(u=>{const sel=selectedIds.includes(u.id);return <button key={u.id} onClick={()=>toggleUser(u.id)} style={{...s.userChip,...(sel?s.userChipActive:{})}}>{sel?"✓ ":""}{u.name}</button>;})}</div>
      <button onClick={search} disabled={!selectedIds.length||loading} style={{...s.searchButton,opacity:!selectedIds.length?0.5:1}}>{loading?"Suche …":"Tauschmöglichkeiten prüfen"}</button>
      {allRows&&!loading&&<>
        <h2 style={s.sectionTitle}>Das kannst du bekommen</h2>
        {offersForMe.length===0?<div style={s.emptyState}>Niemand hat doppelt, was du brauchst.</div>:<ul style={s.tradeList}>{offersForMe.map((o,i)=>{
          const sentKey=`${o.userId}::${o.key}`;const isSent=alreadySent.has(sentKey);const isBlocked=!isSent&&alreadySentStickers.has(o.key);const isSending=sending===sentKey;
          return <li key={i} style={s.tradeItem}><span style={s.tradeBadgeGreen}>2×</span><span style={{flex:1}}><b>{stickerLabel(o.key)}</b> — <b>{o.user}</b></span>
            {isSent?<span style={s.requestBtnSent}>✓ Angefragt</span>:isBlocked?<span style={{...s.requestBtnSent,color:"#b3401a"}}>bereits angefragt</span>:<button style={s.requestBtn} disabled={isSending} onClick={async()=>{setSending(sentKey);await onSendRequest(o.userId,o.key);setSending(null);}}>{isSending?"…":"Anfragen"}</button>}
          </li>;
        })}</ul>}
        <h2 style={s.sectionTitle}>Das kannst du anbieten</h2>
        {wantFromMe.length===0?<div style={s.emptyState}>Niemand braucht deine Doppelten.</div>:<ul style={s.tradeList}>{wantFromMe.map((r,i)=><li key={i} style={s.tradeItem}><span style={s.tradeBadgeAmber}>fehlt</span><b>{stickerLabel(r.key)}</b> — <b>{r.user}</b> sucht ihn</li>)}</ul>}
      </>}
    </div>
  );
}

function AnfragenView({incomingRequests,sentRequests,users,onAccept,onComplete,onDecline,onCancel,onRefresh}) {
  const {s}=useTheme();
  const [busy,setBusy]=useState(null);
  const nameOf=useCallback(id=>users.find(u=>u.id===id)?.name||"?",[users]);
  const pending=incomingRequests.filter(r=>r.status==="pending");
  const accepted=incomingRequests.filter(r=>r.status==="accepted");
  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
        <button onClick={onRefresh} style={{...s.requestBtnSent,cursor:"pointer"}}>🔄 Aktualisieren</button>
      </div>
      <h2 style={{...s.sectionTitle,margin:"0 0 8px"}}>Offene Anfragen</h2>
      {pending.length===0?<div style={s.emptyState}>Keine offenen Anfragen.</div>:pending.map(req=>(
        <div key={req.id} style={s.inboxCard}>
          <div style={s.inboxSticker}>{stickerLabel(req.sticker_id)}</div>
          <div style={s.inboxFrom}><b>{nameOf(req.from_user_id)}</b> möchte diesen Sticker von dir</div>
          <div style={s.inboxActions}>
            <button style={s.acceptBtn} disabled={busy===req.id} onClick={async()=>{setBusy(req.id);await onAccept(req);setBusy(null);}}>Annehmen</button>
            <button style={s.declineBtn} disabled={busy===req.id} onClick={async()=>{setBusy(req.id);await onDecline(req.id);setBusy(null);}}>Ablehnen</button>
          </div>
        </div>
      ))}
      <h2 style={{...s.sectionTitle,marginTop:24,marginBottom:8}}>Angenommen – offen</h2>
      {accepted.length===0?<div style={s.emptyState}>Keine.</div>:accepted.map(req=>(
        <div key={req.id} style={{...s.inboxCard,borderLeft:"4px solid #2E7D5B"}}>
          <div style={s.inboxSticker}>{stickerLabel(req.sticker_id)}</div>
          <div style={s.inboxFrom}><b>{nameOf(req.from_user_id)}</b> – Tausch vereinbart</div>
          <div style={s.inboxActions}>
            <button style={{...s.acceptBtn,background:"#1C2541"}} disabled={busy===req.id} onClick={async()=>{setBusy(req.id);await onComplete(req);setBusy(null);}}>{busy===req.id?"…":"✓ Abschließen"}</button>
          </div>
        </div>
      ))}
      <h2 style={{...s.sectionTitle,marginTop:24,marginBottom:8}}>Gesendete Anfragen</h2>
      {sentRequests.length===0?<div style={s.emptyState}>Noch keine gesendet.</div>:<ul style={s.tradeList}>{sentRequests.map(req=>(
        <li key={req.id} style={s.sentCard}>
          <span style={{...s.tradeBadgePurple,background:statusColor(req.status)}}>{statusLabel(req.status)}</span>
          <span style={{flex:1}}><b>{stickerLabel(req.sticker_id)}</b> → <b>{nameOf(req.to_user_id)}</b></span>
          {req.status==="pending"&&<button style={{...s.declineBtn,padding:"4px 10px",fontSize:11.5,cursor:"pointer",border:"1px solid #b3401a",color:"#b3401a",flex:"unset"}} disabled={busy===req.id} onClick={async()=>{setBusy(req.id);await onCancel(req.id);setBusy(null);}}>{busy===req.id?"…":"Abbrechen"}</button>}
        </li>
      ))}</ul>}
    </div>
  );
}

function NachrichtenView({profile,users,onMarkRead}) {
  const {s}=useTheme();
  const c=s.c;
  const [selectedUserId,setSelectedUserId]=useState("");
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [sending,setSending]=useState(false);
  const [conversations,setConversations]=useState([]); // [{userId, name, lastMsg, unread}]
  const [convsLoading,setConvsLoading]=useState(true);
  const bottomRef=useRef(null);

  const nameOf=useCallback(id=>id===profile.id?"Du":users.find(u=>u.id===id)?.name||"?",[users,profile.id]);

  // Lade Übersicht aller Gespräche
  const loadConversations=useCallback(async()=>{
    const {data}=await supabase.from("messages")
      .select("id,from_user_id,to_user_id,content,read,created_at")
      .or(`from_user_id.eq.${profile.id},to_user_id.eq.${profile.id}`)
      .order("created_at",{ascending:false});
    if(!data){setConvsLoading(false);return;}
    // Gruppiere nach Gesprächspartner
    const map={};
    data.forEach(m=>{
      const otherId=m.from_user_id===profile.id?m.to_user_id:m.from_user_id;
      if(!map[otherId]){map[otherId]={userId:otherId,lastMsg:m.content,lastTime:m.created_at,unread:0};}
      if(m.to_user_id===profile.id&&!m.read)map[otherId].unread++;
    });
    setConversations(Object.values(map).sort((a,b)=>new Date(b.lastTime)-new Date(a.lastTime)));
    setConvsLoading(false);
  },[profile.id]);

  useEffect(()=>{loadConversations();},[loadConversations]);

  const loadMsgs=useCallback(async(uid)=>{
    if(!uid)return;
    const {data}=await supabase.from("messages")
      .select("id,from_user_id,to_user_id,content,read,created_at")
      .or(`and(from_user_id.eq.${profile.id},to_user_id.eq.${uid}),and(from_user_id.eq.${uid},to_user_id.eq.${profile.id})`)
      .order("created_at",{ascending:true});
    setMessages(data||[]);setLoading(false);
    await supabase.from("messages").update({read:true}).eq("from_user_id",uid).eq("to_user_id",profile.id).eq("read",false);
    onMarkRead();
    loadConversations();
  },[profile.id,onMarkRead,loadConversations]);

  const selectedRef=useRef(selectedUserId);
  useEffect(()=>{selectedRef.current=selectedUserId;},[selectedUserId]);

  useEffect(()=>{
    if(!selectedUserId)return;
    setLoading(true);setMessages([]);
    loadMsgs(selectedUserId);
    const iv=setInterval(()=>{if(selectedRef.current){loadMsgs(selectedRef.current);loadConversations();}},8000);
    return()=>clearInterval(iv);
  },[selectedUserId]); // eslint-disable-line

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send=async()=>{
    if(!input.trim()||!selectedUserId)return;
    setSending(true);const content=input.trim();setInput("");
    const {data}=await supabase.from("messages").insert({from_user_id:profile.id,to_user_id:selectedUserId,content}).select().single();
    if(data)setMessages(prev=>[...prev,data]);
    setSending(false);
    loadConversations();
  };

  const openChat=(uid)=>{setSelectedUserId(uid);setMessages([]);};

  if(users.length===0) return <div style={s.emptyState}>Noch keine anderen Sammler.</div>;

  // Chat-Ansicht
  if(selectedUserId){
    const partnerName=nameOf(selectedUserId);
    return (
      <div>
        <button onClick={()=>setSelectedUserId("")} style={{...s.declineBtn,marginBottom:12,padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13}}>
          ← {partnerName}
        </button>
        <div style={{...s.countryCard,padding:"12px 14px"}}>
          <div style={{display:"flex",flexDirection:"column",height:420}}>
            <div style={s.msgHistory}>
              {loading&&<div style={s.note}>Lade …</div>}
              {!loading&&messages.length===0&&<div style={s.emptyState}>Noch keine Nachrichten.</div>}
              {messages.map(m=>{
                const mine=m.from_user_id===profile.id;
                const time=new Date(m.created_at).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
                return <div key={m.id}>
                  <div style={{fontSize:10.5,color:c.noteText,textAlign:mine?"right":"left",marginBottom:1,paddingInline:4}}>{nameOf(m.from_user_id)} · {time}</div>
                  <div style={{maxWidth:"78%",padding:"8px 12px",borderRadius:mine?"14px 14px 4px 14px":"14px 14px 14px 4px",background:mine?c.ink:c.card,color:mine?c.gold:c.ink,alignSelf:mine?"flex-end":"flex-start",fontSize:13.5,lineHeight:1.45,display:"inline-block",float:mine?"right":"left",clear:"both"}}>{m.content}</div>
                  <div style={{clear:"both"}}/>
                </div>;
              })}
              <div ref={bottomRef}/>
            </div>
            <div style={s.msgInputRow}>
              <input style={s.msgInput} placeholder="Nachricht …" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} maxLength={500} disabled={sending}/>
              <button style={s.msgSendBtn} onClick={send} disabled={sending||!input.trim()}>{sending?"…":"➤"}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Übersicht
  return (
    <div>
      <h2 style={{...s.sectionTitle,margin:"0 0 12px"}}>Nachrichten</h2>

      {/* Neues Gespräch starten */}
      <div style={{...s.countryCard,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:12.5,fontWeight:700,marginBottom:8,color:c.inkLight}}>Neues Gespräch</div>
        <div style={s.userPickerGrid}>
          {users.map(u=><button key={u.id} onClick={()=>openChat(u.id)} style={{...s.userChip,fontSize:12}}>{u.name}</button>)}
        </div>
      </div>

      {/* Gesprächsliste */}
      {convsLoading?<div style={s.note}>Lade …</div>:
       conversations.length===0?<div style={s.emptyState}>Noch keine Gespräche.</div>:
       <ul style={{...s.tradeList}}>
        {conversations.map(conv=>{
          const name=nameOf(conv.userId);
          const time=new Date(conv.lastTime).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
          return (
            <li key={conv.userId} onClick={()=>openChat(conv.userId)}
              style={{...s.countryCard,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:999,background:c.ink,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Anton',sans-serif",fontSize:16,color:c.gold,flexShrink:0}}>
                {name[0].toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:14,color:c.ink,display:"flex",justifyContent:"space-between"}}>
                  <span>{name}</span>
                  <span style={{fontSize:11,color:c.noteText,fontWeight:400}}>{time}</span>
                </div>
                <div style={{fontSize:12.5,color:c.inkLight,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{conv.lastMsg}</div>
              </div>
              {conv.unread>0&&<span style={{background:"#3b82f6",color:"white",fontSize:11,fontWeight:900,borderRadius:999,padding:"2px 8px",flexShrink:0}}>{conv.unread}</span>}
            </li>
          );
        })}
       </ul>}
    </div>
  );
}

function FontStyles() {
  return <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;600;700;800&display=swap');*{box-sizing:border-box}body{margin:0;transition:background 0.2s}`}</style>;
}
