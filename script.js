
console.log("My Embroidery v3.6.1 (CSV importer)");

const MAKERS=["DMC","COSMO","Olympus"];
const EMB_DATA=window.EMB_DATA||{DMC:[],COSMO:[],Olympus:[]};
const state={currentTab:"inventory",currentMaker:"DMC",data:{}};

document.addEventListener("DOMContentLoaded",init);

function init(){
  MAKERS.forEach(m=> state.data[m]=Array.isArray(EMB_DATA[m])?EMB_DATA[m]:[]);
  loadCSVPersisted();

  bindTabs();
  bindGlobalClicks();
  bindImporter();

  renderJump(); renderList();
  updateStickyOffset();
  window.addEventListener("resize", updateStickyOffset, {passive:true});
}

function bindTabs(){
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      const id=btn.dataset.tab;
      document.getElementById(id).classList.add("active");
      state.currentTab=id;
      if(id==="inventory"){ renderJump(); renderList(); updateStickyOffset(); }
      else{ renderWishlist("ALL"); }
      window.scrollTo({top:0,behavior:"smooth"});
    });
  });
}

function bindGlobalClicks(){
  document.addEventListener("click",(ev)=>{
    const btn=ev.target.closest(".maker-btn");
    if(!btn) return;
    const group=btn.closest(".maker-switch");
    const panel=btn.closest(".tab-panel");
    if(group) group.querySelectorAll(".maker-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    if(panel?.id==="inventory"){
      state.currentMaker=btn.dataset.maker||"DMC";
      toast(`${state.currentMaker} に切り替えました`);
      renderJump(); renderList(); updateStickyOffset();
      window.scrollTo({top:0,behavior:"smooth"});
    }else if(panel?.id==="wishlist"){
      renderWishlist(btn.dataset.maker||"ALL");
      window.scrollTo({top:0,behavior:"smooth"});
    }
  });
}

function bindImporter(){
  const modal=document.getElementById("importer");
  const openBtn=document.getElementById("openImporter");
  const closeBtn=document.getElementById("closeImporter");
  const runBtn=document.getElementById("runImport");
  function show(){ modal.classList.add("show"); modal.setAttribute("aria-hidden","false"); }
  function hide(){ modal.classList.remove("show"); modal.setAttribute("aria-hidden","true"); }
  openBtn?.addEventListener("click", show);
  closeBtn?.addEventListener("click", hide);
  modal.querySelector(".modal-backdrop")?.addEventListener("click", hide);
  runBtn?.addEventListener("click", async ()=>{
    const files={ DMC:csvFile("csvDMC"), COSMO:csvFile("csvCOSMO"), Olympus:csvFile("csvOlympus") };
    let imported=[];
    for(const m of MAKERS){
      if(files[m]){
        const text=await files[m].text();
        const items=parseCSV(text);
        if(items.length){
          state.data[m]=items;
          localStorage.setItem(csvKey(m), JSON.stringify(items));
          imported.push(m);
        }
      }
    }
    if(imported.length){
      toast(imported.join(", ")+" を取り込みました");
      if(state.currentTab==="inventory"){ renderJump(); renderList(); updateStickyOffset(); }
      else { renderWishlist("ALL"); }
    }else{
      toast("CSVが選択されていません");
    }
    hide();
  });
  function csvFile(id){ const el=document.getElementById(id); return el && el.files && el.files[0]; }
}

function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim().length>0);
  if(!lines.length) return [];
  let start=0;
  const header=lines[0].split(",").map(h=>h.trim().toLowerCase());
  if(header.includes("number")||header.includes("hex")) start=1;
  const items=[];
  for(let i=start;i<lines.length;i++){
    const cols=lines[i].split(",");
    const number=(cols[0]||"").trim().replace(/^"(.+)"$/,"$1");
    const hex=((cols[1]||"").trim().replace(/^"(.+)"$/,"$1")||"").toUpperCase();
    if(!number) continue;
    const hexNorm=hex? (hex.startsWith("#")?hex:"#"+hex):"";
    if(/\d/.test(number)){ items.push({number:String(number), hex:hexNorm}); }
  }
  return sortItems(items);
}

function csvKey(m){ return `csvdata:${m}`; }
function loadCSVPersisted(){
  MAKERS.forEach(m=>{
    const s=localStorage.getItem(csvKey(m));
    if(s){ try{ const arr=JSON.parse(s); if(Array.isArray(arr)) state.data[m]=arr; }catch(e){} }
  });
}

function updateStickyOffset(){
  const header=document.querySelector(".app-header");
  const bar=document.getElementById("jumpbar");
  const offset=(header?.offsetHeight||0)+(bar?.offsetHeight||0)+8;
  document.documentElement.style.setProperty("--sticky-offset", offset+"px");
}

function leadingHundreds(s){
  const m=String(s||"").match(/^\\d+/); if(!m) return null;
  const n=parseInt(m[0],10); return Math.floor(n/100)*100;
}
function sortItems(arr){
  return arr.slice().sort((a,b)=>{
    const na=parseInt((String(a.number).match(/^\\d+/)||["0"])[0],10);
    const nb=parseInt((String(b.number).match(/^\\d+/)||["0"])[0],10);
    return na-nb||String(a.number).localeCompare(String(b.number));
  });
}

