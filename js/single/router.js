/* =========================================================
   single-file build: static shell + hash router.
   Replaces the multi-page layout shell in marketpro.html.
   ========================================================= */

const Router = (() => {
  const ROUTES = {
    "":            { tpl: "tpl-home",         nav: "marketplace",  title: "RTN BACKUP GROUP — Meta AI Buy & Sell Marketplace" },
    "dashboard":   { tpl: "tpl-dashboard",    nav: "dashboard",    title: "Dashboard — RTN BACKUP GROUP" },
    "product":     { tpl: "tpl-product",      nav: "marketplace",  title: "Product Details — RTN BACKUP GROUP" },
    "add-product": { tpl: "tpl-add",          nav: "add-product",  title: "Add Product — RTN BACKUP GROUP" },
    "my-products": { tpl: "tpl-myproducts",   nav: "my-products",  title: "My Listings — RTN BACKUP GROUP" },
    "orders":      { tpl: "tpl-orders",       nav: "orders",       title: "My Orders — RTN BACKUP GROUP" },
    "wallet":      { tpl: "tpl-wallet",       nav: "wallet",       title: "Wallet (DP & Payouts) — RTN BACKUP GROUP" },
    "transactions":{ tpl: "tpl-transactions", nav: "transactions", title: "Transactions — RTN BACKUP GROUP" },
    "profile":     { tpl: "tpl-profile",      nav: "profile",      title: "My Profile — RTN BACKUP GROUP" },
    "seller":      { tpl: "tpl-seller",       nav: "marketplace",  title: "Seller Storefront — RTN BACKUP GROUP" },
    "admin":       { tpl: "tpl-admin",        nav: "admin",        title: "Admin Control Center — RTN BACKUP GROUP" }
  };

  const INIT = {}; // filled by page scripts: INIT["home"] = initHome …

  function queryStr() {
    const h = location.hash.slice(1);
    const i = h.indexOf("?");
    return i >= 0 ? h.slice(i + 1) : "";
  }

  function currentName() {
    const path = (location.hash.slice(1) || "/").split("?")[0];
    const name = path.replace(/^\//, "");
    return ROUTES[name] ? name : "";
  }

  function render() {
    const name = currentName();
    const route = ROUTES[name];
    // remove existing page
    document.querySelector(".main > .page")?.remove();
    // inject template (contains the full <div class="page">…)
    const holder = document.createElement("div");
    holder.innerHTML = document.getElementById(route.tpl).innerHTML;
    const pageDiv = holder.firstElementChild;
    document.querySelector(".main").insertBefore(pageDiv, document.querySelector(".footer"));
    document.title = route.title;
    setActiveNav(route.nav);
    updatePendingBadge();
    (INIT[name] || (() => {}))();
    window.scrollTo(0, 0);
  }

  function rerender() { render(); }
  function go(hash) { location.hash = hash; }

  function setActiveNav(navId) {
    document.querySelectorAll(".nav-link").forEach((l) =>
      l.classList.toggle("active", l.dataset.nav === navId));
    document.querySelectorAll(".mobile-nav-item").forEach((m) => {
      const r = m.dataset.route;
      const match = (r === "" && (navId === "marketplace" || navId === "")) || r === navId;
      m.classList.toggle("active", match);
    });
  }

  function updatePendingBadge() {
    API.getProducts({ status: "pending" }).then((list) => {
      const b = document.getElementById("navPending");
      if (b) { b.hidden = !list.length; b.textContent = list.length; }
      const adminB = document.getElementById("navAdminPending");
      if (adminB) { adminB.hidden = !list.length; adminB.textContent = list.length; }
    });
  }

  // ---------- shell (sidebar + header + footer wiring) ----------
  const NAV = [
    { group: "Marketplace" },
    { nav: "marketplace", label: "Browse Products", href: "#/", icon: "home" },
    { nav: "dashboard", label: "Dashboard", href: "#/dashboard", icon: "dashboard" },
    { nav: "seller", label: "Seller Profiles (সেলার)", href: "#/seller", icon: "user" },
    { group: "Selling & Stock" },
    { nav: "add-product", label: "Add Product (Excel)", href: "#/add-product", icon: "plus" },
    { nav: "my-products", label: "My Listings", href: "#/my-products", icon: "box", badgeId: "navPending" },
    { nav: "orders", label: "My Orders", href: "#/orders", icon: "orders" },
    { group: "Finance & DP" },
    { nav: "wallet", label: "Deposit & Withdraw", href: "#/wallet", icon: "wallet" },
    { nav: "transactions", label: "Transactions", href: "#/transactions", icon: "receipt" },
    { group: "Account" },
    { nav: "profile", label: "My Profile", href: "#/profile", icon: "user" }
  ];

  function bootShell() {
    const navHTML = NAV.map((n) => {
      if (n.group) return `<div class="nav-group-label">${n.group}</div>`;
      return `<a class="nav-link" data-nav="${n.nav}" href="${n.href}">${ICONS[n.icon]}<span>${n.label}</span>${n.badgeId ? `<span class="nav-badge" id="${n.badgeId}" hidden></span>` : ""}</a>`;
    }).join("");

    document.getElementById("sidebar").innerHTML = `
      <a class="sidebar__brand" href="#/">
        <img src="assets/meta-ai-logo.png" alt="Meta AI Logo" class="brand-logo-img meta-ai-orb-spin">
        <div class="brand-text-wrap">
          <div class="brand-name">RTN <span>META AI</span></div>
          <div class="brand-tag">Exchange & Buy Sell</div>
        </div>
      </a>
      <nav class="sidebar__nav">${navHTML}</nav>
      <div class="sidebar__foot"><a class="sidebar-user" href="#/profile" id="sideUser"></a></div>`;

    document.getElementById("header").innerHTML = `
      <button class="hamburger" id="hamburger" aria-label="Menu">${ICONS.menu}</button>
      <form class="search" id="headerSearch">
        ${ICONS.search}
        <input type="search" name="q" placeholder="Search Meta AI accounts, bulk logs, software…" value="">
      </form>
      <div class="header__actions">
        <button class="btn btn-ghost btn-sm" onclick="window.UI && window.UI.openMetaAiBox && window.UI.openMetaAiBox()" title="Open Meta AI Assistant Box" style="color:#38bdf8; border:1px solid rgba(56,189,248,0.3); border-radius:20px; padding:4px 10px; display:inline-flex; align-items:center; gap:6px; background:rgba(0,100,224,0.12);">
          <img src="assets/meta-ai-logo.png" style="width:16px; height:16px; border-radius:50%;" class="meta-ai-orb-spin" alt="">
          <span class="fs12" style="font-weight:700;">AI Box</span>
        </button>
        <a href="#/wallet" class="balance-chip" title="Wallet balance (Deposit / DP)">
          ${ICONS.wallet}<span class="b-text" id="hdrBalance">৳0</span>
        </a>
        <button class="icon-btn" title="Platform Notifications" onclick="UI.toast('All platform services & auto-delivery are operational', 'info')">
          ${ICONS.bell}<span class="dot"></span>
        </button>
        <a href="#/profile" id="hdrAvatar"></a>
      </div>`;

    // Add floating Meta AI assistant button to body if not present
    if (!document.querySelector(".floating-meta-ai-btn")) {
      const aiBtn = document.createElement("button");
      aiBtn.type = "button";
      aiBtn.className = "floating-meta-ai-btn";
      aiBtn.onclick = () => window.UI && window.UI.openMetaAiBox && window.UI.openMetaAiBox();
      aiBtn.title = "Meta AI Assistant Box (স্মার্ট হেল্প বক্স)";
      aiBtn.innerHTML = `
        <img src="assets/meta-ai-logo.png" alt="Meta AI" class="meta-ai-orb-spin" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
        <span>Meta AI হেল্প</span>
      `;
      document.body.appendChild(aiBtn);
    }

    // Add floating whatsapp widget to body if not present
    if (!document.querySelector(".floating-whatsapp")) {
      const wa = document.createElement("a");
      wa.href = "https://wa.me/8801609166109?text=Hello%20Admin,%20I%20need%20help%20with%20RTN%20Meta%20AI%20Marketplace";
      wa.target = "_blank";
      wa.className = "floating-whatsapp";
      wa.title = "Chat on WhatsApp: 01609166109";
      wa.innerHTML = `${ICONS.whatsapp}<span>WhatsApp: 01609166109</span>`;
      document.body.appendChild(wa);
    }

    // Add mobile navigation dock to body if not present
    if (!document.querySelector(".mobile-nav")) {
      const mNav = document.createElement("nav");
      mNav.className = "mobile-nav";
      mNav.id = "mobileNav";
      mNav.innerHTML = `
        <a href="#/" class="mobile-nav-item" data-route="">${ICONS.home}<span>মার্কেট</span></a>
        <a href="#/seller" class="mobile-nav-item" data-route="seller">${ICONS.user}<span>সেলার</span></a>
        <a href="#/add-product" class="mobile-nav-item mobile-nav-add" data-route="add-product"><div class="mobile-add-btn">${ICONS.plus}</div><span>অ্যাড স্টক</span></a>
        <a href="#/wallet" class="mobile-nav-item" data-route="wallet">${ICONS.wallet}<span>ওয়ালেট</span></a>
        <a href="#/my-products" class="mobile-nav-item" data-route="my-products">${ICONS.box}<span>লিস্টিং</span></a>
      `;
      document.body.appendChild(mNav);
    }

    // mobile drawer
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("backdrop");
    document.getElementById("hamburger").onclick = () => { sidebar.classList.add("open"); backdrop.classList.add("show"); };
    backdrop.onclick = () => { sidebar.classList.remove("open"); backdrop.classList.remove("show"); };
    sidebar.addEventListener("click", (e) => {
      if (e.target.closest(".nav-link")) { sidebar.classList.remove("open"); backdrop.classList.remove("show"); }
    });

    // header search
    document.getElementById("headerSearch").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = e.target.querySelector("input").value.trim();
      go(v ? `/?q=${encodeURIComponent(v)}` : "/");
      if (currentName() === "") render();
    });

    // in-page scroll anchors
    document.addEventListener("click", (e) => {
      const s = e.target.closest("[data-scroll]");
      if (!s) return;
      e.preventDefault();
      document.getElementById(s.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
    });

    API.getMe().then((u) => {
      document.getElementById("sideUser").innerHTML =
        UI.avatar(u.name, u.photo) + `<div><div class="name">${UI.esc(u.name)}</div><div class="role">${u.verified ? "✓ Verified " : ""}${u.role}</div></div>`;
      document.getElementById("hdrAvatar").innerHTML = UI.avatar(u.name, u.photo);
    });

    const showBal = () => API.getWallet().then((w) => {
      const hb = document.getElementById("hdrBalance");
      if (hb) hb.textContent = UI.money(w.balance);
    });
    showBal();
    document.addEventListener("wallet:updated", showBal);
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", () => {
    if (!INIT[""]) INIT[""] = INIT["home"];
    bootShell();
    render();
  });

  return { queryStr, rerender, go, INIT };
})();
if (typeof window !== "undefined") window.Router = Router;
