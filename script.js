
// v3.8.1 - Sticky jumpbar + JSON data + CSV import/export
const MAKERS = ["DMC","COSMO","Olympus","Anchor"];
const state = { currentTab:"inventory", currentMaker:"DMC", data:{}, inv:{}, wish:{} };

const JUMP_PRESET = {
  DMC:    [0,100,200,300,400,500,600,700,800,900],
  COSMO:  [100,200,300,400,500,600,700,800,900],
  Olympus:[100,200,300,700,900],
  Anchor: [0,100,200,300,400,500,600,700,800,900]
};

const LS_INV="emb_inv_v1"; const LS_WISH="emb_wish_v1";
function loadStore(){
  try{ state.inv=JSON.parse(localStorage.getItem(LS_INV)||"{}"); }catch{ state.inv={} }
  try{ state.wish=JSON.parse(localStorage.getItem(LS_WISH)||"{}"); }catch{ state.wish={} }
}
function saveStore(){
  localStorage.setItem(LS_INV, JSON.stringify(state.inv));
  localStorage.setItem(LS_WISH, JSON.stringify(state.wish));
}

// JSON fetch
async function loadJSON(){
  for(const m of MAKERS){
    const url = `data/${m}.json?ts=${Date.now()}`;
    try{ const res=await fetch(url); const json=await res.json(); state.data[m]=json.items||[]; }
    catch(e){ state.data[m]=[]; }
  }
}

// UI bindings
function bindTabs(){
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      state.currentTab = btn.dataset.tab;
      renderJump(); renderList(); window.scrollTo({top:0,behavior:"smooth"});
    });
  });
  document.querySelectorAll(".maker-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".maker-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      state.currentMaker = btn.dataset.maker;
      renderJump(); renderList(); window.scrollTo({top:0,behavior:"smooth"});
    });
  });
}

// Jump
function leadingHundreds(s){
  const m = String(s||"").match(/^\d+/);
  if(!m) return null;
  const n = parseInt(m[0],10);
  return Math.floor(n/100)*100;
}
function renderJump(){
  const bar = document.getElementById("jumpbar"); bar.innerHTML="";
  const maker = state.currentMaker;
  const items = state.data[maker]||[];
  const fromData = [...new Set(items.map(it=>leadingHundreds(it.number)).filter(v=>v!=null))].sort((a,b)=>a-b);
  const use = (fromData.length>=3)? fromData : (JUMP_PRESET[maker]||fromData);
  use.forEach(g=>{
    const b=document.createElement("button"); b.className="jump"; b.textContent = g===0?"0":String(g);
    b.addEventListener("click", ()=>{ const a=document.querySelector(`[data-anchor="${g}"]`); if(a) a.scrollIntoView({behavior:"smooth",block:"start"}); });
    bar.appendChild(b);
  });
  // place jumpbar just below header by computing offset
  setOffset();
}

