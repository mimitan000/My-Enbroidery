
// v3.7.2 - UI調整 + ジャンプ改良（不足時はプリセット）
const MAKERS = ["DMC","COSMO","Olympus"];
const state = { currentTab:"inventory", currentMaker:"DMC", data:{}, inv:{}, wish:{} };

// ---- Storage helpers
const LS_INV="emb_inv_v1"; const LS_WISH="emb_wish_v1";
function loadStore(){
  try{ state.inv=JSON.parse(localStorage.getItem(LS_INV)||"{}"); }catch{ state.inv={} }
  try{ state.wish=JSON.parse(localStorage.getItem(LS_WISH)||"{}"); }catch{ state.wish={} }
}
function saveStore(){
  localStorage.setItem(LS_INV, JSON.stringify(state.inv));
  localStorage.setItem(LS_WISH, JSON.stringify(state.wish));
}

// ---- Fetch maker JSON
async function loadJSON(){
  for(const m of MAKERS){
    const url = `data/${m}.json?ts=${Date.now()}`;
    try{
      const res = await fetch(url);
      const json = await res.json();
      state.data[m] = Array.isArray(json.items)? json.items : [];
    }catch(e){
      console.warn("JSON load failed for", m, e);
      state.data[m] = [];
    }
  }
}

// ---- UI bind
function bindTabs(){
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      state.currentTab = btn.dataset.tab;
      renderJump(); renderList();
      window.scrollTo({top:0, behavior:"smooth"});
    });
  });
  document.querySelectorAll(".maker-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".maker-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      state.currentMaker = btn.dataset.maker;
      renderJump(); renderList();
      window.scrollTo({top:0, behavior:"smooth"});
    });
  });
}

// ---- Jump helpers
function leadingHundreds(s){
  const m = String(s||"").match(/^\d+/);
  if(!m) return null;
  const n = parseInt(m[0],10);
  return Math.floor(n/100)*100;
}
function numericPart(s){
  const m = String(s||"").match(/^\d+/);
  return m? parseInt(m[0],10) : null;
}
const JUMP_PRESET = {
  "DMC":[0,100,200,300,400,500,600,700,800,900],
  "COSMO":[100,200,300,400,500,600,700,800,900],
  "Olympus":[100,200,300,700,900] // 必要なら後で調整
};
function renderJump(){
  const bar = document.getElementById("jumpbar");
  bar.innerHTML = "";
  const maker = state.currentMaker;
  const items = (state.data[maker]||[]).slice().sort((a,b)=>{
    const na = numericPart(a.number) ?? -1;
    const nb = numericPart(b.number) ?? -1;
    return na-nb || String(a.number).localeCompare(String(b.number));
  });
  let groups = [...new Set(items.map(it=>leadingHundreds(it.number)).filter(v=>v!=null))].sort((a,b)=>a-b);

  // 足りなければプリセットを使う
  if(groups.length <= 1){
    groups = JUMP_PRESET[maker] || [0,100,200,300,400,500];
  }

  groups.forEach(g=>{
    const b = document.createElement("button");
    b.className="jump"; b.textContent = String(g);
    b.addEventListener("click", ()=>{
      const a = document.querySelector(`[data-anchor="${g}"]`);
      if(a) a.scrollIntoView({behavior:"smooth", block:"start"});
    });
    bar.appendChild(b);
  });
}

