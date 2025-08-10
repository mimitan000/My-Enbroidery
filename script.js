
console.log("My Embroidery v3.3.9");

const MAKERS=["DMC","COSMO","Olympus"];
const EMB_DATA=window.EMB_DATA||{DMC:[],COSMO:[],Olympus:[]};
const state={currentTab:"inventory",currentMaker:"DMC",data:{}};

document.addEventListener("DOMContentLoaded",()=>{
  MAKERS.forEach(m=> state.data[m]=Array.isArray(EMB_DATA[m])?EMB_DATA[m]:[]);
  bindTabs(); bindMakerSwitch(document);
  renderJump(); renderList();
  updateStickyOffset();
  window.addEventListener("resize", updateStickyOffset, {passive:true});
});

function bindTabs(){
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
      state.currentTab=btn.dataset.tab;
      if(state.currentTab==="inventory"){ renderJump(); renderList(); }
      else { renderWishlist(); }
      window.scrollTo({top:0,behavior:"smooth"});
      updateStickyOffset();
    });
  });
}

function bindMakerSwitch(scope){
  scope.querySelectorAll(".maker-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      btn.parentElement.querySelectorAll(".maker-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const maker=btn.dataset.maker;
      if(state.currentTab==="inventory"){
        state.currentMaker=maker;
        toast(`${maker} に切り替えました`);
        renderJump(); renderList();
      }else{
        renderWishlist(maker);
      }
      window.scrollTo({top:0,behavior:"smooth"});
      updateStickyOffset();
    });
  });
}

function updateStickyOffset(){
  const header=document.querySelector(".app-header");
  const bar=document.getElementById("jumpbar");
  const offset=(header?.offsetHeight||0)+(bar?.offsetHeight||0)+8;
  document.documentElement.style.setProperty("--sticky-offset", offset+"px");
}

function leadingHundreds(s){
  const m=String(s||"").match(/^\d+/); if(!m) return null;
  const n=parseInt(m[0],10); return Math.floor(n/100)*100;
}
function sortItems(arr){
  return arr.slice().sort((a,b)=>{
    const na=parseInt((String(a.number).match(/^\d+/)||["0"])[0],10);
    const nb=parseInt((String(b.number).match(/^\d+/)||["0"])[0],10);
    return na-nb||String(a.number).localeCompare(String(b.number));
  });
}

function renderJump(){
  const bar=document.getElementById("jumpbar"); bar.innerHTML="";
  const items=state.data[state.currentMaker]||[];
  document.getElementById("diag").textContent=`maker=${state.currentMaker} / items=${items.length}`;
  const sections=[...new Set(items.map(it=>leadingHundreds(it.number)).filter(v=>v!==null))].sort((a,b)=>a-b);
  sections.forEach(s=>{
    const b=document.createElement("button");
    b.className="jump"; b.textContent=String(s);
    b.addEventListener("click",()=>{
      const a=document.querySelector(`[data-anchor="${s}"]`);
      if(!a){ window.scrollTo({top:0,behavior:"smooth"}); return; }
      a.scrollIntoView({behavior:"smooth",block:"start"});
    });
    bar.appendChild(b);
  });
  updateStickyOffset();
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
    const sw=tpl.querySelector(".swatch"); sw.style.setProperty("--yarn-color", it.hex||"#ccc");
    tpl.querySelector(".number").textContent=it.number;
    tpl.querySelector(".maker").textContent=maker;
    const qtyEl=tpl.querySelector(".qty");
    const plus=tpl.querySelector(".plus");
    const minus=tpl.querySelector(".minus");
    const heart=tpl.querySelector(".heart");
    let q=parseInt(inv[it.number]||0,10); qtyEl.textContent=q;
    plus.addEventListener("click",()=>{ q+=1; qtyEl.textContent=q; const i=getInventory(maker); i[it.number]=q; setInventory(maker,i); });
    minus.addEventListener("click",()=>{ q=Math.max(0,q-1); qtyEl.textContent=q; const i=getInventory(maker); i[it.number]=q; setInventory(maker,i); });
    const w=wished.has(it.number); heart.textContent=w?"♥️":"♡";
    heart.addEventListener("click",()=>{ const set=new Set(getWishlist(maker)); if(set.has(it.number)) set.delete(it.number); else set.add(it.number); setWishlist(maker,[...set]); heart.textContent=set.has(it.number)?"♥️":"♡"; });
    list.appendChild(tpl);
  });
}

function renderWishlist(filterMaker="ALL"){
  const box=document.getElementById("wishlist-list"); box.innerHTML="";
  const makers=filterMaker==="ALL"?MAKERS:[filterMaker];
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
    });
  });
  const panel=document.getElementById("wishlist");
  panel.querySelectorAll(".maker-btn").forEach(b=>b.classList.remove("active"));
  const t=[...panel.querySelectorAll(".maker-btn")].find(b=>b.dataset.maker===filterMaker); if(t) t.classList.add("active");
}

// storage helpers
const invKey=m=>`inventory:${m}`;
const wishKey=m=>`wishlist:${m}`;
const getInventory=m=>JSON.parse(localStorage.getItem(invKey(m))||"{}");
const setInventory=(m,o)=>localStorage.setItem(invKey(m),JSON.stringify(o));
const getWishlist=m=>JSON.parse(localStorage.getItem(wishKey(m))||"[]");
const setWishlist=(m,a)=>localStorage.setItem(wishKey(m),JSON.stringify(a));

function toast(msg){ const el=document.getElementById("toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),1200); }