// List
function sortItems(arr){
  return arr.slice().sort((a,b)=>{
    const na = parseInt((String(a.number).match(/^\d+/)||["999999"])[0],10);
    const nb = parseInt((String(b.number).match(/^\d+/)||["999999"])[0],10);
    return na-nb || String(a.number).localeCompare(String(b.number));
  });
}
function renderList(){
  const list=document.getElementById("list"); list.innerHTML="";
  const maker=state.currentMaker; const items=sortItems(state.data[maker]||[]);
  let current=null;
  items.forEach(it=>{
    const sec=leadingHundreds(it.number) ?? -1;
    if(sec!==current){ current=sec; const anchor=document.createElement("div"); anchor.setAttribute("data-anchor", String(sec)); anchor.style.height="1px"; list.appendChild(anchor); }
    list.appendChild(row(it, maker));
  });
  setOffset();
}
function row(it, maker){
  const invKey=`${maker}:${it.number}`; const wishKey=invKey;
  const wrap=document.createElement("div"); wrap.className="row";
  const sw=document.createElement("div"); sw.className="swatch"; sw.style.background=it.hex||"#fff";
  const meta=document.createElement("div"); meta.className="meta";
  meta.innerHTML=`<div class="num">${it.number}</div><div class="maker">${maker}</div>`;
  const ctrl=document.createElement("div"); ctrl.className="ctrl";
  const plus=btn("+"), minus=btn("−"), heart=btn("♡");
  const num=document.createElement("div"); num.className="count"; num.textContent=String(state.inv[invKey]||0);
  if(state.wish[wishKey]) heart.textContent="❤️";
  plus.addEventListener("click",()=>{ state.inv[invKey]=(state.inv[invKey]||0)+1; num.textContent=state.inv[invKey]; saveStore(); });
  minus.addEventListener("click",()=>{ state.inv[invKey]=Math.max(0,(state.inv[invKey]||0)-1); num.textContent=state.inv[invKey]; saveStore(); });
  heart.addEventListener("click",()=>{ state.wish[wishKey]=!state.wish[wishKey]; heart.textContent=state.wish[wishKey]?"❤️":"♡"; saveStore(); if(state.currentTab==="wishlist" && !state.wish[wishKey]) wrap.remove(); });
  ctrl.append(plus,num,minus,heart);
  wrap.append(sw,meta,ctrl);
  if(state.currentTab==="wishlist" && !state.wish[wishKey]) wrap.style.display="none";
  return wrap;
}
function btn(t){ const b=document.createElement("button"); b.className="icon"; b.textContent=t; return b; }

// CSV import / JSON export
function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(Boolean);
  if(!lines.length) return [];
  // ヘッダー行に number,hex がある場合は除去
  if(/number/i.test(lines[0]) && /hex/i.test(lines[0])) lines.shift();
  const items=[];
  for(const line of lines){
    const m = line.split(/,|\t|，/);
    const number=(m[0]||"").trim(); let hex=(m[1]||"").trim().toUpperCase().replace("＃","#");
    if(!number || !hex) continue;
    if(!hex.startsWith("#")) hex="#"+hex;
    if(/^#[0-9A-F]{3}$/.test(hex)){ hex = "#"+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3]; }
    if(!/^#[0-9A-F]{6}$/.test(hex)) continue;
    items.push({number, hex});
  }
  return items;
}
function blobDownload(name, text){
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function bindTools(){
  const file=document.getElementById("fileInput");
  document.getElementById("importBtn").addEventListener("click",()=>file.click());
  file.addEventListener("change", async e=>{
    const f=e.target.files[0]; if(!f) return;
    const text=await f.text(); const items=parseCSV(text);
    if(!items.length){ alert("CSVにデータがありません"); return; }
    const maker = prompt("どのメーカーに取り込みますか？ (DMC / COSMO / Olympus / Anchor)", state.currentMaker) || state.currentMaker;
    if(!MAKERS.includes(maker)){ alert("メーカー名が正しくありません"); return; }
    state.data[maker]=items; renderJump(); renderList();
    alert(`${maker} に ${items.length}件 取り込みました`);
  });
  document.getElementById("exportBtn").addEventListener("click",()=>{
    const maker=state.currentMaker; const items=state.data[maker]||[];
    const json=JSON.stringify({maker,items},null,2);
    blobDownload(`${maker}.json`, json);
  });
}

// Sticky offset calculation: keep jumpbar visible under header
function setOffset(){
  const header=document.querySelector(".app-header");
  const jump=document.getElementById("jumpbar");
  const headerH = header?.offsetHeight || 0;
  // Place jumpbar under header
  jump.style.top = headerH + "px";
  const offset = headerH + (jump?.offsetHeight||0) + 6;
  document.documentElement.style.setProperty("--sticky-offset", offset+"px");
  document.querySelectorAll('[data-anchor]').forEach(a=>{ a.style.scrollMarginTop=`var(--sticky-offset)`; });
}
window.addEventListener("resize", ()=>setOffset(), {passive:true});

// init
(async function init(){
  loadStore(); bindTabs(); bindTools(); await loadJSON(); renderJump(); renderList(); setOffset();
})();
