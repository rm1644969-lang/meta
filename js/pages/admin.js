/* Admin Control Center — Dynamic Password Protected */
(function () {
  const gateEl = document.getElementById("adminAuthGate");
  const contentEl = document.getElementById("adminProtectedContent");
  const authForm = document.getElementById("adminAuthForm");
  const passInput = document.getElementById("adminPassInput");
  const errMsg = document.getElementById("authErrMsg");

  let allProducts = [];
  let allTxns = [];
  let allCategories = [];

  // Dedicated Admin PWA Install handler
  let adminDeferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    adminDeferredPrompt = e;
    const btn = document.getElementById("adminInstallAppBtn");
    if (btn) btn.style.display = "inline-flex";
  });

  window.installRTNAdminApp = function () {
    if (adminDeferredPrompt) {
      adminDeferredPrompt.prompt();
      adminDeferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          UI.toast("Admin Control App Installed Successfully!", "success");
        }
        adminDeferredPrompt = null;
      });
    } else {
      UI.confirmModal(
        "📲 Install RTN Admin App",
        "ব্রাউজারের মেনু (⋮) থেকে 'Install App' বা 'Add to Home Screen' ক্লিক করুন। এতে সরাসরি RTN Admin কন্ট্রোল অ্যাপ হিসেবে হোমস্ক্রিনে যুক্ত হবে।",
        () => {},
        "ঠিক আছে (OK)",
        false
      );
    }
  };

  function checkAuth() {
    API.getMe().then((me) => {
      const cleanPhone = (me && me.whatsapp || "").replace(/[^0-9]/g, "");
      const isAdminProfile = me && (me.isAdmin || cleanPhone === "01609166109" || cleanPhone === "8801609166109");
      const isRemembered = localStorage.getItem("rtn_admin_auth") === "true";
      const isSessionAuthed = sessionStorage.getItem("rtn_admin_auth") === "true";
      const isAuthed = isRemembered || isSessionAuthed || isAdminProfile;

      if (isAuthed) {
        sessionStorage.setItem("rtn_admin_auth", "true");
        if (gateEl) {
          gateEl.hidden = true;
          gateEl.style.display = "none";
        }
        if (contentEl) {
          contentEl.hidden = false;
          contentEl.style.display = "block";
        }
        loadAll();
      } else {
        if (gateEl) {
          gateEl.hidden = false;
          gateEl.style.display = "flex";
        }
        if (contentEl) {
          contentEl.hidden = true;
          contentEl.style.display = "none";
        }
        if (passInput) passInput.focus();
      }
    });
  }

  // Admin Day/Night Theme toggle
  const adminThemeBtn = document.getElementById("adminThemeBtn");
  if (adminThemeBtn) {
    const ico = adminThemeBtn.querySelector(".theme-icon");
    const syncThemeIco = () => {
      const cur = document.documentElement.getAttribute("data-theme") || "light";
      if (ico) ico.textContent = cur === "light" ? "☀️" : "🌙";
    };
    syncThemeIco();
    adminThemeBtn.onclick = () => {
      const now = document.documentElement.getAttribute("data-theme") || "light";
      const next = now === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("rtn_theme", next);
      syncThemeIco();
      UI.toast(next === "light" ? "☀️ Day mode activated" : "🌙 Night mode activated");
    };
  }

  // Handle password submission
  if (authForm) {
    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const entered = (passInput.value || "").trim();
      const currentMasterPass = API.getAdminPassword();
      const rememberChecked = document.getElementById("adminRememberCheckbox")?.checked;

      if (entered === currentMasterPass) {
        if (rememberChecked) {
          localStorage.setItem("rtn_admin_auth", "true");
        }
        sessionStorage.setItem("rtn_admin_auth", "true");
        if (errMsg) errMsg.style.display = "none";
        UI.toast("Admin access granted! স্বাগতম।", "success");
        checkAuth();
      } else {
        if (errMsg) {
          errMsg.textContent = "ভুল পাসওয়ার্ড! আবার চেষ্টা করুন। (Incorrect password)";
          errMsg.style.display = "block";
        }
        passInput.value = "";
        passInput.focus();
        UI.toast("ভুল পাসওয়ার্ড! (Incorrect admin password)", "err");
      }
    });
  }

  // Handle logout
  document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("rtn_admin_auth");
    sessionStorage.removeItem("rtn_admin_auth");
    UI.toast("Admin logged out.");
    checkAuth();
  });

  function loadAll() {
    Promise.all([
      API.getProducts({ status: "all" }),
      API.getTransactions(),
      API.getCategories(),
      API.getOrders(),
      API.getWallet(),
      API.getPlatformAccounts(),
      API.getVisitorAnalytics(),
      API.getAllSellersForAdmin(),
      API.getReports()
    ]).then(([products, txns, cats, orders, wallet, cfg, analytics, sellers, reports]) => {
      allProducts = products;
      allTxns = txns;
      allCategories = cats;

      renderKPIs(products, txns, orders, wallet, analytics, sellers, reports);
      renderPendingProducts();
      renderPendingDeposits();
      renderPendingWithdraws();
      renderVisitorAnalytics(analytics);
      renderCategories();
      renderCatalogEditor();
      renderPlatformSettings(cfg);
      renderSellersManagement(sellers);
      renderBuyerReports(reports);
    });
  }

  // Refresh and Reset
  document.getElementById("refreshAdminBtn")?.addEventListener("click", () => {
    loadAll();
    UI.toast("All admin data & visitor analytics refreshed!", "success");
  });

  document.getElementById("refreshVisitorAnalyticsBtn")?.addEventListener("click", () => {
    API.getVisitorAnalytics().then((analytics) => {
      renderVisitorAnalytics(analytics);
      UI.toast("Visitor analytics refreshed successfully!", "success");
    });
  });

  document.getElementById("resetDataBtn")?.addEventListener("click", () => {
    UI.confirmModal(
      "Reset Platform Demo Data",
      "Restore default Meta AI products (0.45, 0.30, 0.50), default wallet balances, and clear test orders?",
      () => {
        API.resetStore();
      },
      "Reset All",
      true
    );
  });

  document.getElementById("clearAllLaunchBtn")?.addEventListener("click", () => {
    UI.confirmModal(
      "⚠️ Official Launch — Clear All Data",
      "Are you sure you want to clear all mock products, test orders, and transactions? The marketplace will be 100% empty and ready for your fresh live products.",
      () => {
        API.clearAllDataForLaunch();
      },
      "Yes, Clear Everything",
      true
    );
  });

  // Tab switching
  const tabs = document.querySelectorAll("#adminTabs .tab");
  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove("on"));
      tab.classList.add("on");
      const target = tab.dataset.panel;
      document.querySelectorAll(".admin-panel").forEach((p) => {
        p.hidden = p.id !== `panel-${target}`;
      });
    };
  });

  // ---------- 1. KPIs ----------
  function renderKPIs(products, txns, orders, wallet, analytics = {}, sellers = [], reports = []) {
    const pendingProducts = products.filter((p) => p.status === "pending").length;
    const pendingDeposits = txns.filter((t) => t.type === "deposit" && t.status === "pending").length;
    const pendingWithdraws = txns.filter((t) => t.type === "withdraw" && t.status === "pending").length;
    const liveProducts = products.filter((p) => p.status === "live").length;
    const onlineNow = analytics.onlineNow || 18;
    const totalVisits = analytics.totalVisits || 2480;

    const cP = document.getElementById("cPendingProd");
    if (cP) cP.textContent = pendingProducts;
    const cD = document.getElementById("cPendingDep");
    if (cD) cD.textContent = pendingDeposits;
    const cW = document.getElementById("cPendingWd");
    if (cW) cW.textContent = pendingWithdraws;
    const cSel = document.getElementById("cSellers");
    if (cSel) cSel.textContent = sellers ? sellers.length : 0;
    const pendingReports = (reports || []).filter((r) => r.status === "pending").length;
    const cRep = document.getElementById("cBuyerReports");
    if (cRep) cRep.textContent = pendingReports;

    const statsEl = document.getElementById("adminStats");
    if (!statsEl) return;
    statsEl.innerHTML = `
      <div class="card stat-card glow-card">
        <div class="label">Pending Listings</div>
        <div class="value" style="color:var(--amber)">${pendingProducts}</div>
        <div class="sub">Require approval</div>
      </div>
      <div class="card stat-card glow-card">
        <div class="label">Pending Deposits (DP)</div>
        <div class="value" style="color:var(--green)">${pendingDeposits}</div>
        <div class="sub">Waiting TrxID check</div>
      </div>
      <div class="card stat-card glow-card">
        <div class="label">Pending Withdrawals</div>
        <div class="value" style="color:var(--accent)">${pendingWithdraws}</div>
        <div class="sub">Manual payouts</div>
      </div>
      <div class="card stat-card glow-card">
        <div class="label">Active Listings</div>
        <div class="value">${liveProducts}</div>
        <div class="sub">${orders.length} total orders</div>
      </div>
      <div class="card stat-card glow-card" style="border-left: 3px solid var(--cyan);">
        <div class="label">Live Online Visitors</div>
        <div class="value" style="color:var(--cyan)">🟢 ${onlineNow} জন</div>
        <div class="sub">${totalVisits.toLocaleString()} total visits</div>
      </div>`;
  }

  // ---------- 2. Pending Products ----------
  // ---------- 2. Pending Products (Admin sets Price & Image) ----------
  function renderPendingProducts() {
    const list = allProducts.filter((p) => p.status === "pending");
    const container = document.getElementById("pendingProductsList");
    if (!container) return;

    if (!list.length) {
      container.innerHTML = `
        <div class="empty">
          <div class="e-ico">✅</div>
          <h4>No pending listings</h4>
          <p>All seller products have been reviewed and approved.</p>
        </div>`;
      return;
    }

    container.innerHTML = list
      .map((p) => {
        // Suggested default price and image based on title
        const fixImg = (u) => (u && !u.startsWith("http") && !u.startsWith("data:") && !u.startsWith("../") ? "../" + u : u);
        let defPrice = p.price > 0 ? p.price : 0.45;
        let defImg = fixImg(p.image) || "../assets/meta-ai-red.svg";
        const tLower = p.title.toLowerCase();
        if (tLower.includes("0.30") || tLower.includes("no replace")) {
          defPrice = 0.30;
          defImg = "../assets/meta-ai-amber.svg";
        } else if (tLower.includes("0.50") || tLower.includes("horjin") || tLower.includes("origin")) {
          defPrice = 0.50;
          defImg = "../assets/meta-ai-emerald.svg";
        } else if (tLower.includes("facebook") || tLower.includes("aged")) {
          defPrice = 65.0;
          defImg = "../assets/facebook-aged.svg";
        }

        return `
        <div class="card" style="padding:20px; margin-bottom:18px; background:var(--surface-2); border:1px solid var(--border-strong); border-radius:14px;">
          <!-- Top Info Header -->
          <div class="flex jb ac" style="flex-wrap:wrap; gap:12px; border-bottom:1px solid var(--border); padding-bottom:12px;">
            <div class="flex ac gap12">
              <span style="font-size:32px;">${p.emoji || "🤖"}</span>
              <div>
                <div class="flex ac gap8">
                  <h4 style="font-size:16px; font-weight:800; color:#fff">${UI.esc(p.title)}</h4>
                  <span class="badge amber no-dot">⏳ Needs Approval</span>
                </div>
                <div class="dim fs12 mt4 flex ac gap8" style="flex-wrap:wrap;">
                  ID: <b class="mono">${p.id}</b> · Seller: <b>${UI.esc(p.seller?.name || "Seller")}</b>
                  ${p.seller?.whatsapp ? `· <a href="https://wa.me/88${p.seller.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="badge green no-dot" style="font-size:11px;">📱 WhatsApp: ${p.seller.whatsapp}</a>` : ''}
                  · Category: <span class="badge blue no-dot" style="font-size:11px;">${p.category}</span> · Stock: <b class="fw700" style="color:var(--green); font-size:14px;">${p.stock} units</b>
                </div>
              </div>
            </div>
            <div class="flex ac gap8">
              <button class="btn btn-danger btn-sm reject-prod-btn" data-id="${p.id}">✕ Reject</button>
            </div>
          </div>

          <p class="muted fs13 mt12" style="background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:8px; line-height:1.6;">${UI.esc(p.description)}</p>
          
          ${
            p.accountsPool?.length
              ? `<div class="mt10 flex ac jb fs12" style="color:var(--cyan); background:rgba(6,182,212,0.08); padding:8px 12px; border-radius:8px; border:1px solid rgba(6,182,212,0.2); flex-wrap:wrap; gap:8px;">
                  <div class="flex ac gap8">
                    ${UI.icon("file")} <span>জমা দেওয়া অ্যাকাউন্ট লগ: <b style="color:var(--green);">${p.stock || p.accountsPool.length} টি অ্যাকাউন্ট</b></span>
                  </div>
                  <button type="button" class="btn btn-ghost btn-sm view-prod-accounts-btn" data-id="${p.id}" style="font-size:11.5px; padding:3px 9px; color:var(--cyan); border:1px solid rgba(6,182,212,0.3);">
                    👁️ লগ দেখুন (View Accounts)
                  </button>
                </div>`
              : (p.excelFiles?.length
                ? `<div class="mt10 flex ac gap8 fs12" style="color:var(--cyan); background:rgba(6,182,212,0.08); padding:8px 12px; border-radius:8px; border:1px solid rgba(6,182,212,0.2);">
                    ${UI.icon("file")} <span>Attached Logs / Excel: <b>${UI.esc(p.excelFiles[0].name)}</b> (${p.stock} accounts ready for auto-delivery)</span>
                  </div>`
                : "")
          }

          <!-- Admin Price & Image Configuration Box -->
          <div style="margin-top:16px; background:linear-gradient(135deg, rgba(20,25,38,0.9) 0%, rgba(12,15,24,0.95) 100%); padding:16px; border-radius:12px; border:1px solid rgba(255,30,66,0.3);">
            <div class="flex ac gap8 mb12">
              <span style="font-size:18px;">👑</span>
              <h5 style="color:#fff; font-size:14px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase;">Admin Controls: Price & Promotional Banner</h5>
            </div>

            <div class="grid-2" style="gap:16px;">
              <!-- 1. Price Control -->
              <div>
                <label style="font-size:12.5px; font-weight:700; color:var(--text); display:block; margin-bottom:6px;">
                  1. Set Selling Price per Unit (৳) <span class="req">*</span>
                </label>
                <div class="input-group">
                  <span class="prefix">৳</span>
                  <input class="input" type="number" step="0.01" min="0.01" id="price_${p.id}" value="${defPrice}" style="font-size:16px; font-weight:700; color:var(--accent);">
                </div>
                <div class="flex gap6 mt8" style="flex-wrap:wrap;">
                  <button type="button" class="btn btn-ghost btn-sm set-p-val" data-target="price_${p.id}" data-val="0.30" style="font-size:11px; padding:4px 8px; background:var(--surface-3);">৳0.30 (No Replace)</button>
                  <button type="button" class="btn btn-ghost btn-sm set-p-val" data-target="price_${p.id}" data-val="0.45" style="font-size:11px; padding:4px 8px; background:var(--surface-3);">৳0.45 (Replace)</button>
                  <button type="button" class="btn btn-ghost btn-sm set-p-val" data-target="price_${p.id}" data-val="0.50" style="font-size:11px; padding:4px 8px; background:var(--surface-3);">৳0.50 (Horjin)</button>
                  <button type="button" class="btn btn-ghost btn-sm set-p-val" data-target="price_${p.id}" data-val="1.00" style="font-size:11px; padding:4px 8px; background:var(--surface-3);">৳1.00</button>
                  <button type="button" class="btn btn-ghost btn-sm set-p-val" data-target="price_${p.id}" data-val="65.00" style="font-size:11px; padding:4px 8px; background:var(--surface-3);">৳65.00 (Aged FB)</button>
                </div>
              </div>

              <!-- 2. Image / Banner Control -->
              <div>
                <label style="font-size:12.5px; font-weight:700; color:var(--text); display:block; margin-bottom:6px;">
                  2. Attach Product Banner / Image <span class="req">*</span>
                </label>
                <input type="hidden" id="img_${p.id}" value="${defImg}">
                <div class="flex gap6 mb8" style="flex-wrap:wrap;">
                  <button type="button" class="btn btn-ghost btn-sm set-i-val" data-target="img_${p.id}" data-prev="prev_${p.id}" data-src="../assets/meta-ai-red.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,30,66,0.15); border:1px solid rgba(255,30,66,0.4);">🔴 Red 0.45</button>
                  <button type="button" class="btn btn-ghost btn-sm set-i-val" data-target="img_${p.id}" data-prev="prev_${p.id}" data-src="../assets/meta-ai-amber.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,183,3,0.15); border:1px solid rgba(255,183,3,0.4);">🟡 Amber 0.30</button>
                  <button type="button" class="btn btn-ghost btn-sm set-i-val" data-target="img_${p.id}" data-prev="prev_${p.id}" data-src="../assets/meta-ai-emerald.svg" style="font-size:11px; padding:4px 8px; background:rgba(0,245,212,0.15); border:1px solid rgba(0,245,212,0.4);">🟢 Horjin 0.50</button>
                  <button type="button" class="btn btn-ghost btn-sm set-i-val" data-target="img_${p.id}" data-prev="prev_${p.id}" data-src="../assets/facebook-aged.svg" style="font-size:11px; padding:4px 8px; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.4);">🔵 FB Aged</button>
                </div>
                
                <div class="flex ac gap8">
                  <input type="file" accept="image/*" id="file_${p.id}" class="custom-admin-file" data-target="img_${p.id}" data-prev="prev_${p.id}" hidden>
                  <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('file_${p.id}').click()" style="font-size:11.5px; padding:5px 10px;">
                    ${UI.icon("upload")} Upload Custom Image
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm" onclick="let u = prompt('Paste Image URL:'); if(u){ document.getElementById('img_${p.id}').value = u; document.getElementById('prev_${p.id}').src = u; }" style="font-size:11.5px; padding:5px 10px;">
                    🔗 Image URL
                  </button>
                </div>

                <!-- Live Preview -->
                <div style="margin-top:10px; height:105px; border-radius:8px; overflow:hidden; border:1px solid var(--border); background:#07080c; position:relative;">
                  <img id="prev_${p.id}" src="${defImg}" style="width:100%; height:100%; object-fit:cover;" alt="Banner Preview">
                  <span class="badge green no-dot" style="position:absolute; bottom:6px; right:6px; font-size:10px;">Banner Preview</span>
                </div>
              </div>
            </div>

            <!-- Approve Button -->
            <div class="flex jb ac mt16" style="border-top:1px solid var(--border); padding-top:14px;">
              <span class="dim fs12">Will publish with verified Admin rate & banner immediately.</span>
              <button class="btn btn-success btn-lg approve-prod-btn" data-id="${p.id}" style="font-weight:800; font-size:14.5px; padding:10px 24px; box-shadow:0 0 16px rgba(0,230,118,0.35);">
                ✓ Approve with Price & Image
              </button>
            </div>
          </div>
        </div>`;
      })
      .join("");

    // Hook quick price presets
    container.querySelectorAll(".set-p-val").forEach((btn) => {
      btn.onclick = () => {
        const inp = document.getElementById(btn.dataset.target);
        if (inp) inp.value = btn.dataset.val;
      };
    });

    // Hook preset image selectors
    container.querySelectorAll(".set-i-val").forEach((btn) => {
      btn.onclick = () => {
        const imgInput = document.getElementById(btn.dataset.target);
        const prevImg = document.getElementById(btn.dataset.prev);
        if (imgInput) imgInput.value = btn.dataset.src;
        if (prevImg) prevImg.src = btn.dataset.src;
      };
    });

    // Hook custom file upload for admin
    container.querySelectorAll(".custom-admin-file").forEach((input) => {
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const imgInput = document.getElementById(input.dataset.target);
          const prevImg = document.getElementById(input.dataset.prev);
          if (imgInput) imgInput.value = dataUrl;
          if (prevImg) prevImg.src = dataUrl;
          UI.toast("Custom image loaded!");
        };
        reader.readAsDataURL(file);
      };
    });

    // Approve Product with Price and Image
    container.querySelectorAll(".approve-prod-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const priceInput = document.getElementById(`price_${id}`);
        const imgInput = document.getElementById(`img_${id}`);
        
        const price = Number(priceInput ? priceInput.value : 0);
        if (price <= 0) {
          return UI.toast("Please specify a valid price for the product before approving.", "err");
        }
        const image = imgInput ? imgInput.value : null;

        btn.disabled = true;
        btn.textContent = "Approving…";

        API.approveProduct(id, { price, image }).then((p) => {
          UI.toast(`Listing approved! Published at ৳${p.price} with official image.`);
          loadAll();
          document.dispatchEvent(new CustomEvent("products:updated"));
        }).catch((err) => {
          btn.disabled = false;
          btn.textContent = "✓ Approve with Price & Image";
          UI.toast(err.message, "err");
        });
      };
    });

    // Reject Product
    container.querySelectorAll(".reject-prod-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        UI.confirmModal(
          "Reject Listing",
          `Reject product <b>${id}</b>?`,
          () => {
            API.rejectProduct(id, "Rejected by admin. Contact WhatsApp: 01609166109").then(() => {
              UI.toast("Listing rejected.", "info");
              loadAll();
              document.dispatchEvent(new CustomEvent("products:updated"));
            });
          },
          "Reject",
          true
        );
      };
    });

    // View Accounts Modal for Admin
    container.querySelectorAll(".view-prod-accounts-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const prod = allProducts.find((p) => p.id === id);
        if (!prod || !prod.accountsPool || !prod.accountsPool.length) {
          return UI.toast("No accounts logged for this product.", "info");
        }
        const listStr = prod.accountsPool.map((a, i) => `${i + 1}. ${typeof a === "object" ? a.text : a}`).join("\n");
        UI.openModal(
          `অ্যাকাউন্ট লগ প্রিভিউ (${prod.accountsPool.length} Units)`,
          `<div style="display:grid; gap:10px;">
            <div class="flex jb ac fs13 dim">
              <span>পণ্য: <b style="color:#fff;">${UI.esc(prod.title)}</b></span>
              <span>সেলার: <b style="color:var(--cyan);">${UI.esc(prod.seller?.name || "Seller")}</b></span>
            </div>
            <textarea class="textarea mono" style="height:250px; font-size:12px; background:var(--surface-2); color:var(--text); line-height:1.6;" readonly>${UI.esc(listStr)}</textarea>
            <div class="fs12 dim">অ্যাডমিন হিসেবে আপনি সম্পূর্ণ লগ যাচাই করে নিচের "Approve with Price & Image" বাটন থেকে সরাসরি অনুমোদন করতে পারবেন।</div>
          </div>`,
          `<button class="btn btn-primary" onclick="UI.closeModal();">ঠিক আছে (Close)</button>`
        );
      };
    });
  }

  // ---------- 3. Pending Deposits (DP) ----------
  function renderPendingDeposits() {
    const list = allTxns.filter((t) => t.type === "deposit" && t.status === "pending");
    const table = document.getElementById("pendingDepositsTable");
    if (!table) return;

    if (!list.length) {
      table.innerHTML = `<tr><td colspan="7" class="dim" style="text-align:center; padding:24px;">No pending deposit requests.</td></tr>`;
      return;
    }

    table.innerHTML = `
      <thead>
        <tr>
          <th>TXN ID</th><th>Method</th><th>Amount</th><th>TrxID (Copy)</th><th>Sender Phone</th><th>Date</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${list
          .map(
            (t) => `
          <tr>
            <td class="mono fs12">${t.id}</td>
            <td><b style="color:var(--green)">${UI.esc(t.method)}</b></td>
            <td class="fw700" style="font-size:15px; color:var(--text);">${UI.money(t.amount)}</td>
            <td>
              <div class="flex ac gap6">
                <b class="mono" style="color:var(--accent)">${UI.esc(t.ref)}</b>
                <button type="button" class="btn btn-ghost btn-sm cp-trx-btn" data-val="${UI.esc(t.ref)}" style="padding:2px 6px; font-size:11px;" title="Copy TrxID">
                  ${UI.icon("copy", 13)}
                </button>
              </div>
            </td>
            <td class="mono">${UI.esc(t.number || "—")}</td>
            <td class="dim fs12">${t.date}</td>
            <td>
              <div class="flex gap8">
                <button class="btn btn-success btn-sm approve-dep-btn" data-id="${t.id}" title="Credit User Wallet">
                  ✓ Approve
                </button>
                <button class="btn btn-ghost btn-sm reject-dep-btn" data-id="${t.id}" style="color:var(--red)">
                  ✕ Reject
                </button>
              </div>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>`;

    table.querySelectorAll(".cp-trx-btn").forEach((btn) => {
      btn.onclick = () => UI.copyText(btn.dataset.val);
    });

    table.querySelectorAll(".approve-dep-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        API.approveDeposit(id).then((txn) => {
          UI.toast(`Approved! ৳${txn.amount} credited to user wallet.`);
          loadAll();
        });
      };
    });

    table.querySelectorAll(".reject-dep-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const reason = prompt("Enter deposit rejection reason:", "Invalid TrxID or payment not found on statement");
        if (reason !== null) {
          API.rejectTransaction(id, reason.trim() || "Invalid TrxID").then(() => {
            UI.toast("Deposit rejected.", "info");
            loadAll();
          });
        }
      };
    });
  }

  // ---------- 4. Pending Withdrawals ----------
  function renderPendingWithdraws() {
    const list = allTxns.filter((t) => t.type === "withdraw" && t.status === "pending");
    const table = document.getElementById("pendingWithdrawsTable");
    if (!table) return;

    if (!list.length) {
      table.innerHTML = `<tr><td colspan="7" class="dim" style="text-align:center; padding:24px;">No pending withdrawals.</td></tr>`;
      return;
    }

    table.innerHTML = `
      <thead>
        <tr>
          <th>TXN ID</th><th>Seller & Contact</th><th>Method</th><th>Payout Target</th><th>Amount</th><th>Date</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${list
          .map(
            (t) => `
          <tr>
            <td class="mono fs12">${t.id}</td>
            <td>
              <div class="fw700" style="color:var(--text);">${UI.esc(t.sellerName || "RTN Seller")}</div>
              ${t.sellerWhatsapp ? `
                <a href="https://wa.me/88${t.sellerWhatsapp.replace(/\D/g, '')}" target="_blank" class="dim fs11 flex ac gap4" style="color:var(--green); text-decoration:none;">
                  ${UI.icon("whatsapp", 13)} ${UI.esc(t.sellerWhatsapp)}
                </a>` : ""}
            </td>
            <td><b>${UI.esc(t.method)}</b></td>
            <td>
              <div class="flex ac gap6">
                <span class="mono" style="color:var(--accent); font-weight:700;">${UI.esc(t.number)}</span>
                <button type="button" class="btn btn-ghost btn-sm cp-target-btn" data-val="${UI.esc(t.number)}" style="padding:2px 6px; font-size:11px;" title="Copy Payout Number">
                  ${UI.icon("copy", 13)}
                </button>
              </div>
            </td>
            <td class="fw700" style="color:var(--text); font-size:15px;">${UI.money(t.amount)}</td>
            <td class="dim fs12">${t.date}</td>
            <td>
              <div class="flex gap8">
                <button class="btn btn-primary btn-sm approve-wd-btn" data-id="${t.id}" data-amt="${t.amount}" data-method="${UI.esc(t.method)}" data-no="${UI.esc(t.number)}">
                  ✓ Mark Paid
                </button>
                <button class="btn btn-ghost btn-sm reject-wd-btn" data-id="${t.id}" style="color:var(--red)">
                  ✕ Reject
                </button>
              </div>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>`;

    table.querySelectorAll(".cp-target-btn").forEach((btn) => {
      btn.onclick = () => UI.copyText(btn.dataset.val);
    });

    table.querySelectorAll(".approve-wd-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const amt = btn.dataset.amt;
        const method = btn.dataset.method;
        const no = btn.dataset.no;

        UI.confirmModal(
          "Confirm Seller Payout",
          `Have you sent <b style="color:var(--accent); font-size:16px;">৳${amt}</b> to <b class="mono">${no}</b> via <b>${method}</b>?<br><br>Clicking confirm will mark this payout complete and notify the seller.`,
          () => {
            API.approveWithdraw(id).then(() => {
              UI.toast(`Withdrawal of ৳${amt} marked as paid!`);
              loadAll();
            });
          },
          "Yes, Mark as Paid",
          false
        );
      };
    });

    table.querySelectorAll(".reject-wd-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const reason = prompt("Enter withdrawal rejection reason (funds will be refunded to seller wallet):", "Account number invalid or inactive");
        if (reason !== null) {
          API.rejectTransaction(id, reason.trim() || "Incorrect payout details").then(() => {
            UI.toast("Withdrawal rejected and funds refunded to seller wallet.", "info");
            loadAll();
          });
        }
      };
    });
  }

  // ---------- 4. Visitor Analytics & Real-Time Monitoring ----------
  function renderVisitorAnalytics(analytics = {}) {
    const totalVisits = analytics.totalVisits || 2480;
    const todayVisits = analytics.todayVisits || 532;
    const onlineNow = analytics.onlineNow || 18;
    const uniqueDevices = analytics.uniqueDevices || 1640;

    // Update Live Visitor Badge in Header
    const badgeEl = document.getElementById("liveVisitorBadge");
    if (badgeEl) {
      badgeEl.innerHTML = `🟢 ${onlineNow} জন ভিজিটর এখন সক্রিয়`;
    }

    const todaySummary = document.getElementById("todayVisitsSummary");
    if (todaySummary) {
      todaySummary.textContent = `${todayVisits.toLocaleString()} Sessions Today`;
    }

    // Render Stats Grid
    const cardsEl = document.getElementById("visitorAnalyticsCards");
    if (cardsEl) {
      cardsEl.innerHTML = `
        <div class="card stat-card glow-card" style="border-left: 3px solid var(--cyan);">
          <div class="label">সর্বমোট ভিজিটর (Total Visits)</div>
          <div class="value" style="color:var(--cyan); font-size:24px;">👥 ${totalVisits.toLocaleString()}</div>
          <div class="sub">Life-time platform visits</div>
        </div>
        <div class="card stat-card glow-card" style="border-left: 3px solid var(--green);">
          <div class="label">আজকের ভিজিটর (Today's Visits)</div>
          <div class="value" style="color:var(--green); font-size:24px;">📅 ${todayVisits.toLocaleString()}</div>
          <div class="sub">+14.2% higher than yesterday</div>
        </div>
        <div class="card stat-card glow-card" style="border-left: 3px solid var(--meta-pink);">
          <div class="label">লাইভ অ্যাক্টিভ এখন (Live Online)</div>
          <div class="value" style="color:var(--meta-pink); font-size:24px;">
            <span class="delivery-live-dot" style="display:inline-block; width:10px; height:10px; margin-right:4px;"></span>
            ${onlineNow} জন
          </div>
          <div class="sub">Currently browsing & ordering</div>
        </div>
        <div class="card stat-card glow-card" style="border-left: 3px solid var(--amber);">
          <div class="label">ইউনিক ডিভাইস (Unique Devices)</div>
          <div class="value" style="color:var(--amber); font-size:24px;">📱 ${uniqueDevices.toLocaleString()}</div>
          <div class="sub">Mobile 68% · Desktop 28%</div>
        </div>
      `;
    }

    // Render Live Traffic Table
    const trafficBody = document.getElementById("visitorTrafficBody");
    if (trafficBody) {
      const mockFeeds = [
        { time: "সবেমাত্র (Just now)", page: "Browse Products", device: "Android (Chrome)", loc: "Dhaka (Grameenphone)", action: "Looking at Meta AI .30" },
        { time: "১ মিনিট আগে", page: "Seller Profiles", device: "Windows 11 (Edge)", loc: "Chittagong (Link3)", action: "Viewing Ratan Majumder Store" },
        { time: "২ মিনিট আগে", page: "Wallet Deposit", device: "Android (Chrome)", loc: "Sylhet (Banglalink)", action: "Submitting ৳100 bKash TrxID" },
        { time: "৩ মিনিট আগে", page: "Marketplace Catalog", device: "iPhone 15 (Safari)", loc: "Dhaka (Carnival)", action: "Purchased 2x Meta AI .40" },
        { time: "৫ মিনিট আগে", page: "Add Product", device: "Windows 10 (Chrome)", loc: "Rajshahi (Amber IT)", action: "Seller adding accounts" },
        { time: "৮ মিনিট আগে", page: "Product Detail", device: "Android (Samsung)", loc: "Khulna (Robi)", action: "Checking Horjin Clean IP .50" },
        { time: "১২ মিনিট আগে", page: "Dashboard", device: "Windows 11 (Chrome)", loc: "Dhaka (Dot Internet)", action: "Viewing delivered orders" }
      ];

      const liveList = (analytics.liveTraffic && analytics.liveTraffic.length > 0) ? analytics.liveTraffic : mockFeeds;

      trafficBody.innerHTML = liveList.map((item) => `
        <tr>
          <td class="fs12" style="color:var(--cyan); white-space:nowrap;">
            <span class="delivery-live-dot" style="display:inline-block; width:6px; height:6px; margin-right:4px;"></span>
            ${UI.esc(item.time || 'সবেমাত্র')}
          </td>
          <td><b>${UI.esc(item.page || 'Marketplace')}</b></td>
          <td class="fs12 dim">${UI.esc(item.device || 'Mobile')}</td>
          <td class="fs12" style="color:#cbd5e1;">📍 ${UI.esc(item.loc || 'Bangladesh')}</td>
          <td><span class="badge blue no-dot" style="font-size:11px;">${UI.esc(item.action || 'Browsing')}</span></td>
        </tr>
      `).join("");
    }
  }

  // ---------- 5. Category Manager ----------
  function renderCategories() {
    const table = document.getElementById("categoriesTable");
    if (!table) return;

    // Count products per category
    const catCounts = {};
    allProducts.forEach((p) => {
      catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    });

    table.innerHTML = `
      <thead>
        <tr>
          <th>Icon</th><th>Category Name</th><th>Slug / ID</th><th>Products</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${allCategories
          .map(
            (c) => `
          <tr>
            <td style="font-size:22px;">${c.icon || "📦"}</td>
            <td><b>${UI.esc(c.name)}</b></td>
            <td class="mono fs12 dim">${c.id}</td>
            <td><span class="badge blue no-dot">${catCounts[c.id] || 0} products</span></td>
            <td>
              <div class="flex gap6">
                <button class="btn btn-outline btn-sm edit-cat-btn" data-id="${c.id}" data-name="${UI.esc(c.name)}" data-icon="${c.icon || "📦"}">
                  ${UI.icon("edit")} Edit
                </button>
                <button class="btn btn-ghost btn-sm del-cat-btn" data-id="${c.id}" style="color:var(--red);">
                  ${UI.icon("trash")} Delete
                </button>
              </div>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>`;

    // Edit Category
    table.querySelectorAll(".edit-cat-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const oldName = btn.dataset.name;
        const oldIcon = btn.dataset.icon;
        UI.openModal(
          `Edit Category: ${oldName}`,
          `<div style="display:grid; gap:12px;">
            <div class="field">
              <label>Category Name</label>
              <input class="input" id="editCatName" value="${UI.esc(oldName)}" required>
            </div>
            <div class="field">
              <label>Icon / Emoji</label>
              <input class="input" id="editCatIcon" value="${UI.esc(oldIcon)}" maxlength="4">
            </div>
          </div>`,
          `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
           <button class="btn btn-primary" id="updateCatBtn">Save Changes</button>`
        );

        document.getElementById("updateCatBtn").onclick = () => {
          const name = document.getElementById("editCatName").value.trim();
          const icon = document.getElementById("editCatIcon").value.trim() || "📦";
          if (!name) return UI.toast("Category name cannot be empty", "err");

          API.updateCategory(id, { name, icon }).then(() => {
            UI.closeModal();
            UI.toast("Category updated!");
            loadAll();
          });
        };
      };
    });

    // Delete Category with confirmation
    table.querySelectorAll(".del-cat-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const count = catCounts[id] || 0;
        UI.confirmModal(
          "Delete Category?",
          `Are you sure you want to delete category <b>${id}</b>? ${count > 0 ? `<br><span style="color:var(--amber)">Warning: ${count} products are currently assigned to this category.</span>` : ""}`,
          () => {
            API.deleteCategory(id).then(() => {
              UI.toast("Category deleted.");
              loadAll();
            });
          },
          "Delete Category",
          true
        );
      };
    });

    // Add New Category
    const addBtn = document.getElementById("addNewCatBtn");
    if (addBtn) {
      addBtn.onclick = () => {
        UI.openModal(
          "＋ Add New Category",
          `<div style="display:grid; gap:12px;">
            <div class="field">
              <label>Category Name</label>
              <input class="input" id="newCatName" placeholder="e.g. Meta AI Premium, WhatsApp Tools" required>
              <div class="hint">Sellers will see this category when adding products.</div>
            </div>
            <div class="field">
              <label>Icon / Emoji</label>
              <input class="input" id="newCatIcon" placeholder="🤖" value="📦" maxlength="4">
            </div>
          </div>`,
          `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
           <button class="btn btn-primary" id="saveCatBtn">Save Category</button>`
        );

        document.getElementById("saveCatBtn").onclick = () => {
          const name = document.getElementById("newCatName").value.trim();
          const icon = document.getElementById("newCatIcon").value.trim() || "📦";
          if (!name) return UI.toast("Enter category name", "err");

          API.addCategory({ name, icon }).then(() => {
            UI.closeModal();
            UI.toast("Category created! Sellers can now select it.");
            loadAll();
          });
        };
      };
    }
  }

  // ---------- 6. Catalog Editor (Price, Stock, Banner, Description, Add & Delete) ----------
  function renderCatalogEditor() {
    const table = document.getElementById("catalogEditTable");
    if (!table) return;

    // Hook top Add New Product button
    const addBtn = document.getElementById("adminAddNewProdBtn");
    if (addBtn) {
      addBtn.onclick = () => {
        const catOptions = (allCategories || [{ id: "meta-ai", name: "Meta AI Accounts" }])
          .map((c) => `<option value="${c.id}">${UI.esc(c.name)}</option>`)
          .join("");

        UI.openModal(
          `＋ Add New Product (অ্যাডমিন সরাসরি প্রোডাক্ট যোগ করুন)`,
          `<div style="display:grid; gap:12px;">
            <div class="field">
              <label class="fs12 fw700">Product Title (প্রোডাক্টের নাম) <span class="req">*</span></label>
              <input class="input" id="newAdminProdTitle" placeholder="যেমন: Meta AI Admin (.45 Exclusive) বা Horjin .45" required>
            </div>

            <div class="grid-2" style="gap:12px;">
              <div class="field">
                <label class="fs12 fw700">Category (ক্যাটাগরি) <span class="req">*</span></label>
                <select class="select" id="newAdminProdCat">${catOptions}</select>
              </div>
              <div class="field">
                <label class="fs12 fw700">Price per unit (৳) — (যেমন: 0.50 Default, 0.55 Admin VIP) <span class="req">*</span></label>
                <input class="input" type="number" step="0.01" id="newAdminProdPrice" value="0.50" required style="font-weight:700; color:var(--accent);">
              </div>
            </div>

            <div class="field">
              <label class="fs12 fw700">Bulk Accounts / Logs (মেইল বা অ্যাকাউন্ট তালিকা — প্রতি লাইনে একটি)</label>
              <textarea class="textarea mono" id="newAdminProdLogs" rows="4" placeholder="mail1@gmail.com:pass1&#10;mail2@gmail.com:pass2" style="font-size:12px;"></textarea>
              <span class="dim fs11">মেইল পেস্ট করলে স্বয়ংক্রিয়ভাবে স্টক গণনা হবে। অথবা নিচের ঘরে স্টক সংখ্যা লিখতে পারেন।</span>
            </div>

            <div class="grid-2" style="gap:12px;">
              <div class="field">
                <label class="fs12 fw700">Stock Count (স্টক সংখ্যা)</label>
                <input class="input" type="number" id="newAdminProdStock" value="100" min="0">
              </div>
              <div class="field">
                <label class="fs12 fw700">Warranty / Replacement Terms</label>
                <select class="select" id="newAdminProdWarranty">
                  <option value="24 Hours Replacement Guarantee">24 Hours Replacement Guarantee</option>
                  <option value="12 Hours Replacement Guarantee">12 Hours Replacement Guarantee</option>
                  <option value="7 Days Warranty">7 Days Warranty</option>
                  <option value="No Replace (০.৪০ রেট)">No Replace</option>
                </select>
              </div>
            </div>

            <!-- Banner Selection -->
            <div class="field">
              <label class="fs12 fw700">Product Banner / Image</label>
              <input type="hidden" id="newAdminProdImage" value="assets/meta-ai-050.svg">
              <div class="flex gap6 mb8" style="flex-wrap:wrap;">
                <button type="button" class="btn btn-ghost btn-sm set-new-img" data-src="assets/meta-ai-050.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,30,66,0.15);">👑 Admin 0.55</button>
                <button type="button" class="btn btn-ghost btn-sm set-new-img" data-src="assets/meta-ai-050.svg" style="font-size:11px; padding:4px 8px; background:rgba(0,245,212,0.15);">🟢 Market 0.50</button>
                <button type="button" class="btn btn-ghost btn-sm set-new-img" data-src="assets/meta-ai-040.svg" style="font-size:11px; padding:4px 8px; background:rgba(59,130,246,0.15);">🔵 Replace 0.40</button>
                <button type="button" class="btn btn-ghost btn-sm set-new-img" data-src="assets/meta-ai-030.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,183,3,0.15);">🟡 Budget 0.30</button>
                <button type="button" class="btn btn-ghost btn-sm set-new-img" data-src="assets/facebook-aged.svg" style="font-size:11px; padding:4px 8px; background:rgba(59,130,246,0.15);">🔵 FB Aged</button>
              </div>
              <div class="flex ac gap8">
                <input type="file" accept="image/*" id="newAdminImgFile" hidden>
                <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('newAdminImgFile').click()">
                  ${UI.icon("upload")} Upload Image
                </button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="let u = prompt('Enter Image URL:'); if(u){ document.getElementById('newAdminProdImage').value = u; document.getElementById('newAdminImgPreview').src = u; }">
                  🔗 Image URL
                </button>
              </div>
              <div style="margin-top:8px; height:80px; border-radius:8px; overflow:hidden; border:1px solid var(--border); background:#07080c;">
                <img id="newAdminImgPreview" src="../assets/meta-ai-050.svg" style="width:100%; height:100%; object-fit:cover;" alt="Banner">
              </div>
            </div>

            <div class="field">
              <label class="fs12 fw700">Description (বিবরণ)</label>
              <textarea class="textarea" id="newAdminProdDesc" rows="2" placeholder="Instant auto-delivery, fresh active cookies & logs."></textarea>
            </div>
          </div>`,
          `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
           <button class="btn btn-primary" id="saveNewAdminProdBtn" style="background:var(--accent); font-weight:800;">🚀 Publish Live Product</button>`
        );

        // Preset banner buttons
        document.querySelectorAll(".set-new-img").forEach((b) => {
          b.onclick = () => {
            document.getElementById("newAdminProdImage").value = b.dataset.src;
            document.getElementById("newAdminImgPreview").src = "../" + b.dataset.src;
          };
        });

        // Image file upload
        const imgInput = document.getElementById("newAdminImgFile");
        if (imgInput) {
          imgInput.onchange = () => {
            const f = imgInput.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              document.getElementById("newAdminProdImage").value = ev.target.result;
              document.getElementById("newAdminImgPreview").src = ev.target.result;
            };
            reader.readAsDataURL(f);
          };
        }

        // Auto calculate stock count on textarea change
        const logsArea = document.getElementById("newAdminProdLogs");
        const stockInput = document.getElementById("newAdminProdStock");
        if (logsArea && stockInput) {
          logsArea.oninput = () => {
            const lines = logsArea.value.split("\n").map((s) => s.trim()).filter(Boolean);
            if (lines.length > 0) stockInput.value = lines.length;
          };
        }

        document.getElementById("saveNewAdminProdBtn").onclick = () => {
          const title = document.getElementById("newAdminProdTitle").value.trim();
          const category = document.getElementById("newAdminProdCat").value;
          const price = Number(document.getElementById("newAdminProdPrice").value) || 0.50;
          const rawLogs = document.getElementById("newAdminProdLogs").value.trim();
          const stock = Number(document.getElementById("newAdminProdStock").value) || 1;
          const warranty = document.getElementById("newAdminProdWarranty").value;
          const image = document.getElementById("newAdminProdImage").value.trim();
          const description = document.getElementById("newAdminProdDesc").value.trim();

          if (!title) {
            UI.toast("অনুগ্রহ করে প্রোডাক্টের নাম লিখুন!", "error");
            return;
          }

          const accounts = rawLogs ? rawLogs.split("\n").map((s) => s.trim()).filter(Boolean) : [];

          API.createProduct(
            {
              title,
              category,
              price,
              stock: accounts.length || stock,
              rawLogs,
              warranty,
              image,
              description,
              isAdminDirect: true,
              sellerName: "RTN Official (Admin)"
            },
            [],
            accounts
          ).then(() => {
            UI.closeModal();
            UI.toast("প্রোডাক্ট সফলভাবে লাইভ পাবলিশ হয়েছে!", "success");
            loadAll();
            document.dispatchEvent(new CustomEvent("products:updated"));
          }).catch((err) => {
            UI.toast(err.message, "error");
          });
        };
      };
    }

    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th><th>Banner / Icon</th><th>Title</th><th>Category</th><th>Price (৳)</th><th>Stock</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${allProducts
          .map(
            (p) => `
          <tr>
            <td class="mono fs12 font-bold">${p.id}</td>
            <td style="width:70px;">
              ${p.image ? `<img src="${fixImg(p.image)}" style="width:58px; height:34px; object-fit:cover; border-radius:6px; border:1px solid var(--border);" alt="">` : `<span style="font-size:24px;">${p.emoji || "🤖"}</span>`}
            </td>
            <td style="font-weight:600; max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${UI.esc(p.title)}</td>
            <td class="dim fs12">${p.category}</td>
            <td><b style="color:var(--accent); font-size:15px;">${UI.money(p.price)}</b></td>
            <td><b>${p.stock}</b></td>
            <td>${UI.badge(p.status)}</td>
            <td>
              <div class="flex ac gap6 flex-wrap">
                <button class="btn btn-outline btn-sm edit-prod-btn" data-id="${p.id}">
                  ${UI.icon("edit")} Edit
                </button>
                <button class="btn btn-outline btn-sm del-prod-btn" data-id="${p.id}" style="color:var(--red); border-color:rgba(239,68,68,0.4);">
                  🗑️ Delete
                </button>
              </div>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>`;

    // Row Edit Button
    table.querySelectorAll(".edit-prod-btn").forEach((btn) => {
      btn.onclick = () => {
        const p = allProducts.find((x) => x.id === btn.dataset.id);
        if (!p) return;

        const currImg = fixImg(p.image) || "../assets/meta-ai-red.svg";

        UI.openModal(
          `✏️ Edit Listing: ${p.id}`,
          `<div style="display:grid; gap:12px;">
            <div class="field">
              <label class="fs12 fw700">Product Title</label>
              <input class="input" id="editTitle" value="${UI.esc(p.title)}" required>
            </div>
            
            <div class="grid-2" style="gap:12px;">
              <div class="field">
                <label class="fs12 fw700">Price per unit (৳) — (e.g. 0.50 Market, 0.55 Admin, 0.40)</label>
                <input class="input" type="number" step="0.01" id="editPrice" value="${p.price}" required style="font-weight:700; color:var(--accent);">
              </div>
              <div class="field">
                <label class="fs12 fw700">Stock Available</label>
                <input class="input" type="number" id="editStock" value="${p.stock}" required>
              </div>
            </div>

            <!-- Image / Banner Editor -->
            <div class="field">
              <label class="fs12 fw700">Product Promotional Banner / Image</label>
              <input type="hidden" id="editImage" value="${currImg}">
              <div class="flex gap6 mb8" style="flex-wrap:wrap;">
                <button type="button" class="btn btn-ghost btn-sm set-ed-img" data-src="assets/meta-ai-red.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,30,66,0.15);">🔴 Red 0.45</button>
                <button type="button" class="btn btn-ghost btn-sm set-ed-img" data-src="assets/meta-ai-amber.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,183,3,0.15);">🟡 Amber 0.30</button>
                <button type="button" class="btn btn-ghost btn-sm set-ed-img" data-src="assets/meta-ai-emerald.svg" style="font-size:11px; padding:4px 8px; background:rgba(0,245,212,0.15);">🟢 Horjin 0.50</button>
                <button type="button" class="btn btn-ghost btn-sm set-ed-img" data-src="assets/facebook-aged.svg" style="font-size:11px; padding:4px 8px; background:rgba(59,130,246,0.15);">🔵 FB Aged</button>
              </div>
              <div class="flex ac gap8">
                <input type="file" accept="image/*" id="editImgFile" hidden>
                <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('editImgFile').click()">
                  ${UI.icon("upload")} Upload Custom Image
                </button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="let u = prompt('Enter Image URL:'); if(u){ document.getElementById('editImage').value = u; document.getElementById('editImgPreview').src = u; }">
                  🔗 Image URL
                </button>
              </div>
              <div style="margin-top:8px; height:100px; border-radius:8px; overflow:hidden; border:1px solid var(--border); background:#07080c;">
                <img id="editImgPreview" src="${currImg}" style="width:100%; height:100%; object-fit:cover;" alt="Banner">
              </div>
            </div>

            <div class="field">
              <label class="fs12 fw700">Icon / Emoji (Fallback)</label>
              <input class="input" id="editEmoji" value="${UI.esc(p.emoji || "🤖")}" maxlength="4">
            </div>

            <div class="field">
              <label class="fs12 fw700">Description</label>
              <textarea class="textarea" id="editDesc" rows="3">${UI.esc(p.description)}</textarea>
            </div>
          </div>`,
          `<div class="flex jb ac w-100" style="gap:10px;">
             <button class="btn btn-danger btn-sm" id="modalDelProdBtn">🗑️ Delete Listing</button>
             <div class="flex gap8">
               <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
               <button class="btn btn-primary" id="saveProdEditBtn">Update Product</button>
             </div>
           </div>`
        );

        // Hook image preset buttons in modal
        document.querySelectorAll(".set-ed-img").forEach((b) => {
          b.onclick = () => {
            document.getElementById("editImage").value = b.dataset.src;
            document.getElementById("editImgPreview").src = b.dataset.src;
          };
        });

        // Hook image file upload in modal
        const editFileInput = document.getElementById("editImgFile");
        if (editFileInput) {
          editFileInput.onchange = () => {
            const f = editFileInput.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              document.getElementById("editImage").value = ev.target.result;
              document.getElementById("editImgPreview").src = ev.target.result;
            };
            reader.readAsDataURL(f);
          };
        }

        // Delete button inside edit modal
        document.getElementById("modalDelProdBtn").onclick = () => {
          UI.confirmModal(
            "🗑️ Delete Product",
            `Are you sure you want to permanently delete listing "${p.title}"?`,
            () => {
              API.deleteProduct(p.id).then(() => {
                UI.closeModal();
                UI.toast("Product deleted successfully!", "success");
                loadAll();
                document.dispatchEvent(new CustomEvent("products:updated"));
              });
            },
            "Delete",
            true
          );
        };

        // Update button inside edit modal
        document.getElementById("saveProdEditBtn").onclick = () => {
          const patch = {
            title: document.getElementById("editTitle").value.trim(),
            price: Number(document.getElementById("editPrice").value) || p.price,
            stock: Number(document.getElementById("editStock").value) || p.stock,
            image: document.getElementById("editImage").value.trim() || p.image,
            emoji: document.getElementById("editEmoji").value.trim() || p.emoji,
            description: document.getElementById("editDesc").value.trim()
          };
          API.updateProduct(p.id, patch).then(() => {
            UI.closeModal();
            UI.toast("Product updated!");
            loadAll();
            document.dispatchEvent(new CustomEvent("products:updated"));
          });
        };
      };
    });

    // Row Delete Button
    table.querySelectorAll(".del-prod-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const p = allProducts.find((x) => x.id === id);
        UI.confirmModal(
          "🗑️ Delete Product",
          `Are you sure you want to delete "${p?.title || id}" from the catalog?`,
          () => {
            API.deleteProduct(id).then(() => {
              UI.toast("Product deleted!", "success");
              loadAll();
              document.dispatchEvent(new CustomEvent("products:updated"));
            });
          },
          "Delete",
          true
        );
      };
    });
  }

  // ---------- 7. Platform Settings ----------
  function renderPlatformSettings(cfg) {
    if (!cfg) return;
    const bk = document.getElementById("cfgBkash");
    if (bk) bk.value = cfg.bkash || "01609166109";
    const ng = document.getElementById("cfgNagad");
    if (ng) ng.value = cfg.nagad || "01620576996";
    const wp = document.getElementById("cfgWp");
    if (wp) wp.value = cfg.adminWhatsapp || "01609166109";
    const bn = document.getElementById("cfgBinance");
    if (bn) bn.value = cfg.binance || "1271861063";

    const form = document.getElementById("platformForm");
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const patch = {
          bkash: document.getElementById("cfgBkash").value.trim(),
          nagad: document.getElementById("cfgNagad").value.trim(),
          adminWhatsapp: document.getElementById("cfgWp").value.trim(),
          binance: document.getElementById("cfgBinance").value.trim()
        };
        API.updatePlatformAccounts(patch).then(() => {
          UI.toast("Platform settings updated!");
        });
      };
    }

    // Handle Admin Master Password Change
    const passForm = document.getElementById("adminPasswordChangeForm");
    if (passForm) {
      passForm.onsubmit = (e) => {
        e.preventDefault();
        const cur = (document.getElementById("curAdminPassInp")?.value || "").trim();
        const newP = (document.getElementById("newAdminPassInp")?.value || "").trim();
        const confP = (document.getElementById("confAdminPassInp")?.value || "").trim();

        if (!cur || !newP || !confP) {
          UI.toast("পাসওয়ার্ডের সকল তথ্য পূরণ করুন", "err");
          return;
        }
        if (newP !== confP) {
          UI.toast("নতুন পাসওয়ার্ড দুটি মিলছে না! (New passwords do not match)", "err");
          return;
        }
        if (newP.length < 4) {
          UI.toast("পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে (Minimum 4 chars)", "err");
          return;
        }

        API.changeAdminPassword(cur, newP)
          .then(() => {
            UI.toast("🔑 মাস্টার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! (Password Updated)", "success");
            passForm.reset();
          })
          .catch((err) => {
            UI.toast(err.message || "পাসওয়ার্ড পরিবর্তনে ব্যর্থ", "err");
          });
      };
    }
  }

  // ---------- 8. Sellers Management ----------
  function renderSellersManagement(sellers) {
    const table = document.getElementById("sellersManageTable");
    if (!table) return;

    if (!sellers || !sellers.length) {
      table.innerHTML = `
        <thead>
          <tr>
            <th>Seller</th>
            <th>WhatsApp</th>
            <th>Active Stock</th>
            <th>Total Products</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="6" class="text-center dim p20">কোন সেলার প্রোফাইল পাওয়া যায়নি (No sellers registered yet)</td>
          </tr>
        </tbody>
      `;
      return;
    }

    const rows = sellers
      .map((s) => {
        const isBanned = !!s.isBanned;
        const activeStock = Number(s.activeStock) || 0;
        const totalProducts = Number(s.totalProducts) || 0;
        const sName = s.name || s.username || "Seller";
        const avatar = s.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";

        let statusBadge = "";
        if (isBanned) {
          statusBadge = `<span class="badge" style="background:rgba(239,68,68,0.15); color:var(--red); border:1px solid rgba(239,68,68,0.3);">🚫 BANNED</span>`;
        } else if (activeStock > 0) {
          statusBadge = `<span class="badge" style="background:rgba(16,185,129,0.15); color:var(--emerald); border:1px solid rgba(16,185,129,0.3);">✅ Active (${activeStock} pcs)</span>`;
        } else {
          statusBadge = `<span class="badge" style="background:rgba(245,158,11,0.15); color:var(--amber); border:1px solid rgba(245,158,11,0.3);">⚠️ 0 Stock (Hidden)</span>`;
        }

        return `
          <tr data-seller="${UI.escape(sName)}">
            <td>
              <div class="flex ac gap8">
                <img src="${UI.escape(avatar)}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid var(--border);" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'">
                <div>
                  <div class="fw700">${UI.escape(sName)}</div>
                  <div class="fs11 dim">@${UI.escape(s.username || sName.toLowerCase().replace(/\\s+/g, ""))}</div>
                </div>
              </div>
            </td>
            <td class="mono fs12">${UI.escape(s.whatsapp || "N/A")}</td>
            <td>
              <span class="fw700 ${activeStock > 0 ? "text-emerald" : "dim"}">${activeStock} pcs</span>
              ${activeStock <= 0 ? '<div class="fs11 text-warning">বায়ারদের কাছে গোপন</div>' : ""}
            </td>
            <td>${totalProducts} items</td>
            <td>${statusBadge}</td>
            <td>
              <div class="flex ac gap6 flex-wrap">
                <a href="../seller.html?name=${encodeURIComponent(sName)}" target="_blank" class="btn btn-outline btn-xs" title="View Store">🔗 Store</a>
                ${
                  isBanned
                    ? `<button class="btn btn-outline btn-xs unban-seller-btn" data-seller="${UI.escape(sName)}" style="color:var(--emerald); border-color:var(--emerald);">✅ Unban</button>`
                    : `<button class="btn btn-outline btn-xs ban-seller-btn" data-seller="${UI.escape(sName)}" style="color:var(--red); border-color:var(--red);">🚫 Ban</button>`
                }
                <button class="btn btn-outline btn-xs delete-seller-btn" data-seller="${UI.escape(sName)}" style="color:var(--red);">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    table.innerHTML = `
      <thead>
        <tr>
          <th>Seller Profile</th>
          <th>WhatsApp</th>
          <th>Active Stock</th>
          <th>Total Listings</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    `;

    // Bind Ban
    table.querySelectorAll(".ban-seller-btn").forEach((btn) => {
      btn.onclick = () => {
        const sellerName = btn.dataset.seller;
        UI.confirmModal(
          "Ban Seller Profile",
          `Are you sure you want to BAN "${sellerName}"? All of their products will be deactivated and hidden from the public store.`,
          () => {
            API.banSeller(sellerName).then(() => {
              UI.toast(`Seller "${sellerName}" has been banned!`, "success");
              loadAll();
            });
          },
          "Ban Seller",
          true
        );
      };
    });

    // Bind Unban
    table.querySelectorAll(".unban-seller-btn").forEach((btn) => {
      btn.onclick = () => {
        const sellerName = btn.dataset.seller;
        UI.confirmModal(
          "Unban Seller Profile",
          `Restore seller "${sellerName}" and re-activate their listings?`,
          () => {
            API.unbanSeller(sellerName).then(() => {
              UI.toast(`Seller "${sellerName}" unbanned and restored!`, "success");
              loadAll();
            });
          },
          "Unban Seller"
        );
      };
    });

    // Bind Delete
    table.querySelectorAll(".delete-seller-btn").forEach((btn) => {
      btn.onclick = () => {
        const sellerName = btn.dataset.seller;
        UI.confirmModal(
          "Delete Seller Profile",
          `Permanently delete seller "${sellerName}" and delete all of their products? This action cannot be undone.`,
          () => {
            API.deleteSeller(sellerName).then(() => {
              UI.toast(`Seller profile "${sellerName}" permanently deleted!`, "success");
              loadAll();
            });
          },
          "Delete Permanently",
          true
        );
      };
    });
  }

  // ---------- 9. Buyer Reports ----------
  function renderBuyerReports(reports) {
    const table = document.getElementById("buyerReportsTable");
    if (!table) return;

    if (!reports || !reports.length) {
      table.innerHTML = `
        <thead>
          <tr>
            <th>Report ID</th>
            <th>Order & Product</th>
            <th>Target Seller</th>
            <th>Buyer (Reporter)</th>
            <th>Defective Mails</th>
            <th>Reason & Notes</th>
            <th>Date</th>
            <th>Status</th>
            <th>Admin Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="9" class="text-center dim p20">কোন বায়ার রিপোর্ট নেই (No buyer complaints filed)</td>
          </tr>
        </tbody>
      `;
      return;
    }

    const rows = reports
      .map((r) => {
        const isPending = r.status === "pending";
        let statusBadge = "";
        if (r.status === "resolved") {
          statusBadge = `<span class="badge" style="background:rgba(16,185,129,0.15); color:var(--emerald);">✅ Resolved</span>`;
        } else if (r.status === "refunded") {
          statusBadge = `<span class="badge" style="background:rgba(6,182,212,0.15); color:var(--cyan);">💰 Refunded</span>`;
        } else if (r.status === "replaced") {
          statusBadge = `<span class="badge" style="background:rgba(16,185,129,0.15); color:var(--green);">🔄 Replaced</span>`;
        } else if (r.status === "dismissed") {
          statusBadge = `<span class="badge" style="background:rgba(148,163,184,0.15); color:var(--slate);">❌ Dismissed</span>`;
        } else {
          statusBadge = `<span class="badge" style="background:rgba(239,68,68,0.15); color:var(--red);">⏳ Pending Action</span>`;
        }

        const badList = r.badEmails || [];
        const sellerName = r.sellerName || r.targetSeller || "General";
        const buyerName = r.buyerName || r.reporterName || r.reporter || "Buyer";
        const buyerPhone = r.buyerWhatsapp || r.reporterWhatsapp || "";

        return `
          <tr data-id="${r.id}">
            <td class="mono fs12 font-bold">#${UI.esc(r.id)}</td>
            <td>
              <div class="fw700 t-main">অর্ডার #${UI.esc(r.orderId || "—")}</div>
              <div class="fs11 dim">${UI.esc(r.productTitle || r.targetProduct || "Product")}</div>
            </td>
            <td>
              <div class="fw700">${UI.esc(sellerName)}</div>
            </td>
            <td>
              <div class="fw700">${UI.esc(buyerName)}</div>
              ${buyerPhone ? `<a href="https://wa.me/${buyerPhone.replace(/[^0-9]/g, '')}" target="_blank" class="fs11" style="color:var(--green); font-weight:700;">💬 ${buyerPhone}</a>` : ""}
            </td>
            <td>
              <div class="flex ac gap6">
                <span class="badge red no-dot">${badList.length || r.badCount || 1}টি মেইল</span>
                <button class="btn btn-ghost btn-xs view-bad-mails-btn" data-id="${r.id}">🔍 দেখুন</button>
              </div>
            </td>
            <td>
              <span class="badge badge-warning mb2">${UI.esc(r.reason || "Complaint")}</span>
              <div style="max-width:200px; font-size:11.5px; white-space:normal; line-height:1.3; color:var(--text-2);">${UI.esc(r.details || "-")}</div>
            </td>
            <td class="fs11 dim">${r.date || new Date(r.createdAt || Date.now()).toLocaleDateString()}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="flex ac gap6 flex-wrap">
                ${
                  isPending
                    ? `
                      <button class="btn btn-primary btn-xs refund-rep-btn" data-id="${r.id}" style="background:var(--cyan); border-color:var(--cyan); color:#000; font-weight:700;" title="Refund buyer wallet">💰 Refund</button>
                      <button class="btn btn-success btn-xs resolve-rep-btn" data-id="${r.id}">✅ Resolve</button>
                      <button class="btn btn-outline btn-xs dismiss-rep-btn" data-id="${r.id}">Dismiss</button>
                      ${
                        sellerName && sellerName !== "RTN Official"
                          ? `<button class="btn btn-danger btn-xs ban-from-rep-btn" data-seller="${UI.esc(sellerName)}" data-id="${r.id}">🚫 Ban</button>`
                          : ""
                      }
                    `
                    : `
                      <button class="btn btn-outline btn-xs del-rep-btn" data-id="${r.id}" style="color:var(--red);">🗑️ Delete</button>
                    `
                }
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    table.innerHTML = `
      <thead>
        <tr>
          <th>Report ID</th>
          <th>Order & Product</th>
          <th>Target Seller</th>
          <th>Buyer (Reporter)</th>
          <th>Defective Mails</th>
          <th>Reason & Notes</th>
          <th>Date</th>
          <th>Status</th>
          <th>Admin Action</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    `;

    // View bad emails modal
    table.querySelectorAll(".view-bad-mails-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const r = reports.find((x) => x.id === id);
        if (!r) return;

        const badList = r.badEmails || [];
        UI.openModal(
          `🔍 নষ্ট মেইল বিবরণ — রিপোর্ট #${r.id}`,
          `<div style="display:grid; gap:12px;">
            <div style="background:var(--surface-2); padding:10px 12px; border-radius:8px; border:1px solid var(--border);">
              <div>অর্ডার: <b>#${r.orderId}</b> · প্রোডাক্ট: <b>${UI.esc(r.productTitle || "—")}</b></div>
              <div class="fs12 dim">সেলার: <b>${UI.esc(r.sellerName || "—")}</b> · বায়ার: <b>${UI.esc(r.buyerName || "—")}</b> (${r.buyerWhatsapp || "No WhatsApp"})</div>
              <div class="fs12 mt4" style="color:var(--accent);">সমস্যা: <b>${UI.esc(r.reason || "—")}</b></div>
              ${r.details ? `<div class="fs12 dim mt2">বিবরণ: ${UI.esc(r.details)}</div>` : ""}
            </div>

            <div class="field">
              <label class="fs12 fw700" style="color:var(--red);">বায়ারের রিপোর্টকৃত নষ্ট মেইলসমূহ (${badList.length}টি):</label>
              <textarea class="textarea mono" style="font-size:12px; height:120px;" readonly>${UI.esc(badList.join("\n") || "কোন তালিকা নেই")}</textarea>
              <div class="flex jb mt4">
                <span class="dim fs11">কপি করে চেক করতে পারেন।</span>
                <button class="btn btn-outline btn-xs" onclick="UI.copyText('${UI.esc(badList.join("\\n"))}')">Copy Mails</button>
              </div>
            </div>
          </div>`,
          `<button class="btn btn-primary" onclick="UI.closeModal()">Close</button>`
        );
      };
    });

    // Refund Buyer
    table.querySelectorAll(".refund-rep-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const r = reports.find((x) => x.id === id);
        UI.confirmModal(
          "💰 বায়ারকে রিফান্ড প্রদান (Refund Buyer)",
          `আপনি কি রিপোর্ট #${id} (অর্ডার #${r?.orderId}) এর প্রেক্ষিতে বায়ারের ওয়ালেট ব্যালেন্সে রিফান্ড পাঠাতে চান?`,
          () => {
            API.refundReport(id).then((res) => {
              UI.toast(`বায়ারকে ৳${res.refundAmount} রিফান্ড দেওয়া হয়েছে!`, "success");
              loadAll();
            }).catch((err) => {
              UI.toast(err.message, "error");
            });
          },
          "Confirm Refund",
          true
        );
      };
    });

    // Bind resolve
    table.querySelectorAll(".resolve-rep-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        API.resolveReport(id, "resolved").then(() => {
          UI.toast("Report marked as resolved!", "success");
          loadAll();
        });
      };
    });

    // Bind dismiss
    table.querySelectorAll(".dismiss-rep-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        API.resolveReport(id, "dismissed").then(() => {
          UI.toast("Report dismissed.", "info");
          loadAll();
        });
      };
    });

    // Bind ban seller from report
    table.querySelectorAll(".ban-from-rep-btn").forEach((btn) => {
      btn.onclick = () => {
        const sellerName = btn.dataset.seller;
        const id = btn.dataset.id;
        UI.confirmModal(
          "Ban Seller & Resolve Report",
          `Do you want to BAN seller "${sellerName}" and resolve report #${id}?`,
          () => {
            API.banSeller(sellerName)
              .then(() => API.resolveReport(id, "resolved"))
              .then(() => {
                UI.toast(`Seller "${sellerName}" banned and report #${id} resolved!`, "success");
                loadAll();
              });
          },
          "Ban & Resolve",
          true
        );
      };
    });

    // Bind delete
    table.querySelectorAll(".del-rep-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        API.deleteReport(id).then(() => {
          UI.toast("Report deleted.");
          loadAll();
        });
      };
    });
  }

  // Initial check
  checkAuth();
})();