function renderJump(){
  const bar=document.getElementById("jumpbar"); bar.innerHTML="";
  const items=state.data[state.currentMaker]||[];
  const sections=[...new Set(items.map(it=>leadingHundreds(it.number)).filter(v=>v!==null))].sort((a,b)=>a-b);
  sections.forEach(s=>{
    const b=document.createElement("button");
    b.type="button"; b.className="jump"; b.textContent=String(s);
    b.addEventListener("click",()=>{
      const a=document.querySelector(`[data-anchor="${s}"]`);
      if(!a) return;
      a.scrollIntoView({behavior:"smooth",block:"start"});
    });
    bar.appendChild(b);
  });
}

function renderList(){
  const list=document.getElementById("list"); list.innerHTML="";
  const maker=state.currentMaker;
  const inv=getInventory(maker);
  const wished=new Set(getWishlist(maker));
  const items=sortItems(state.data[maker]||[]);
  let currentSection=null;
  items.forEach(it=>{
    const tpl=document.getElementById("card-template").content.cloneNode(true);
    const section=leadingHundreds(it.number);
    const anchor=tpl.querySelector(".anchor");
    if(section!==currentSection){ currentSection=section; anchor.setAttribute("data-anchor",section); anchor.id=`sec-${section}`; }
    tpl.querySelector(".swatch").style.setProperty("--yarn-color", it.hex||"#ccc");
    tpl.querySelector(".number").textContent=it.number;
    tpl.querySelector(".maker").textContent=maker;
    const qtyEl=tpl.querySelector(".qty"); const plus=tpl.querySelector(".plus"); const minus=tpl.querySelector(".minus"); const heart=tpl.querySelector(".heart");
    let q=parseInt(inv[it.number]||0,10); qtyEl.textContent=q;
    plus.addEventListener("click",()=>{ q+=1; qtyEl.textContent=q; const i=getInventory(maker); i[it.number]=q; setInventory(maker,i); });
    minus.addEventListener("click",()=>{ q=Math.max(0,q-1); qtyEl.textContent=q; const i=getInventory(maker); i[it.number]=q; setInventory(maker,i); });
    heart.textContent=wished.has(it.number)?"♥️":"♡";
    heart.addEventListener("click",()=>{ const set=new Set(getWishlist(maker)); if(set.has(it.number)) set.delete(it.number); else set.add(it.number); setWishlist(maker,[...set]); heart.textContent=set.has(it.number)?"♥️":"♡"; });
    list.appendChild(tpl);
  });
}

function renderWishlist(filterMaker="ALL"){
  const box=document.getElementById("wishlist-list"); box.innerHTML="";
  const makers=filterMaker==="ALL"?MAKERS:[filterMaker];
  let count=0;
  makers.forEach(m=>{
    const items=sortItems(state.data[m]||[]);
    const wished=new Set(getWishlist(m));
    const inv=getInventory(m);
    items.filter(it=>wished.has(it.number)).forEach(it=>{
      const tpl=document.getElementById("card-template").content.cloneNode(true);
      tpl.querySelector(".swatch").style.setProperty("--yarn-color", it.hex||"#ccc");
      tpl.querySelector(".number").textContent=it.number;
      tpl.querySelector(".maker").textContent=m;
      const heart=tpl.querySelector(".heart"); heart.textContent="♥️";
      heart.addEventListener("click",()=>{ const set=new Set(getWishlist(m)); set.delete(it.number); setWishlist(m,[...set]); renderWishlist(filterMaker); });
      const qtyEl=tpl.querySelector(".qty"); let q=parseInt(inv[it.number]||0,10); qtyEl.textContent=q;
      tpl.querySelector(".plus").addEventListener("click",()=>{ q+=1; qtyEl.textContent=q; const i=getInventory(m); i[it.number]=q; setInventory(m,i); });
      tpl.querySelector(".minus").addEventListener("click",()=>{ q=Math.max(0,q-1); qtyEl.textContent=q; const i=getInventory(m); i[it.number]=q; setInventory(m,i); });
      box.appendChild(tpl);
      count++;
    });
  });
  const empty=document.getElementById("wl-empty");
  if(empty) empty.hidden = count>0;

  document.getElementById("wishlist").classList.add("active");
  document.getElementById("inventory").classList.remove("active");
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.querySelector('.tab-btn[data-tab="wishlist"]').classList.add("active");
}

/* storage */
const invKey=m=>`inventory:${m}`;
const wishKey=m=>`wishlist:${m}`;
const getInventory=m=>JSON.parse(localStorage.getItem(invKey(m))||"{}");
const setInventory=(m,o)=>localStorage.setItem(invKey(m),JSON.stringify(o));
const getWishlist=m=>JSON.parse(localStorage.getItem(wishKey(m))||"[]");
const setWishlist=(m,a)=>localStorage.setItem(wishKey(m),JSON.stringify(a));

/* toast */
function toast(msg){ const el=document.getElementById("toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),1200); }
