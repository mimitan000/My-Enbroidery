
// v3.7.1 - Sticky計算とアンカー停止位置の修正 / レイアウト微調整
const MAKERS = ["DMC","COSMO","Olympus"];
const state = { currentTab:"inventory", currentMaker:"DMC", data:{}, inv:{}, wish:{} };

const LS_INV="emb_inv_v1"; const LS_WISH="emb_wish_v1";
function loadStore(){ try{state.inv=JSON.parse(localStorage.getItem(LS_INV)||"{}")}catch{}; try{state.wish=JSON.parse(localStorage.getItem(LS_WISH)||"{}")}catch{} }
function saveStore(){ localStorage.setItem(LS_INV, JSON.stringify(state.inv)); localStorage.setItem(LS_WISH, JSON.stringify(state.wish)); }

async function loadJSON(){
  for(const m of MAKERS){
    try{
      const res = await fetch(`data/${m}.json?ts=${Date.now()}`);
      const json = await res.json();
      state.data[m] = Array.isArray(json.items)? json.items : [];
    }catch{ state.data[m]=[] }
  }
}

function bindTabs(){
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      state.currentTab = btn.dataset.tab;
      renderJump(); renderList(); updateStickyVars();
      window.scrollTo({top:0, behavior:"smooth"});
    });
  });
  document.querySelectorAll(".maker-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".maker-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      state.currentMaker = btn.dataset.maker;
      renderJump(); renderList(); updateStickyVars();
      window.scrollTo({top:0, behavior:"smooth"});
    });
  });
}

function leadingHundreds(s){
  const m = String(s||"").match(/^\d+/);
  if(!m) return 0; // 先頭が数字でない品番（B5200など）は 0 グループ
  const n = parseInt(m[0],10);
  return Math.floor(n/100)*100;
}
function sortItems(arr){
  return arr.slice().sort((a,b)=>{
    const na = parseInt((String(a.number).match(/^\d+/)||["0"])[0],10);
    const nb = parseInt((String(b.number).match(/^\d+/)||["0"])[0],10);
    return na-nb || String(a.number).localeCompare(String(b.number));
  });
}

function renderJump(){
  const bar = document.getElementById("jumpbar");
  bar.innerHTML = "";
  const items = sortItems(state.data[state.currentMaker]||[]);
  const groups = [...new Set(items.map(it=>leadingHundreds(it.number)))].sort((a,b)=>a-b);
  groups.forEach(g=>{
    const b=document.createElement("button"); b.className="jump"; b.textContent = String(g);
    b.addEventListener("click", ()=>{
      const a=document.querySelector(`[data-anchor="${g}"]`);
      if(a) a.scrollIntoView({behavior:"smooth", block:"start"});
    });
    bar.appendChild(b);
  });
}

function renderList(){
  const list = document.getElementById("list");
  list.innerHTML = "";
  const maker = state.currentMaker;
  const items = sortItems(state.data[maker]||[]);
  let currentSection = null;
  items.forEach(it=>{
    const sec = leadingHundreds(it.number);
    if(sec!==currentSection){
      currentSection = sec;
      const anchor = document.createElement("div");
      anchor.className="anchor";
      anchor.setAttribute("data-anchor", String(sec));
      list.appendChild(anchor);
    }
    list.appendChild(row(it, maker));
  });
}

function row(it, maker){
  const invKey = `${maker}:${it.number}`;
  const wishKey = invKey;
  const wrap=document.createElement("div"); wrap.className="row";
  const sw=document.createElement("div"); sw.className="swatch"; sw.style.background = it.hex || "#fff";
  const meta=document.createElement("div"); meta.className="meta";
  meta.innerHTML=`<div class="num">${it.number}</div><div class="maker">${maker}</div>`;
  const ctrl=document.createElement("div"); ctrl.className="ctrl";
  const plus=btn("+"); const minus=btn("−"); const heart=btn("♡");
  const num=document.createElement("div"); num.className="count"; num.textContent=String(state.inv[invKey]||0);
  if(state.wish[wishKey]) heart.textContent="❤️";
  plus.addEventListener("click", ()=>{ state.inv[invKey]=(state.inv[invKey]||0)+1; num.textContent=state.inv[invKey]; saveStore(); });
  minus.addEventListener("click", ()=>{ state.inv[invKey]=Math.max(0,(state.inv[invKey]||0)-1); num.textContent=state.inv[invKey]; saveStore(); });
  heart.addEventListener("click", ()=>{ state.wish[wishKey]=!state.wish[wishKey]; heart.textContent=state.wish[wishKey]?"❤️":"♡"; saveStore(); if(state.currentTab==="wishlist") wrap.remove(); });
  ctrl.append(plus,num,minus,heart);
  wrap.append(sw,meta,ctrl);
  if(state.currentTab==="wishlist" && !state.wish[wishKey]) wrap.style.display="none";
  return wrap;
}
function btn(t){ const b=document.createElement("button"); b.className="icon"; b.textContent=t; return b; }

// Sticky関連：ヘッダー+ジャンプバー高さを計測してCSS変数に反映
function updateStickyVars(){
  const header = document.getElementById("appHeader");
  const jump = document.getElementById("jumpbar");
  const top = (header?.offsetHeight||0);
  const offset = top + (jump?.offsetHeight||0) + 8;
  const root = document.documentElement;
  root.style.setProperty("--sticky-top", top+"px");
  root.style.setProperty("--sticky-offset", offset+"px");
}

function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(",");
  const idxN = header.findIndex(h=>/number/i.test(h));
  const idxH = header.findIndex(h=>/^hex$/i.test(h));
  const items=[];
  for(const line of lines){
    const cols=line.split(",");
    const number=(cols[idxN]||"").trim();
    const hex=(cols[idxH]||"").trim();
    if(number) items.push({number,hex});
  }
  return items;
}
function blobDownload(name, text){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));
  a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function bindTools(){
  const file=document.getElementById("fileInput");
  document.getElementById("importBtn").addEventListener("click", ()=>file.click());
  file.addEventListener("change", async e=>{
    const f=e.target.files[0]; if(!f) return;
    const text=await f.text(); const items=parseCSV(text);
    if(!items.length){ alert("CSVにデータがありません"); return; }
    const maker = prompt("どのメーカーに取り込みますか？ (DMC / COSMO / Olympus)", state.currentMaker) || state.currentMaker;
    if(!MAKERS.includes(maker)){ alert("メーカー名が正しくありません"); return; }
    state.data[maker]=items; renderJump(); renderList(); updateStickyVars();
    alert(`${maker} に ${items.length}件 取り込みました`);
  });
  document.getElementById("exportBtn").addEventListener("click", ()=>{
    const maker=state.currentMaker; const items=state.data[maker]||[];
    const json=JSON.stringify({maker,items},null,2);
    blobDownload(`${maker}.json`, json);
  });
}

(async function init(){
  loadStore(); bindTabs(); bindTools();
  await loadJSON(); renderJump(); renderList(); updateStickyVars();
  window.addEventListener("resize", updateStickyVars, {passive:true});
})();
