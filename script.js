const MAKERS = ["DMC","COSMO","Olympus"];
const DATA_FILES = {
  DMC: "data/dmc.json",
  COSMO: "data/cosmo.json",
  Olympus: "data/olympus.json"
};

const state = {
  currentTab: "inventory",
  currentMaker: "DMC",
  data: {},
};

// Tabs
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    state.currentTab = btn.dataset.tab;
    if (state.currentTab === "inventory") {
      renderJump();
      renderList();
    } else {
      renderWishlist();
    }
  });
});

// Maker switch
function bindMakerSwitch(scope=document) {
  scope.querySelectorAll(".maker-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      btn.parentElement.querySelectorAll(".maker-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const maker = btn.dataset.maker;
      if (state.currentTab === "inventory") {
        state.currentMaker = maker;
        renderJump();
        renderList();
      } else {
        renderWishlist(maker);
      }
    });
  });
}
bindMakerSwitch(document);

// Load data
async function loadAll() {
  for (const m of MAKERS) {
    const res = await fetch(DATA_FILES[m]);
    const json = await res.json();
    state.data[m] = json.items || [];
  }
  renderJump();
  renderList();
}
loadAll();

// Utilities: storage keys
const invKey = (m)=>`inventory:${m}`;
const wishKey = (m)=>`wishlist:${m}`;

function getInventory(m) {
  return JSON.parse(localStorage.getItem(invKey(m)) || "{}");
}
function setInventory(m, obj) {
  localStorage.setItem(invKey(m), JSON.stringify(obj));
}
function getWishlist(m) {
  return JSON.parse(localStorage.getItem(wishKey(m)) || "[]");
}
function setWishlist(m, arr) {
  localStorage.setItem(wishKey(m), JSON.stringify(arr));
}

function leadingHundreds(numStr) {
  const m = (numStr||"").match(/^\d+/);
  if (!m) return "0";
  const n = parseInt(m[0],10);
  return Math.floor(n/100)*100;
}

function renderJump() {
  const bar = document.getElementById("jumpbar");
  bar.innerHTML = "";
  const items = state.data[state.currentMaker] || [];
  const sections = [...new Set(items.map(it=>leadingHundreds(it.number)))].sort((a,b)=>a-b);
  sections.forEach(s=>{
    const btn = document.createElement("button");
    btn.className="jump";
    btn.textContent = s;
    btn.addEventListener("click", ()=>{
      const anchor = document.querySelector(`[data-anchor="${s}"]`);
      if (anchor) anchor.scrollIntoView({behavior:"smooth", block:"start"});
    });
    bar.appendChild(btn);
  });
}

function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";
  const maker = state.currentMaker;
  const items = (state.data[maker]||[]).slice().sort((a,b)=>{
    const na = parseInt((a.number.match(/^\d+/)||["0"])[0],10);
    const nb = parseInt((b.number.match(/^\d+/)||["0"])[0],10);
    return na-nb || String(a.number).localeCompare(String(b.number));
  });
  const inv = getInventory(maker);
  const wishlist = new Set(getWishlist(maker));

  let currentSection = null;

  items.forEach(it=>{
    const section = leadingHundreds(it.number);
    const tpl = document.getElementById("item-template").content.cloneNode(true);
    const root = tpl.querySelector(".floss-item");
    const anchor = tpl.querySelector(".anchor");
    if (section !== currentSection) {
      currentSection = section;
      anchor.setAttribute("data-anchor", section);
      anchor.id = `sec-${section}`;
    }

    const yarn = tpl.querySelector(".yarn");
    yarn.style.setProperty("--yarn", it.hex || "#ccc");

    const numEl = tpl.querySelector(".number");
    numEl.textContent = it.number; // maker name intentionally omitted

    const qtyEl = tpl.querySelector(".qty");
    const minus = tpl.querySelector(".minus");
    const plus = tpl.querySelector(".plus");
    const heart = tpl.querySelector(".heart");

    const qty = parseInt(inv[it.number]||0,10);
    qtyEl.textContent = qty;

    minus.addEventListener("click", ()=>{
      const invNow = getInventory(maker);
      const cur = parseInt(invNow[it.number]||0,10);
      const next = Math.max(0, cur-1);
      invNow[it.number] = next;
      setInventory(maker, invNow);
      qtyEl.textContent = next;
    });
    plus.addEventListener("click", ()=>{
      const invNow = getInventory(maker);
      const cur = parseInt(invNow[it.number]||0,10);
      const next = cur+1;
      invNow[it.number] = next;
      setInventory(maker, invNow);
      qtyEl.textContent = next;
    });

    const wished = wishlist.has(it.number);
    heart.textContent = wished ? "❤" : "♡";
    heart.addEventListener("click", ()=>{
      const arr = new Set(getWishlist(maker));
      if (arr.has(it.number)) { arr.delete(it.number); }
      else { arr.add(it.number); }
      setWishlist(maker, Array.from(arr));
      heart.textContent = arr.has(it.number) ? "❤" : "♡";
    });

    list.appendChild(tpl);
  });
}

function renderWishlist(filterMaker="ALL") {
  const box = document.getElementById("wishlist-list");
  box.innerHTML = "";
  const makers = filterMaker==="ALL" ? MAKERS : [filterMaker];

  makers.forEach(maker=>{
    const items = state.data[maker]||[];
    const wished = new Set(getWishlist(maker));
    const inv = getInventory(maker);

    const filtered = items.filter(it=>wished.has(it.number));
    const sorted = filtered.slice().sort((a,b)=>{
      const na = parseInt((a.number.match(/^\d+/)||["0"])[0],10);
      const nb = parseInt((b.number.match(/^\d+/)||["0"])[0],10);
      return na-nb || String(a.number).localeCompare(String(b.number));
    });

    sorted.forEach(it=>{
      const tpl = document.getElementById("item-template").content.cloneNode(true);
      const yarn = tpl.querySelector(".yarn");
      yarn.style.setProperty("--yarn", it.hex || "#ccc");

      const numEl = tpl.querySelector(".number");
      numEl.textContent = it.number;

      const heart = tpl.querySelector(".heart");
      heart.textContent = "❤";
      heart.addEventListener("click", ()=>{
        const arr = new Set(getWishlist(maker));
        arr.delete(it.number);
        setWishlist(maker, Array.from(arr));
        renderWishlist(filterMaker);
      });

      const qtyEl = tpl.querySelector(".qty");
      const minus = tpl.querySelector(".minus");
      const plus = tpl.querySelector(".plus");

      const qty = parseInt(inv[it.number]||0,10);
      qtyEl.textContent = qty;
      minus.addEventListener("click", ()=>{
        const invNow = getInventory(maker);
        const cur = parseInt(invNow[it.number]||0,10);
        const next = Math.max(0, cur-1);
        invNow[it.number] = next;
        setInventory(maker, invNow);
        qtyEl.textContent = next;
      });
      plus.addEventListener("click", ()=>{
        const invNow = getInventory(maker);
        const cur = parseInt(invNow[it.number]||0,10);
        const next = cur+1;
        invNow[it.number] = next;
        setInventory(maker, invNow);
        qtyEl.textContent = next;
      });

      box.appendChild(tpl);
    });
  });

  // Bind maker filter buttons in wishlist tab (scoped)
  const panel = document.getElementById("wishlist");
  panel.querySelectorAll(".maker-btn").forEach(btn=>btn.classList.remove("active"));
  const target = Array.from(panel.querySelectorAll(".maker-btn")).find(b=>b.dataset.maker===filterMaker);
  if (target) target.classList.add("active");
}