// ---- List
function sortItems(arr){
  return arr.slice().sort((a,b)=>{
    const na = numericPart(a.number) ?? -1;
    const nb = numericPart(b.number) ?? -1;
    return na-nb || String(a.number).localeCompare(String(b.number));
  });
}
function renderList(){
  const list = document.getElementById("list");
  list.innerHTML = "";
  const maker = state.currentMaker;
  const items = sortItems(state.data[maker]||[]);
  let currentSection = null;
  items.forEach(it=>{
    const sec = leadingHundreds(it.number) ?? 0;
    if(sec!==currentSection){
      currentSection = sec;
      const anchor = document.createElement("div");
      anchor.setAttribute("data-anchor", String(sec));
      anchor.className = "anchor";
      list.appendChild(anchor);
    }
    list.appendChild(row(it, maker));
  });
}
function row(it, maker){
  const invKey = `${maker}:${it.number}`;
  const wishKey = invKey;
  const wrap = document.createElement("div"); wrap.className="row";
  const sw = document.createElement("div"); sw.className="swatch"; sw.style.background = it.hex || "#fff";
  const meta = document.createElement("div"); meta.className="meta";
  meta.innerHTML = `<div class="num">${it.number}</div><div class="maker">${maker}</div>`;
  const ctrl = document.createElement("div"); ctrl.className="ctrl";
  const plus = btn("+"); const minus = btn("−"); const heart = btn("♡");
  const num = document.createElement("div"); num.className="count";
  num.textContent = String(state.inv[invKey]||0);
  if(state.wish[wishKey]) heart.textContent = "❤️";
  plus.addEventListener("click", ()=>{ state.inv[invKey]=(state.inv[invKey]||0)+1; num.textContent=state.inv[invKey]; saveStore(); });
  minus.addEventListener("click", ()=>{ state.inv[invKey]=Math.max(0,(state.inv[invKey]||0)-1); num.textContent=state.inv[invKey]; saveStore(); });
  heart.addEventListener("click", ()=>{ state.wish[wishKey]=!state.wish[wishKey]; heart.textContent=state.wish[wishKey]?"❤️":"♡"; saveStore(); if(state.currentTab==="wishlist" && !state.wish[wishKey]) wrap.remove(); });

  ctrl.append(plus, num, minus, heart);
  wrap.append(sw, meta, ctrl);

  if(state.currentTab==="wishlist" && !state.wish[wishKey]){
    wrap.style.display="none";
  }
  return wrap;
}
function btn(t){ const b=document.createElement("button"); b.className="icon"; b.textContent=t; return b; }

// ---- CSV import / JSON export
function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(",");
  const idxN = header.findIndex(h=>/number/i.test(h));
  const idxH = header.findIndex(h=>/^hex$/i.test(h));
  const items = [];
  for(const line of lines){
    const cols = line.split(",");
    const number = (cols[idxN]||"").trim();
    const hex = (cols[idxH]||"").trim();
    if(number) items.push({number, hex});
  }
  return items;
}
function blobDownload(name, text){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text], {type:"application/json"}));
  a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function bindTools(){
  const file = document.getElementById("fileInput");
  document.getElementById("importBtn").addEventListener("click", ()=> file.click());
  file.addEventListener("change", async (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const text = await f.text();
    const items = parseCSV(text);
    if(!items.length){ alert("CSVにデータがありません"); return; }
    const maker = prompt("どのメーカーに取り込みますか？ (DMC / COSMO / Olympus)", state.currentMaker) || state.currentMaker;
    if(!MAKERS.includes(maker)){ alert("メーカー名が正しくありません"); return; }
    state.data[maker] = items;
    renderJump(); renderList();
    alert(`${maker} に ${items.length}件 取り込みました`);
  });
  document.getElementById("exportBtn").addEventListener("click", ()=>{
    const maker = state.currentMaker;
    const json = JSON.stringify({maker, items: state.data[maker]||[]}, null, 2);
    blobDownload(`${maker}.json`, json);
  });
}

// ---- sticky offset calc
function updateStickyOffset(){
  const header = document.getElementById("header");
  const jb = document.getElementById("jumpbar");
  const offset = (header?.offsetHeight||0) + 40; // 余白加算
  document.documentElement.style.setProperty("--sticky-offset", offset+"px");
}

(async function init(){
  loadStore();
  bindTabs();
  bindTools();
  await loadJSON();
  updateStickyOffset();
  window.addEventListener("resize", updateStickyOffset, {passive:true});
  renderJump();
  renderList();
})();
