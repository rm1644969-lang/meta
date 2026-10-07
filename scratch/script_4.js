/* ---------- js/pages/home.js ---------- */
/* Marketplace home — categories, search, sort, product grid */
function initHome() {
  const grid = document.getElementById("catalog");
  const empty = document.getElementById("emptyState");
  const catBar = document.getElementById("catBar");
  const count = document.getElementById("resultCount");
  const params = new URLSearchParams(Router.queryStr());

  let state = { cat: "", sort: "new", q: params.get("q") || "" };
  let all = [];
  const catNames = {};

  // search box sync (header form uses GET → reload with ?q=)
  const hdrInput = document.querySelector("#headerSearch input");
  if (hdrInput) hdrInput.value = state.q;

  Promise.all([API.getCategories(), API.getProducts({ status: "live" })]).then(([cats, products]) => {
    cats.forEach((c) => (catNames[c.id] = c.name));
    all = products.map((p) => ({ ...p, categoryName: catNames[p.category] || p.category }));
    catBar.insertAdjacentHTML(
      "beforeend",
      cats.map((c) => `<span class="pill" data-cat="${c.id}">${c.icon} ${c.name}</span>`).join("")
    );
    render();
  });

  catBar.addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    catBar.querySelectorAll(".pill").forEach((p) => p.classList.remove("on"));
    pill.classList.add("on");
    state.cat = pill.dataset.cat;
    render();
  });

  document.getElementById("sortTabs").addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (!t) return;
    document.querySelectorAll("#sortTabs .tab").forEach((x) => x.classList.remove("on"));
    t.classList.add("on");
    state.sort = t.dataset.sort;
    render();
  });

  function render() {
    let list = all.filter((p) => !state.cat || p.category === state.cat);
    if (state.q) list = list.filter((p) => (p.title + " " + (p.seller?.name || "")).toLowerCase().includes(state.q.toLowerCase()));
    
    switch (state.sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => (b.seller?.rating || 0) - (a.seller?.rating || 0)); break;
    }

    // Always keep Admin Meta 0.45 at the absolute top (Rank 1), followed by other pinned items
    list.sort((a, b) => {
      const aWeight = (a.id === "P1004" || a.isAdminOnly || a.isTopAdmin || (a.price === 0.45 && (a.title || "").includes("Admin Meta"))) ? 3 : ((a.isOfficial || a.isPinned) ? 1 : 0);
      const bWeight = (b.id === "P1004" || b.isAdminOnly || b.isTopAdmin || (b.price === 0.45 && (b.title || "").includes("Admin Meta"))) ? 3 : ((b.isOfficial || b.isPinned) ? 1 : 0);
      return bWeight - aWeight;
    });

    grid.innerHTML = list.map(UI.productCard).join("");
    empty.hidden = list.length > 0;
    count.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  }
}

Router.INIT["home"] = initHome;

/* ---------- js/pages/product.js ---------- */
/* Product details — info, buy flow (DP/deposit rule), auto accounts delivery, seller card, reviews */
function initProduct() {
  const params = new URLSearchParams(Router.queryStr());
  const id = params.get("id") || "P1001";
  const wrap = document.getElementById("productWrap");

  let currentProduct = null;
  let currentWallet = null;

  function loadProduct() {
    Promise.all([API.getProduct(id), API.getCategories(), API.getWallet(), API.getMe()])
      .then(([p, cats, wallet, me]) => {
        if (!p) {
          wrap.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="e-ico">😕</div><h4>Product not found</h4><p>It may have been removed or rejected by admin.</p></div>`;
          return;
        }

        currentProduct = p;
        currentWallet = wallet;

        const catName = (cats.find((c) => c.id === p.category) || {}).name || p.category;
        const isMine = p.seller && (p.seller.name === me.name || p.seller.name === "You");
        const canAfford = wallet.balance >= p.price;

        const isNoReplace = p.title.toLowerCase().includes("no replace") || (p.description || "").toLowerCase().includes("no replace");
        const isGuarantee = p.title.toLowerCase().includes("guarantee") || p.title.toLowerCase().includes("horjin") || p.title.toLowerCase().includes("origin");

        wrap.innerHTML = `
          <div class="card glow-card" style="overflow:hidden">
            <div class="pd-media" style="height:220px; position:relative; overflow:hidden; background:linear-gradient(135deg, #191f32 0%, #0d111c 100%); display:flex; align-items:center; justify-content:center; border-bottom:1px solid var(--border)">
              ${p.image
                ? `<img src="${p.image}" alt="${UI.esc(p.title)}" style="width:100%; height:100%; object-fit:cover;">`
                : `<span class="emoji" style="font-size:64px">${p.emoji || "🤖"}</span>`
              }
            </div>
            <div class="card__body">
              <div class="flex ac gap8" style="flex-wrap:wrap">
                <span class="badge blue no-dot">${UI.esc(catName)}</span>
                ${p.status === "live" ? UI.badge("live") : UI.badge(p.status)}
                ${isNoReplace ? '<span class="badge red no-dot">⚠️ STRICTLY NO REPLACE</span>' : isGuarantee ? '<span class="badge green no-dot">✓ 24H WARRANTY</span>' : ''}
                <span class="dim fs12" style="margin-left:auto">ID: ${p.id} · ${(p.views || 0).toLocaleString()} views · ${p.sold || 0} sold</span>
              </div>
              <h1 style="font-size:24px; font-weight:800; margin:14px 0 8px; letter-spacing:-0.4px; color:#fff">${UI.esc(p.title)}</h1>
              <div class="flex ac gap8 mb16">${UI.stars(p.seller?.rating || 5.0, p.seller?.ratingCount || 100)} <span class="dim fs12">seller rating</span></div>
              <p class="muted" style="line-height:1.7; font-size:14.5px;">${UI.esc(p.description)}</p>
              ${p.features?.length ? `<ul class="feat-list" style="margin:16px 0; display:grid; gap:8px; list-style:none;">${p.features.map((f) => `<li style="display:flex; align-items:center; gap:8px;">${UI.checkMark()} <span>${UI.esc(f)}</span></li>`).join("")}</ul>` : ""}
              ${p.excelFiles?.length ? `
                <div class="divider"></div>
                <div class="fs13 muted flex ac gap8">${UI.icon("file")} <b>Bulk Accounts / Excel Logs Attached:</b></div>
                ${p.excelFiles.map((f) => `<div class="file-item" style="display:flex; align-items:center; gap:10px; padding:10px; background:var(--surface-2); border-radius:8px; margin-top:8px;"><span class="fico" style="color:var(--green)">${UI.icon("file")}</span><div><div class="fname" style="font-weight:600">${UI.esc(f.name)}</div><div class="fsize dim fs12">${(f.size / 1024).toFixed(1)} KB · automated stock deduction enabled</div></div></div>`).join("")}` : ""}
            </div>
          </div>

          <div>
            <div class="card buy-panel glow-card">
              <div class="card__body">
                <div class="flex ac jb">
                  <div class="buy-price" style="font-size:28px; font-weight:900; color:var(--accent);">
                    ${p.price > 0 ? `${UI.money(p.price)} <small style="font-size:13px; color:var(--text-3); font-weight:500;">/unit</small>` : `<span style="color:var(--amber); font-size:18px;">Rate Set by Admin</span>`}
                  </div>
                  <div class="pc-stock ${p.stock <= 0 ? 'out' : p.stock <= 50 ? 'low' : 'in'}">${p.stock <= 0 ? 'Out of stock' : `${p.stock.toLocaleString()} available`}</div>
                </div>

                <div class="flex ac jb mt16 fs13">
                  <span class="muted">Order Quantity</span>
                  <div class="qty-box" style="display:flex; align-items:center; gap:10px; background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:4px 10px;">
                    <button id="qMinus" style="font-size:18px; color:var(--text-2); padding:0 6px;">−</button>
                    <b id="qVal" style="font-size:16px; min-width:32px; text-align:center;">1</b>
                    <button id="qPlus" style="font-size:18px; color:var(--text-2); padding:0 6px;">+</button>
                  </div>
                </div>

                <div class="flex ac jb fs14 mt16" style="padding:12px; background:rgba(0,0,0,0.25); border-radius:8px;">
                  <span class="muted">Total Payable:</span>
                  <b id="totalVal" style="font-size:20px; color:#fff">${UI.money(p.price)}</b>
                </div>

                <hr class="divider">

                <div class="flex ac jb fs13 mb16">
                  <span class="muted">Your Available Deposit (DP):</span>
                  <span class="fw700" id="walletAffordText" style="color:${canAfford ? "var(--green)" : "var(--red)"}">${UI.money(wallet.balance)}</span>
                </div>

                ${isMine
                  ? `<div class="info-note" style="background:var(--surface-2); padding:12px; border-radius:8px; font-size:13px; color:var(--text-2);">This is your own listing. Buyers see this in the marketplace once approved by Admin.</div>`
                  : p.stock <= 0
                    ? `<button class="btn btn-ghost btn-block btn-lg" disabled style="background:var(--surface-2); color:var(--text-3);">Out of Stock</button>`
                    : `<button class="btn btn-primary btn-block btn-lg" id="buyBtn" style="font-size:16px; font-weight:800;">⚡ Instant Buy (Deposit First)</button>`}

                <a href="#/wallet?tab=deposit" class="btn btn-outline btn-block mt8">💰 Add Deposit (Min ৳50)</a>

                <div class="info-note mt16" style="background:rgba(255,30,66,0.06); border:1px solid rgba(255,30,66,0.2); padding:12px; border-radius:8px; font-size:12.5px; color:var(--text-2); display:flex; gap:10px;">
                  <span style="color:var(--accent); font-size:18px; flex:none;">🛡️</span>
                  <span><b>Deposit-First Policy:</b> Buyer must deposit into wallet before placing orders. Sold accounts are auto-deducted from database pool.</span>
                </div>

                <div class="safe-row flex ac jb fs12 muted mt16" style="flex-wrap:wrap; gap:8px;">
                  <span>🔒 Escrow Safe</span><span>⚡ Instant Logs Delivery</span><span>📋 Excel / Txt Export</span>
                </div>
              </div>
            </div>

            <div class="card mt16">
              <div class="card__body fs13 muted" style="display:flex; flex-direction:column; gap:10px;">
                <div class="flex ac gap8">${UI.icon("clock")}<span>Auto-delivery time: <b class="t-main">Instant (0 Seconds)</b></span></div>
                <div class="flex ac gap8">${UI.icon("trendUp")}<span><b class="t-main">${p.sold || 0}</b> accounts sold from this pool</span></div>
                <div class="flex ac gap8">${UI.icon("user")}<span>Seller: <b class="t-main">${UI.esc(p.seller?.name || "RTN Seller")}</b></span></div>
                <div class="pt8 flex ac jb" style="border-top:1px solid var(--border); margin-top:2px;">
                  <a href="#/seller?name=${encodeURIComponent(p.seller?.name || 'RTN Seller')}" class="fs12" style="color:var(--cyan); font-weight:700;">👤 View Seller Store</a>
                  <button type="button" class="btn btn-outline btn-xs" style="color:var(--red); border-color:rgba(239,68,68,0.3);" onclick="window.__reportSeller('${UI.esc(p.seller?.name || 'RTN Seller')}', '${UI.esc(p.title)}')">🚩 Report</button>
                </div>
              </div>
            </div>
          </div>`;

        // Quantity logic
        let qty = 1;
        const qVal = document.getElementById("qVal");
        const total = document.getElementById("totalVal");
        const affordText = document.getElementById("walletAffordText");

        const setQty = (n) => {
          qty = Math.max(1, Math.min(n, Math.max(1, p.stock)));
          qVal.textContent = qty;
          const cost = Number((p.price * qty).toFixed(2));
          total.textContent = UI.money(cost);
          if (affordText) {
            affordText.style.color = wallet.balance >= cost ? "var(--green)" : "var(--red)";
          }
        };

        document.getElementById("qMinus").onclick = () => setQty(qty - 1);
        document.getElementById("qPlus").onclick = () => setQty(qty + 1);

        // Buy button click
        document.getElementById("buyBtn")?.addEventListener("click", () => {
          const cost = Number((p.price * qty).toFixed(2));

          // Check if wallet balance is enough
          if (wallet.balance < cost) {
            UI.openModal(
              "⚠️ Deposit (DP) Required",
              `<div style="display:grid; gap:12px;">
                <p class="muted">You need <b class="t-main">${UI.money(cost)}</b> in your wallet to order <b>${qty} units</b>, but your available balance is <b style="color:var(--red)">${UI.money(wallet.balance)}</b>.</p>
                <div style="background:var(--surface-2); padding:14px; border-radius:8px; border:1px solid var(--border);">
                  <div class="flex jb mb8"><span>Shortage:</span><b style="color:var(--accent)">${UI.money(cost - wallet.balance)}</b></div>
                  <div class="flex jb fs12 dim">
                    <span>Payment Methods:</span>
                    <span class="flex ac gap6">
                      <img src="assets/bkash.png" style="height:16px; object-fit:contain;" alt="">
                      <img src="assets/nagad.png" style="height:16px; object-fit:contain;" alt="">
                      <img src="assets/binance.png" style="height:16px; object-fit:contain;" alt="">
                      <b>Min ৳50</b>
                    </span>
                  </div>
                </div>
                <p class="fs12 dim">Send money to bKash (01609166109) or Nagad (01620576996), then submit TrxID to approve.</p>
              </div>`,
              `<a href="#/wallet?tab=deposit" class="btn btn-primary btn-block">Go to Deposit (Min ৳50)</a>`
            );
            return;
          }

          // Confirm and Execute Purchase
          UI.confirmModal(
            "Confirm Meta AI Purchase",
            `Are you sure you want to purchase <b>${qty} × ${UI.esc(p.title)}</b> for <b style="color:var(--accent); font-size:16px;">${UI.money(cost)}</b>?<br><br>The accounts will be instantly deducted from the server pool and delivered to your order screen.`,
            () => {
              API.purchaseProduct({ productId: p.id, quantity: qty })
                .then(({ order, product }) => {
                  if (window.playNotificationAudio) window.playNotificationAudio("sale");
                  UI.toast("🎉 Instant Delivery Completed! Accounts ready below.", "ok");

                  // Deliver Accounts in Modal
                  const accText = (order.deliveredItems || []).join("\n");
                  UI.openModal(
                    "⚡ Instant Order Auto-Delivered!",
                    `<div style="display:grid; gap:14px;">
                      <div class="flex jb ac" style="flex-wrap:wrap; gap:8px;">
                        <span class="delivery-live-tag"><span class="delivery-live-dot"></span> ⚡ Instant Auto-Delivered (0s)</span>
                        <span class="badge green no-dot">✓ Order ID: ${order.id}</span>
                        <span class="dim fs12">${order.date}</span>
                      </div>
                      <p class="muted">Your <b>${qty} × ${UI.esc(p.title)}</b> accounts have been automatically deducted from the server pool and delivered:</p>
                      
                      <div class="delivery-box">
                        <textarea class="textarea mono delivered-credentials-box" style="font-size:12.5px; height:150px;" readonly id="deliveredBox">${UI.esc(accText)}</textarea>
                      </div>
                      
                      <div class="field mt4">
                        <label style="font-size:12.5px; font-weight:700; color:var(--text-2);">Download / Save Accounts (ফরম্যাট নির্বাচন করুন):</label>
                        <div class="flex gap8 mt6" style="flex-wrap:wrap;">
                          <button class="btn btn-outline btn-sm dl-fmt-btn" data-fmt="txt">📄 Download .TXT</button>
                          <button class="btn btn-outline btn-sm dl-fmt-btn" data-fmt="csv">📊 Download .CSV</button>
                          <button class="btn btn-outline btn-sm dl-fmt-btn" data-fmt="xlsx" style="border-color:var(--green); color:var(--green);">📗 Download Excel (.XLSX)</button>
                          <button class="btn btn-meta btn-sm" id="copyAccsBtn">${UI.icon("copy")} Copy All Accounts</button>
                        </div>
                      </div>

                      <div class="info-note" style="font-size:12px; border-radius:8px; padding:10px;">
                        ${isNoReplace 
                          ? '⚠️ <b>সতর্কতা (No Replace):</b> এই পণ্যটি নো রিপ্লেস ক্যাটাগরির। কেনার পর কোনো রিপ্লেসমেন্ট প্রযোজ্য নয়।' 
                          : '✓ <b>২৪ ঘণ্টা রিপ্লেসমেন্ট গ্যারান্টি:</b> যেকোনো আইডিতে সমস্যা হলে স্ক্রিনশট ও Order ID সহ সরাসরি Admin WhatsApp এ মেসেজ দিন: <a href="https://wa.me/8801609166109" target="_blank" style="color:var(--green); font-weight:700;">01609166109</a>'}
                      </div>
                    </div>`,
                    `<a href="#/orders" class="btn btn-meta">📋 View in My Orders</a>
                     <button class="btn btn-ghost" onclick="UI.closeModal(); Router.rerender();">Done</button>`
                  );

                  // Setup Copy & Download listeners
                  document.querySelectorAll(".dl-fmt-btn").forEach((b) => {
                    b.onclick = () => UI.downloadAccounts(order, b.dataset.fmt);
                  });

                  document.getElementById("copyAccsBtn")?.addEventListener("click", () => {
                    UI.copyText(accText);
                  });
                })
                .catch((err) => {
                  UI.toast(err.message, "err");
                });
            },
            "Confirm & Pay"
          );
        });

        renderSeller(p, catName);
        renderReviews(p);
        renderSimilar(p, cats);
      });
  }

  loadProduct();

  // ---------- Seller Card (Privacy Protected — Only Admin Sees WhatsApp) ----------
  function renderSeller(p, catName) {
    const s = p.seller || {};
    const sellerName = s.name || "Meta AI Seller";
    const isAdmin = (sellerName || "").toLowerCase().includes("admin") || (sellerName || "").toLowerCase().includes("rtn");

    document.getElementById("sellerBody").innerHTML = `
      <div class="flex ac gap12">
        ${UI.avatar(sellerName, s.photo, "lg")}
        <div style="min-width:0">
          <div class="fw700" style="font-size:16px;">
            <a href="#/seller?name=${encodeURIComponent(sellerName)}" class="t-main" style="text-decoration:none;">${UI.esc(sellerName)}</a>
            ${isAdmin ? '<span class="badge red no-dot r-role">⭐ Admin Store</span>' : '<span class="badge cyan no-dot r-role">👤 Verified Seller</span>'}
          </div>
          <div style="margin-top:4px;">${UI.stars(s.rating || 5.0, s.ratingCount || 1)}</div>
          <div class="dim fs12 mt4" style="color:var(--green); display:flex; align-items:center; gap:4px;">
            <span>🛡️</span> <b>RTN Escrow Protected (প্রাইভেসী সুরক্ষিত)</b>
          </div>
        </div>
      </div>
      <div class="mt12">
        <a href="https://wa.me/8801609166109" target="_blank" class="btn btn-outline btn-sm w100 flex ac jc gap6" style="color:var(--green); border-color:rgba(0,255,136,0.4); text-decoration:none;">
          <span>💬</span> RTN Escrow Support (অ্যাডমিন হেল্পলাইন)
        </a>
      </div>
      <div class="stats-grid" style="grid-template-columns:1fr 1fr; margin:14px 0 12px">
        <div class="card stat-card"><div class="label">Total Sold</div><div class="value">${(p.sold || 0) + 120}</div></div>
        <div class="card stat-card"><div class="label">Satisfaction</div><div class="value">99.8%</div></div>
      </div>
      <p class="fs13 muted">Specialized in <b class="t-main">${UI.esc(catName)}</b>. All transactions protected by RTN Wallet Escrow.</p>
      <a href="#/seller?name=${encodeURIComponent(sellerName)}" class="btn btn-outline btn-block mt16">
        👤 View All Products from this Seller →
      </a>`;
  }

  // ---------- Reviews Section ----------
  function renderReviews(p) {
    const sellerName = p.seller?.name || "RTN Official Store";
    API.getReviews().then((all) => {
      const list = all.filter((r) => r.forSeller === sellerName || r.forSeller === "You" || r.forSeller === "RTN Official Store");
      const avg = list.length ? list.reduce((a, r) => a + r.stars, 0) / list.length : 5.0;

      document.getElementById("reviewSummary").innerHTML = `
        <div class="review-score" style="display:flex; align-items:center; gap:16px; margin-bottom:18px; padding-bottom:18px; border-bottom:1px solid var(--border);">
          <div style="font-size:38px; font-weight:900; color:#fff">${avg.toFixed(1)}</div>
          <div>
            <div>${UI.stars(avg)}</div>
            <div class="dim fs12" style="margin-top:4px;">Based on ${list.length} verified buyer reviews</div>
          </div>
        </div>`;

      document.getElementById("reviewList").innerHTML = list.length
        ? list.map((r) => `
          <div class="review-item" style="padding:14px 0; border-bottom:1px solid var(--border);">
            <div class="flex ac jb mb8">
              <div class="flex ac gap8">
                ${UI.avatar(r.from, null, "sm")}
                <b style="font-size:13.5px; color:#fff">${UI.esc(r.from)}</b>
                <span class="badge green no-dot" style="font-size:9.5px">Verified Buyer</span>
              </div>
              <span class="dim fs12">${r.date}</span>
            </div>
            <div class="mb8">${UI.stars(r.stars)}</div>
            <p class="muted fs13" style="line-height:1.5;">${UI.esc(r.text)}</p>
          </div>`).join("")
        : `<p class="dim fs13">No reviews yet for this seller. Be the first to review after purchase!</p>`;
    });

    // Write review button
    document.getElementById("writeReviewBtn").onclick = () => {
      UI.openModal(
        "✍️ Leave a Review",
        `<div style="display:grid; gap:14px;">
          <p class="muted">Share your experience buying from <b>${UI.esc(sellerName)}</b>:</p>
          <div class="field">
            <label>Rating (Stars)</label>
            <select class="select" id="revStars">
              <option value="5">⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
              <option value="4">⭐⭐⭐⭐ (4/5 Very Good)</option>
              <option value="3">⭐⭐⭐ (3/5 Average)</option>
              <option value="2">⭐⭐ (2/5 Poor)</option>
              <option value="1">⭐ (1/5 Bad)</option>
            </select>
          </div>
          <div class="field">
            <label>Your Review</label>
            <textarea class="textarea" id="revText" placeholder="How was the account quality? Did delivery take less than a minute?"></textarea>
          </div>
        </div>`,
        `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
         <button class="btn btn-primary" id="submitRevBtn">Post Review</button>`
      );

      document.getElementById("submitRevBtn").onclick = () => {
        const stars = Number(document.getElementById("revStars").value) || 5;
        const text = document.getElementById("revText").value.trim();
        if (!text) {
          UI.toast("Please enter your review text", "err");
          return;
        }
        API.addReview({ stars, text, targetName: sellerName, targetRole: "seller" }).then(() => {
          UI.closeModal();
          UI.toast("Review submitted! Thank you.");
          renderReviews(p);
        });
      };
    };
  }

  // ---------- Similar Products ----------
  function renderSimilar(p, cats) {
    API.getProducts({ categoryId: p.category }).then((list) => {
      const sim = list.filter((x) => x.id !== p.id).slice(0, 3);
      const container = document.getElementById("similarList");
      if (sim.length === 0) {
        container.innerHTML = `<p class="dim fs12">No other products in this category.</p>`;
        return;
      }
      container.innerHTML = sim.map((s) => `
        <a href="#/product?id=${s.id}" class="card" style="padding:10px 12px; display:flex; align-items:center; gap:12px; transition:border-color 0.2s;">
          <span style="font-size:24px">${s.emoji || "🤖"}</span>
          <div style="min-width:0; flex:1">
            <div style="font-weight:600; font-size:13px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${UI.esc(s.title)}</div>
            <div class="dim fs11">${s.stock} in stock</div>
          </div>
          <b style="color:var(--accent); font-size:14px">${UI.money(s.price)}</b>
        </a>`).join("");
    });
  }
}

Router.INIT["product"] = initProduct;

/* ---------- js/pages/dashboard.js ---------- */
/* Dashboard — stats, approval status, recent orders/txns */
function initDashboard() {
  Promise.all([API.getDashboard(), API.getMe()]).then(([d, me]) => {
    document.getElementById("greetTitle").textContent = `Dashboard — ${me.name.split(" ")[0]} 👋`;

    const stats = [
      { label: "Wallet Balance", value: UI.money(d.balance), trend: "+৳5,000 this week", up: true, ico: "green", icon: "wallet", href: "#/wallet" },
      { label: "Live Products", value: d.liveProducts, trend: `${d.pendingProducts} pending approval`, up: true, ico: "blue", icon: "box" },
      { label: "Total Sales", value: d.totalSales, trend: "+12 this month", up: true, ico: "violet", icon: "trendUp" },
      { label: "Seller Rating", value: d.rating.toFixed(1) + " ★", trend: `${d.ratingCount} reviews`, up: true, ico: "amber", icon: "star" },
      { label: "Orders (Buyer)", value: d.ordersAsBuyer, trend: "as customer", up: true, ico: "cyan", icon: "orders" },
      { label: "Orders (Seller)", value: d.ordersAsSeller, trend: "as vendor", up: true, ico: "red", icon: "receipt" }
    ];

    document.getElementById("dashStats").innerHTML = stats.map((s) => `
      <a class="card stat-card" href="${s.href || "javascript:void(0)"}" ${s.href ? "" : 'style="cursor:default"'}>
        <div class="label">${s.label}</div>
        <div class="value">${s.value}</div>
        <div class="trend ${s.up ? "up" : "down"}">${s.trend}</div>
        <span class="ico ${s.ico}">${UI.icon(s.icon)}</span>
      </a>`).join("");

    // orders table
    document.getElementById("dashOrders").innerHTML = `
      <tr><th>Order</th><th>Product</th><th>Role</th><th>Amount</th><th>Status</th></tr>
      ${d.recentOrders.map((o) => `
        <tr>
          <td class="mono t-main">${o.id}</td>
          <td>${UI.esc(o.product)}</td>
          <td><span class="badge ${o.role === "buyer" ? "cyan" : "violet"} no-dot">${o.role}</span></td>
          <td class="t-main">${UI.money(o.amount)}</td>
          <td>${UI.badge(o.status)}</td>
        </tr>`).join("")}`;

    // txn table
    document.getElementById("dashTxns").innerHTML = `
      <tr><th>Type</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr>
      ${d.recentTxns.map((t) => txnRow(t)).join("")}`;

    // approval funnel
    const pend = d.pendingProducts, live = d.liveProducts;
    document.getElementById("approvalBox").innerHTML = `
      <div class="steps">
        <div class="step done"><span class="dot">${UI.icon("check")}</span><div class="s-label">Submitted</div></div>
        <div class="step ${pend ? "cur" : "done"}"><span class="dot">${pend ? "…" : UI.icon("check")}</span><div class="s-label">Admin Review</div></div>
        <div class="step ${pend ? "" : "done"}"><span class="dot">${pend ? "🛒" : UI.icon("check")}</span><div class="s-label">Live</div></div>
      </div>
      <div class="flex ac jb mt16 fs13">
        <span class="muted"><b class="t-main">${pend}</b> product(s) waiting for admin approval</span>
        <a href="#/my-products" class="btn btn-ghost btn-sm">Review →</a>
      </div>
      ${pend ? `<div class="info-note mt8">${UI.icon("clock")} Pending listings won't appear in the marketplace until an admin approves them.</div>` : ""}`;

    // my recent listings mini rows
    const catNames = {};
    API.getCategories().then((cats) => {
      cats.forEach((c) => (catNames[c.id] = c.name));
      const dashProds = document.getElementById("dashProducts");
      if (dashProds) {
        dashProds.innerHTML = d.recentProducts.map((p) => `
          <a href="#/product?id=${p.id}" class="flex ac gap12" style="padding:10px; border-radius:10px; border:1px solid var(--border); background:var(--surface-2)">
            <span style="font-size:24px">${p.emoji}</span>
            <span style="min-width:0; flex:1">
              <span class="fs13 fw700" style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${UI.esc(p.title)}</span>
              <span class="fs12 dim">${UI.esc(catNames[p.category] || p.category)} · ${UI.money(p.price)}</span>
            </span>
            ${UI.badge(p.status)}
          </a>`).join("");
      }
    });

    // Render Seller Profiles Directory
    API.getSellers().then((sellers) => {
      const grid = document.getElementById("dashSellerGrid");
      if (!grid) return;
      if (!sellers.length) {
        grid.innerHTML = `<div class="empty" style="grid-column:1/-1;"><div class="e-ico">👥</div><h4>এখনো কোনো সেলার যোগ হয়নি</h4></div>`;
        return;
      }
      grid.innerHTML = sellers.map((s) => `
        <div class="seller-card">
          <div class="sc-head">
            ${UI.avatar(s.name, s.photo, "md")}
            <div style="min-width:0; flex:1;">
              <div class="flex ac gap6" style="flex-wrap:wrap;">
                <span class="sc-name">${UI.esc(s.name)}</span>
                ${s.verified ? '<span class="badge green no-dot" style="font-size:10px; padding:1px 6px;">✓ Verified</span>' : ''}
              </div>
              <div class="fs12 dim">@${UI.esc(s.username || 'seller')} · ${UI.esc(s.role || 'Vendor')}</div>
            </div>
            <div style="font-size:12px; color:var(--amber); font-weight:700;">${(s.rating || 5.0).toFixed(1)} ★</div>
          </div>
          
          <div class="sc-stats">
            <div class="stat-item">
              <span>মোট যোগ করেছে</span>
              <b style="color:var(--text);">${(s.totalAdded || 0).toLocaleString()} টি</b>
            </div>
            <div class="stat-item">
              <span>লাইভ স্টক এভেইলেবল</span>
              <b style="color:var(--green);">${(s.activeStock || 0).toLocaleString()} টি</b>
            </div>
            <div class="stat-item" style="margin-top:4px;">
              <span>সফল বিক্রি</span>
              <b style="color:var(--cyan);">${(s.soldCount || 0).toLocaleString()} টি</b>
            </div>
            <div class="stat-item" style="margin-top:4px;">
              <span>রেটিং ও ফিডব্যাক</span>
              <b style="color:var(--amber);">${(s.ratingCount || 100)} টি রিভিউ</b>
            </div>
          </div>

          <div class="flex gap8 mt6" style="margin-top:auto;">
            <a href="#/seller?seller=${encodeURIComponent(s.name)}" class="btn btn-outline btn-block btn-sm" style="font-weight:700;">
              👤 প্রোফাইল
            </a>
            <a href="#/seller?seller=${encodeURIComponent(s.name)}" class="btn btn-primary btn-block btn-sm" style="font-weight:800; background:linear-gradient(135deg, #ff1e42 0%, #e11d48 100%);">
              ⚡ স্টক থেকে কিনুন
            </a>
          </div>
        </div>
      `).join("");
    });
  });

  function txnRow(t) {
    const sign = t.type === "deposit" || t.type === "sale" ? "+" : "−";
    const cls = t.type === "deposit" || t.type === "sale" ? "pos" : "neg";
    return `<tr>
      <td><span class="badge ${t.type === "deposit" ? "green" : t.type === "withdraw" ? "red" : t.type === "purchase" ? "blue" : "violet"} no-dot">${t.type}</span></td>
      <td class="t-main">${UI.esc(t.method)}</td>
      <td class="amount ${cls}">${sign}${UI.money(t.amount)}</td>
      <td>${UI.badge(t.status)}</td>
      <td class="dim fs12">${t.date}</td>
    </tr>`;
  }
  window.__txnRow = txnRow;
}

Router.INIT["dashboard"] = initDashboard;

/* ---------- js/pages/add-product.js ---------- */
/* Add Product — Fast, Frictionless Seller Onboarding for Meta AI */
function initAddProduct() {
  const priceInput = document.getElementById("priceInput");
  const warrantyInput = document.getElementById("warrantyInput");
  const titleInput = document.getElementById("titleInput");
  const descArea = document.getElementById("descArea");
  const sellerNameInput = document.getElementById("sellerNameInput");
  const sellerWhatsappInput = document.getElementById("sellerWhatsappInput");
  const rawLogsArea = document.getElementById("rawLogsArea");
  const liveStockBadge = document.getElementById("liveStockBadge");
  const stockInput = document.getElementById("stockInput");
  const fileInput = document.getElementById("fileInput");
  const uploadFileBtn = document.getElementById("uploadFileBtn");
  const fileNameLabel = document.getElementById("fileNameLabel");
  const clearBtn = document.getElementById("clearBtn");
  const form = document.getElementById("productForm");
  const submitBtn = document.getElementById("submitBtn");

  const adminPassBox = document.getElementById("adminPassBox");
  const adminPasswordInput = document.getElementById("adminPasswordInput");
  const adminAuthStatus = document.getElementById("adminAuthStatus");

  // Load remembered seller info from localStorage
  const savedSellerName = localStorage.getItem("meta_ai_seller_name");
  const savedSellerWhatsapp = localStorage.getItem("meta_ai_seller_whatsapp");
  if (savedSellerName && sellerNameInput) {
    sellerNameInput.value = savedSellerName;
  }
  if (savedSellerWhatsapp && sellerWhatsappInput) {
    sellerWhatsappInput.value = savedSellerWhatsapp;
  }

  // ---------- Tier Selection Logic ----------
  const tierCards = document.querySelectorAll(".tier-card");

  function updateTierDetails() {
    if (!priceInput || !warrantyInput) return;
    const curTier = warrantyInput.value;
    const sellerName = (sellerNameInput && sellerNameInput.value.trim()) || "Seller";

    if (adminPassBox) {
      adminPassBox.style.display = curTier === "admin045" ? "block" : "none";
    }

    if (curTier === "noreplace") {
      if (titleInput) titleInput.value = `Meta AI Account 0.30 (No Replace / নো রিপ্লেস)`;
      if (descArea) {
        descArea.value = `100% Active Meta AI accounts with session cookies. সতর্কতা / WARNING: কেনার পর কোনো অ্যাকাউন্টে সমস্যা হলে বা ব্যান দিলে নো রিপ্লেস (Strictly No Replace)। নিজের দায়িত্বে কিনবেন।`;
      }
    } else if (curTier === "admin045") {
      if (titleInput) titleInput.value = `⭐ Admin Meta 0.45 (অ্যাডমিন স্পেশাল — শুধু অ্যাডমিন স্টক যোগ করতে পারবেন)`;
      if (descArea) {
        descArea.value = `👑 Admin Meta 0.45 Official Exclusive Pool: এই প্রোডাক্টে শুধুমাত্র অ্যাডমিন সরাসরি স্টক যোগ করতে পারবেন। ১০০% ফ্রেশ সেশন কুকিজ, প্রিমিয়াম আবাসিক আইপি এবং ইনস্ট্যান্ট অটো ডেলিভারি।`;
      }
      if (sellerNameInput && !sellerNameInput.value.trim()) {
        sellerNameInput.value = "Ratan Majumder (Admin)";
      }
    } else if (curTier === "horjin") {
      if (titleInput) titleInput.value = `Meta AI Horjin 0.45 (100% Original Residential IP — 24h Replacement Guarantee)`;
      if (descArea) {
        descArea.value = `100% Original / Horjin Meta AI accounts on clean residential IP. সর্বোচ্চ স্থায়িত্ব, জিরো চেকপয়েন্ট ও পারফেক্ট সেশন কুকিজ। 24-Hour Full Replacement Guarantee included.`;
      }
    } else {
      if (titleInput) titleInput.value = `Meta AI Account 0.40 (With Replace / ২৪ ঘণ্টা ফুল রিপ্লেস)`;
      if (descArea) {
        descArea.value = `100% Active Meta AI accounts with session cookies. ২৪ ঘণ্টা সম্পূর্ণ রিপ্লেসমেন্ট গ্যারান্টি (24-Hour Full Replacement Guarantee)। কোনো অ্যাকাউন্টে সমস্যা হলে সাথে সাথে নতুন আইডি রিপ্লেসমেন্ট দেওয়া হবে।`;
      }
    }
  }

  if (adminPasswordInput && adminAuthStatus) {
    adminPasswordInput.addEventListener("input", () => {
      const curAdminPass = (typeof API !== "undefined" && API.getAdminPassword) ? API.getAdminPassword() : (localStorage.getItem("rtn_admin_password") || "ratan2030");
      if (adminPasswordInput.value.trim() === curAdminPass) {
        adminAuthStatus.style.display = "inline-flex";
        adminAuthStatus.textContent = "✓ Admin Verified";
        adminAuthStatus.className = "badge green no-dot";
      } else if (adminPasswordInput.value.trim()) {
        adminAuthStatus.style.display = "inline-flex";
        adminAuthStatus.textContent = "✕ Wrong Password";
        adminAuthStatus.className = "badge red no-dot";
      } else {
        adminAuthStatus.style.display = "none";
      }
    });
  }

  tierCards.forEach((c) => {
    c.addEventListener("click", () => {
      tierCards.forEach((x) => {
        x.classList.remove("on");
        x.style.border = "1px solid var(--border)";
      });
      c.classList.add("on");
      c.style.border = "2px solid var(--meta-pink)";
      if (priceInput) priceInput.value = c.dataset.price;
      if (warrantyInput) warrantyInput.value = c.dataset.tier;
      updateTierDetails();
    });
  });

  // ---------- Live Accounts Counter ----------
  function countAccounts() {
    if (!rawLogsArea) return 0;
    const lines = rawLogsArea.value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);
    const count = lines.length;
    if (stockInput) stockInput.value = count;
    if (liveStockBadge) {
      if (count > 0) {
        liveStockBadge.innerHTML = `🟢 ${count} টি অ্যাকাউন্ট প্রস্তুত (Stock: ${count})`;
        liveStockBadge.className = "badge green no-dot";
      } else {
        liveStockBadge.innerHTML = `⚪ ০ টি অ্যাকাউন্ট প্রস্তুত (Stock: 0)`;
        liveStockBadge.className = "badge dim no-dot";
      }
    }
    return count;
  }

  if (rawLogsArea) {
    rawLogsArea.addEventListener("input", countAccounts);
  }

  // ---------- File Upload (.txt / .xlsx / .csv) ----------
  if (uploadFileBtn && fileInput) {
    uploadFileBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

      if (fileNameLabel) {
        fileNameLabel.innerHTML = `⏳ <b>${UI.esc(file.name)}</b> লোড হচ্ছে...`;
      }

      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      const reader = new FileReader();

      if (isExcel && window.XLSX) {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.SheetNames[0];
            const sheet = workbook.Sheets[firstSheet];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const lines = rows
              .map((r) =>
                Array.isArray(r)
                  ? r
                      .filter((val) => val !== null && val !== undefined && String(val).trim() !== "")
                      .join(" : ")
                      .trim()
                  : String(r).trim()
              )
              .filter((l) => l && l.length > 2);

            if (lines.length > 0) {
              const existing = rawLogsArea.value.trim();
              rawLogsArea.value = existing ? existing + "\n" + lines.join("\n") : lines.join("\n");
              const total = countAccounts();
              if (fileNameLabel) {
                fileNameLabel.innerHTML = `<span style="color:var(--green)">✓ ${file.name} (${lines.length} টি অ্যাকাউন্ট যুক্ত হয়েছে)</span>`;
              }
              UI.toast(`Excel import: ${lines.length} টি অ্যাকাউন্ট যুক্ত হয়েছে!`, "success");
            } else {
              UI.toast(`No valid account rows in ${file.name}`, "err");
            }
          } catch (err) {
            console.error("XLSX error:", err);
            UI.toast("এক্সেল ফাইল রিড করতে সমস্যা হয়েছে। দয়া করে .txt ফাইল ব্যবহার করুন।", "err");
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => {
          const text = e.target.result || "";
          const lines = text
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter((s) => s.length > 2);
          if (lines.length > 0) {
            const existing = rawLogsArea.value.trim();
            rawLogsArea.value = existing ? existing + "\n" + lines.join("\n") : lines.join("\n");
            const total = countAccounts();
            if (fileNameLabel) {
              fileNameLabel.innerHTML = `<span style="color:var(--green)">✓ ${file.name} (${lines.length} টি অ্যাকাউন্ট যুক্ত হয়েছে)</span>`;
            }
            UI.toast(`${lines.length} টি অ্যাকাউন্ট ফাইল থেকে লোড হয়েছে!`, "success");
          } else {
            UI.toast(`ফাইলে কোনো বৈধ অ্যাকাউন্ট পাওয়া যায়নি।`, "err");
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // ---------- Clear Button ----------
  if (clearBtn && form) {
    clearBtn.addEventListener("click", () => {
      form.reset();
      countAccounts();
      if (fileNameLabel) fileNameLabel.textContent = "কোনো ফাইল সিলেক্ট করা নেই";
    });
  }

  // ---------- Instant Live Form Submission ----------
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());

      const sellerName = (data.sellerName || "").trim();
      const sellerWhatsapp = (data.sellerWhatsapp || "").trim();

      if (!sellerName) {
        return UI.toast("দয়া করে আপনার সেলার বা শপের নাম লিখুন।", "err");
      }
      if (!sellerWhatsapp) {
        return UI.toast("দয়া করে আপনার হোয়াটসঅ্যাপ নাম্বার লিখুন।", "err");
      }

      // Save seller details for future 1-click publishing
      localStorage.setItem("meta_ai_seller_name", sellerName);
      localStorage.setItem("meta_ai_seller_whatsapp", sellerWhatsapp);

      const accountsCount = countAccounts();
      if (accountsCount === 0 && !data.stock) {
        return UI.toast("কমপক্ষে ১টি অ্যাকাউন্ট বা লগ পেস্ট করুন।", "err");
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `⏳ অনুমোদনের জন্য পাঠানো হচ্ছে...`;
      }

      // Create product (submits as pending for admin approval)
      API.createProduct(data)
        .then((p) => {
          form.reset();
          countAccounts();
          if (fileNameLabel) fileNameLabel.textContent = "কোনো ফাইল সিলেক্ট করা নেই";

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `📩 অ্যাডমিন অনুমোদনের জন্য পাঠান (Submit for Approval)`;
          }

          // Show Rich Approval Pending Modal
          UI.openModal(
            "⏳ পণ্য অনুমোদনের জন্য জমা হয়েছে!",
            `<div style="display:grid; gap:14px; text-align:left;">
              <div style="background:rgba(255,183,3,0.08); border:1px solid rgba(255,183,3,0.3); border-radius:12px; padding:16px;">
                <div class="flex ac gap10 mb10">
                  <span class="badge amber no-dot">⏳ PENDING ADMIN REVIEW</span>
                  <span class="badge green no-dot">✓ সফলভাবে জমা হয়েছে</span>
                </div>
                <h3 style="color:#fff; font-size:18px; margin:0 0 6px;">${UI.esc(p.title)}</h3>
                <p class="fs13 dim" style="margin:0;">আপনার দেওয়া অ্যাকাউন্ট/লগ অ্যাডমিন যাচাই করছেন। অ্যাডমিন অনুমোদন (Approve) করার সাথে সাথেই এটি মার্কেটপ্লেসে লাইভ হবে এবং ক্রেতারা কিনতে পারবে।</p>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:var(--surface-2); padding:14px; border-radius:10px; border:1px solid var(--border);">
                <div>
                  <div class="fs11 dim">সেলার নাম (Seller)</div>
                  <b style="color:var(--cyan); font-size:14px;">👤 ${UI.esc(p.seller?.name || sellerName)}</b>
                </div>
                <div>
                  <div class="fs11 dim">হোয়াটসঅ্যাপ (WhatsApp)</div>
                  <b style="color:#fff; font-size:14px;">💬 ${UI.esc(p.seller?.whatsapp || sellerWhatsapp)}</b>
                </div>
                <div class="mt6">
                  <div class="fs11 dim">অনুরোধকৃত রেট (Requested Price)</div>
                  <b style="color:var(--meta-pink); font-size:16px;">৳${p.price.toFixed(2)}</b>
                </div>
                <div class="mt6">
                  <div class="fs11 dim">জমা দেওয়া স্টক (Submitted Stock)</div>
                  <b style="color:var(--green); font-size:16px;">${p.stock} টি অ্যাকাউন্ট</b>
                </div>
              </div>

              <div class="fs12 dim" style="line-height:1.5;">
                💡 <b>পরামর্শ:</b> আপনার পণ্যের স্ট্যাটাস (Pending / Live / Rejected) দেখতে নিচে <b>"আমার পণ্যসমূহ দেখুন"</b> বাটনে যান।
              </div>
            </div>`,
            `<div class="flex gap10 w100" style="justify-content:flex-end;">
              <button class="btn btn-outline" onclick="UI.closeModal();">➕ আরও যোগ করুন</button>
              <a href="#/my-products" class="btn btn-primary" style="font-weight:700;">📦 আমার পণ্যসমূহ দেখুন (My Products)</a>
            </div>`
          );

          UI.toast("আপনার পণ্য সফলভাবে অ্যাডমিন অনুমোদনের জন্য জমা হয়েছে!", "info");
          document.dispatchEvent(new CustomEvent("products:updated"));
        })
        .catch((err) => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `📩 অ্যাডমিন অনুমোদনের জন্য পাঠান (Submit for Approval)`;
          }
          UI.toast(err.message || "পণ্য যোগ করতে সমস্যা হয়েছে।", "err");
        });
    });
  }

  // Initialize
  updateTierDetails();
  countAccounts();
}

Router.INIT["add-product"] = initAddProduct;

/* ---------- js/pages/my-products.js ---------- */
/* My Products — seller's own listings with approval-status tracking */
function initMyProducts() {
  const box = document.getElementById("productRows");
  const empty = document.getElementById("emptyRow");
  let mine = [], allProducts = [], cats = {}, status = "all", currentMe = null;
  let showAdminAll = false;

  function loadMyProducts() {
    Promise.all([API.getMe(), API.getCategories(), API.getProducts({ status: "all" })])
      .then(([me, catList, products]) => {
        currentMe = me;
        allProducts = products;
        catList.forEach((c) => (cats[c.id] = c));

        const savedName = (localStorage.getItem("meta_ai_seller_name") || "").trim().toLowerCase();
        const savedPhone = (localStorage.getItem("meta_ai_seller_whatsapp") || "").replace(/[^0-9]/g, "");
        const myPhone = (me.whatsapp || "").replace(/[^0-9]/g, "");
        const myName = (me.name || "").trim().toLowerCase();
        const isAdmin = me.isAdmin || sessionStorage.getItem("rtn_admin_auth") === "true";

        if (showAdminAll && isAdmin) {
          mine = products;
        } else {
          mine = products.filter((p) => {
            if (!p.seller) return true;
            const sName = (p.seller.name || "").trim().toLowerCase();
            const sPhone = (p.seller.whatsapp || "").replace(/[^0-9]/g, "");
            const pUserId = p.userId || p.seller.id;

            if (pUserId && me && pUserId === me.id) return true;
            if (sName === "you" || sName === "new user") return true;
            if (myName && myName !== "new user" && (sName === myName || sName.includes(myName) || myName.includes(sName))) return true;
            if (savedName && (sName === savedName || sName.includes(savedName) || savedName.includes(sName))) return true;
            if (myPhone && sPhone && (sPhone === myPhone || sPhone.endsWith(myPhone) || myPhone.endsWith(sPhone))) return true;
            if (savedPhone && sPhone && (sPhone === savedPhone || sPhone.endsWith(savedPhone) || savedPhone.endsWith(sPhone))) return true;
            return false;
          });

          // Smart fallback: If filter produced 0 but listings exist locally, show them so user never loses track
          if (mine.length === 0 && products.length > 0) {
            mine = products;
          }
        }

        document.getElementById("cAll").textContent = `(${mine.length})`;
        document.getElementById("cPend").textContent = `(${mine.filter((p) => p.status === "pending").length})`;
        document.getElementById("cLive").textContent = `(${mine.filter((p) => p.status === "live").length})`;
        document.getElementById("cRej").textContent = `(${mine.filter((p) => p.status === "rejected").length})`;
        render();
      });
  }

  loadMyProducts();

  // Cross-tab and live reactive updates
  window.addEventListener("storage", loadMyProducts);
  document.addEventListener("products:updated", loadMyProducts);

  document.getElementById("statusTabs")?.addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (!t) return;
    document.querySelectorAll("#statusTabs .tab").forEach((x) => x.classList.remove("on"));
    t.classList.add("on");
    status = t.dataset.status;
    render();
  });

  function render() {
    const list = mine.filter((p) => status === "all" || p.status === status);
    if (empty) empty.hidden = list.length > 0;
    if (!box) return;

    box.innerHTML = list.map((p) => {
      const c = cats[p.category] || { name: p.category, icon: "🤖" };
      const mediaThumb = p.image
        ? `<img src="${p.image}" style="width:58px; height:40px; border-radius:8px; object-fit:cover; border:1px solid var(--border);" alt="">`
        : `<span class="mp-emoji" style="font-size:32px;">${p.emoji || "🤖"}</span>`;
      const priceTxt = (p.price && p.price > 0) ? `<b style="color:var(--accent)">${UI.money(p.price)}</b>` : `<b style="color:var(--amber)">Rate: Set by Admin</b>`;

      const notifyAdminWa = `https://wa.me/8801609166109?text=${encodeURIComponent(`আসসালামু আলাইকুম অ্যাডমিন, আমি একটি নতুন প্রোডাক্ট জমা দিয়েছি (ID: ${p.id}, Title: ${p.title}, Stock: ${p.stock} টি)। দয়া করে অনুমোদন করুন।`)}`;

      return `
      <div class="card glow-card" style="padding:16px 20px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
        ${mediaThumb}
        <div style="flex:1; min-width:240px">
          <div class="flex ac gap8">
            <a class="mp-title" href="#/product?id=${p.id}" style="font-size:16px; font-weight:700; color:#fff;">${UI.esc(p.title)}</a>
            ${UI.badge(p.status)}
          </div>
          <div class="dim fs12" style="margin-top:6px">
            ${c.icon} ${UI.esc(c.name)} · ${priceTxt} · stock <b>${p.stock}</b> · ${p.sold || 0} sold · Seller: <b>${UI.esc(p.seller?.name || "You")}</b> · ID: <span class="mono">${p.id}</span>
            ${p.excelFiles?.length ? ` · 📊 ${p.excelFiles.length} Excel file(s)` : ""}
          </div>
          ${p.status === "rejected" && p.rejectReason ? `<div class="info-note mt8" style="background:rgba(239,68,68,0.1); color:var(--red); font-size:12px;">⚠️ Admin reason: ${UI.esc(p.rejectReason)}</div>` : ""}
          ${p.status === "pending" ? `
            <div class="flex ac gap10 mt8" style="flex-wrap:wrap;">
              <span class="dim fs12" style="color:var(--amber);">⏳ Awaiting Admin Approval & Price Setting — will go live once reviewed.</span>
              <a href="${notifyAdminWa}" target="_blank" class="badge green no-dot" style="font-size:11px; padding:2px 8px; text-decoration:none;">
                💬 অ্যাডমিনকে হোয়াটসঅ্যাপে জানান (Notify Admin)
              </a>
            </div>` : ""}
        </div>
        <div class="flex ac gap8" style="flex-wrap:wrap; justify-content:flex-end">
          ${p.status === "live" ? `<a class="btn btn-ghost btn-sm" href="#/product?id=${p.id}">${ICONS.eye} View</a>` : ""}
          <button class="btn btn-ghost btn-sm" data-del="${p.id}" title="Delete listing" style="color:var(--red);">${ICONS.trash}</button>
        </div>
      </div>`;
    }).join("");
  }

  box?.addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      const id = del.dataset.del;
      UI.confirmModal("Delete Listing?", `Product <b>${id}</b> will be permanently removed.`, () => {
        API.deleteProduct(id).then(() => {
          mine = mine.filter((p) => p.id !== id);
          UI.toast("Listing deleted.");
          loadMyProducts();
        });
      }, "Delete", true);
    }
  });
}

Router.INIT["my-products"] = initMyProducts;

/* ---------- js/pages/orders.js ---------- */
/* Orders — Buyer and Seller views with auto-delivered accounts & Excel logs inspection */
function initOrders() {
  const list = document.getElementById("orderList");
  const empty = document.getElementById("orderEmpty");
  let all = [];
  let role = "all", st = "";

  const PIPELINE = ["pending", "processing", "delivered"];

  API.getOrders("all").then((o) => {
    all = o;
    renderStats();
    renderOrders();
  });

  document.getElementById("roleTabs").addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (!t) return;
    document.querySelectorAll("#roleTabs .tab").forEach((x) => x.classList.remove("on"));
    t.classList.add("on");
    role = t.dataset.role;
    renderOrders();
  });

  document.getElementById("statusFilter").addEventListener("click", (e) => {
    const p = e.target.closest(".pill");
    if (!p) return;
    document.querySelectorAll("#statusFilter .pill").forEach((x) => x.classList.remove("on"));
    p.classList.add("on");
    st = p.dataset.s;
    renderOrders();
  });

  function renderStats() {
    const done = all.filter((o) => o.status === "delivered").length;
    const active = all.filter((o) => ["pending", "processing"].includes(o.status)).length;
    const spent = all.filter((o) => o.role === "buyer" && o.status !== "cancelled").reduce((a, o) => a + o.amount, 0);
    const earned = all.filter((o) => o.role === "seller").reduce((a, o) => a + o.amount, 0);

    document.getElementById("orderStats").innerHTML = [
      { l: "Total Orders", v: all.length, i: "orders", c: "blue" },
      { l: "In Progress", v: active, i: "clock", c: "amber" },
      { l: "Completed", v: done, i: "checkCircle", c: "green" },
      { l: "Lifetime Spent", v: UI.money(spent), i: "arrowUp", c: "accent" },
      { l: "Lifetime Earned", v: UI.money(earned), i: "arrowDown", c: "cyan" }
    ]
      .map(
        (s) => `
      <div class="card stat-card glow-card">
        <div class="label">${s.l}</div>
        <div class="value">${s.v}</div>
        <div class="sub">Escrow verified orders</div>
      </div>`
      )
      .join("");
  }

  function renderOrders() {
    const rows = all.filter((o) => (role === "all" || o.role === role) && (!st || o.status === st));
    empty.hidden = rows.length > 0;

    list.innerHTML = rows
      .map((o) => {
        const hasDeliveredItems = Array.isArray(o.deliveredItems) && o.deliveredItems.length > 0;
        const terminal = o.status === "cancelled" || o.status === "refunded";

        return `
      <div class="card glow-card" style="padding:20px; margin-bottom:16px;">
        <div class="flex jb ac" style="flex-wrap:wrap; gap:12px;">
          <div class="flex ac gap12" style="min-width:0">
            <span style="font-size:32px;">${o.role === "buyer" ? "🛍️" : "💼"}</span>
            <div style="min-width:0">
              <div class="fw700" style="font-size:16px; color:var(--text);">${UI.esc(o.product)}</div>
              <div class="dim fs12 mono mt4">
                ${o.id} · ${o.date} · 
                <span class="badge ${o.role === "buyer" ? "cyan" : "violet"} no-dot">${o.role.toUpperCase()}</span>
                ${o.quantity ? `· <b>${o.quantity} units</b>` : ""}
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <div class="fw700" style="font-size:18px; color:var(--accent);">${UI.money(o.amount)}</div>
            ${UI.badge(o.status)}
          </div>
        </div>

        ${
          terminal
            ? `<div class="info-note mt16" style="background:rgba(239,68,68,0.08); border-color:var(--red); color:var(--red);">
                ${o.status === "cancelled" ? "✖️ Order cancelled — held deposit was returned to buyer wallet." : "↩️ Refunded after dispute resolution."}
               </div>`
            : `<div class="steps" style="display:flex; justify-content:space-between; margin-top:18px; padding:12px 14px; background:var(--surface-2); border-radius:8px;">
                ${["Deposit Held", "Processing", "Delivered", "Reviewed"]
                  .map((label, i) => {
                    const doneTill = o.status === "delivered" ? 2 : o.status === "processing" ? 1 : 0;
                    const isDone = i <= doneTill;
                    return `
                    <div style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:${isDone ? "var(--green)" : "var(--text-3)"}">
                      <span style="display:inline-grid; place-items:center; width:20px; height:20px; border-radius:50%; background:${isDone ? "var(--green)" : "var(--surface-3)"}; color:#000; font-size:11px;">
                        ${isDone ? "✓" : i + 1}
                      </span>
                      <span>${label}</span>
                    </div>`;
                  })
                  .join("")}
              </div>`
        }

        ${
          hasDeliveredItems
            ? `<div class="mt16 delivery-box">
                <div class="flex jb ac mb8" style="flex-wrap:wrap; gap:8px;">
                  <div class="flex ac gap8">
                    <span class="delivery-live-tag"><span class="delivery-live-dot"></span> ⚡ Auto-Delivered</span>
                    <span class="fs12 fw700" style="color:#fff">Accounts / Logs (${o.deliveredItems.length} accounts):</span>
                  </div>
                  <div class="flex gap6" style="flex-wrap:wrap;">
                    <button class="btn btn-outline btn-sm dl-order-fmt" data-id="${o.id}" data-fmt="txt" title="Download Plain Text">📄 .TXT</button>
                    <button class="btn btn-outline btn-sm dl-order-fmt" data-id="${o.id}" data-fmt="csv" title="Download Comma-Separated Values">📊 .CSV</button>
                    <button class="btn btn-outline btn-sm dl-order-fmt" data-id="${o.id}" data-fmt="xlsx" style="color:var(--green); border-color:var(--green);" title="Download Excel Spreadsheet">📗 .XLSX</button>
                    <button class="btn btn-meta btn-sm copy-order-accs" data-id="${o.id}">${UI.icon("copy")} Copy All</button>
                  </div>
                </div>
                <pre class="mono" style="font-size:12px; color:#00e676; max-height:85px; overflow-y:auto; white-space:pre-wrap; background:#04060c; padding:10px; border-radius:6px;">${UI.esc(o.deliveredItems.slice(0, 5).join("\n"))}${o.deliveredItems.length > 5 ? `\n... (+${o.deliveredItems.length - 5} more accounts)` : ""}</pre>
              </div>`
            : ""
        }

        ${
          o.replacementItems && o.replacementItems.length > 0
            ? `<div class="mt12 delivery-box" style="border:1px solid rgba(0,230,118,0.4); background:rgba(0,230,118,0.04);">
                <div class="flex jb ac mb8" style="flex-wrap:wrap; gap:8px;">
                  <div class="flex ac gap8">
                    <span class="delivery-live-tag" style="background:rgba(0,230,118,0.2); color:#00e676;"><span class="delivery-live-dot" style="background:#00e676;"></span> 🔄 Replacement</span>
                    <span class="fs12 fw700" style="color:#00e676;">সেলার কর্তৃক প্রদত্ত নতুন রিপ্লেসমেন্ট অ্যাকাউন্ট (${o.replacementItems.length}টি):</span>
                  </div>
                  <button class="btn btn-meta btn-sm copy-repl-accs" data-id="${o.id}">${UI.icon("copy")} Copy Replacement</button>
                </div>
                <pre class="mono" style="font-size:12px; color:#00e676; max-height:85px; overflow-y:auto; white-space:pre-wrap; background:#04060c; padding:10px; border-radius:6px;">${UI.esc(o.replacementItems.join("\n"))}</pre>
              </div>`
            : ""
        }

        ${
          o.role === "seller" && o.reported
            ? `<div class="info-note mt14" style="background:rgba(255,30,66,0.12); border-color:var(--accent); color:#fff; border-radius:8px;">
                <div class="flex jb ac" style="flex-wrap:wrap; gap:8px;">
                  <div>
                    <b style="color:var(--accent);">⚠️ বায়ার নষ্ট মেইল রিপোর্ট করেছেন:</b> ${o.badEmails ? o.badEmails.length : 1}টি অ্যাকাউন্ট। স্ট্যাটাস: <b>${o.reportStatus === 'replaced' ? 'রিপ্লেসমেন্ট সম্পন্ন' : o.reportStatus === 'refunded' ? 'রিফান্ড সম্পন্ন' : 'অপেক্ষমান (Pending)'}</b>
                  </div>
                  <div class="flex gap6">
                    ${o.reportStatus !== 'replaced' && o.reportStatus !== 'refunded' ? `<button class="btn btn-primary btn-sm" data-act="seller-repl" data-id="${o.id}">🔄 রিপ্লেস দিন</button>` : ""}
                    <button class="btn btn-ghost btn-sm" data-act="view-report" data-id="${o.id}">রিপোর্ট বিবরণ</button>
                  </div>
                </div>
              </div>`
            : ""
        }

        <div class="flex jb ac mt16" style="border-top:1px solid var(--border); padding-top:14px; flex-wrap:wrap; gap:10px;">
          <span class="fs12 muted">
            ${o.role === "buyer" ? `Seller: <b class="t-main">${UI.esc(o.seller)}</b>` : `Buyer: <b class="t-main">${UI.esc(o.buyer)}</b>`}
            · Escrow Status: <b>${o.status === "delivered" ? "Funds Released" : "Held in Escrow"}</b>
          </span>
          <div class="flex gap8" style="flex-wrap:wrap;">
            ${o.role === "seller" && o.status === "pending" ? `<button class="btn btn-primary btn-sm" data-act="accept" data-id="${o.id}">Accept Order</button>` : ""}
            ${o.role === "seller" && o.status === "processing" ? `<button class="btn btn-success btn-sm" data-act="deliver" data-id="${o.id}">Mark Delivered</button>` : ""}
            ${o.role === "buyer" && o.status === "delivered" ? `<button class="btn btn-primary btn-sm" data-act="review" data-id="${o.id}">⭐ Leave Review</button>` : ""}
            
            ${
              o.role === "buyer" && (o.status === "delivered" || o.status === "processing")
                ? (o.reported
                    ? `<button class="btn btn-outline btn-sm" data-act="view-report" data-id="${o.id}" style="color:var(--amber); border-color:var(--amber);">⚠️ রিপোর্ট: ${o.reportStatus === 'refunded' ? 'রিফান্ড সম্পন্ন' : o.reportStatus === 'replaced' ? 'রিপ্লেস পাওয়া গেছে' : o.reportStatus === 'resolved' ? 'মীমাংসিত' : 'পর্যালোচনাধীন'}</button>`
                    : `<button class="btn btn-outline btn-sm" data-act="report-bad" data-id="${o.id}" style="color:var(--accent); border-color:var(--accent); font-weight:700;"><span style="font-size:13px;">🚩</span> নষ্ট মেইল রিপোর্ট</button>`)
                : ""
            }

            <a href="https://wa.me/8801609166109?text=Hello%20Support,%20regarding%20Order%20${o.id}" target="_blank" class="btn btn-outline btn-sm" style="color:var(--green); border-color:var(--green);">
              ${UI.icon("whatsapp")} WhatsApp Admin
            </a>
            <button class="btn btn-ghost btn-sm" data-act="details" data-id="${o.id}">Order Details</button>
          </div>
        </div>
      </div>`;
      })
      .join("");
  }

  list.addEventListener("click", (e) => {
    // Copy accounts from card
    const copyBtn = e.target.closest(".copy-order-accs");
    if (copyBtn) {
      const o = all.find((x) => x.id === copyBtn.dataset.id);
      if (o && o.deliveredItems) {
        UI.copyText(o.deliveredItems.join("\n"));
      }
      return;
    }

    // Copy replacement accounts
    const copyReplBtn = e.target.closest(".copy-repl-accs");
    if (copyReplBtn) {
      const o = all.find((x) => x.id === copyReplBtn.dataset.id);
      if (o && o.replacementItems) {
        UI.copyText(o.replacementItems.join("\n"));
      }
      return;
    }

    // Download accounts by format (txt, csv, xlsx)
    const dlFmt = e.target.closest(".dl-order-fmt");
    if (dlFmt) {
      const o = all.find((x) => x.id === dlFmt.dataset.id);
      if (o && o.deliveredItems) {
        UI.downloadAccounts(o, dlFmt.dataset.fmt);
      }
      return;
    }

    const b = e.target.closest("[data-act]");
    if (!b) return;
    const o = all.find((x) => x.id === b.dataset.id);
    if (!o) return;
    const act = b.dataset.act;

    if (act === "accept") {
      o.status = "processing";
      UI.toast(`Order ${o.id} accepted.`);
      renderOrders();
    }
    if (act === "deliver") {
      o.status = "delivered";
      UI.toast(`Order ${o.id} marked delivered.`);
      renderOrders();
    }
    if (act === "review") {
      UI.openModal(
        `⭐ Review Seller: ${UI.esc(o.seller)}`,
        `<div style="display:grid; gap:12px;">
          <div class="field">
            <label>Rating</label>
            <select class="select" id="orderRevStars">
              <option value="5">⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
              <option value="4">⭐⭐⭐⭐ (4/5 Very Good)</option>
              <option value="3">⭐⭐⭐ (3/5 Average)</option>
            </select>
          </div>
          <div class="field">
            <label>Review Comment</label>
            <textarea class="textarea" id="orderRevText" placeholder="Account works fine? Quick auto-delivery?"></textarea>
          </div>
        </div>`,
        `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
         <button class="btn btn-primary" id="submitOrderRevBtn">Submit Review</button>`
      );

      document.getElementById("submitOrderRevBtn").onclick = () => {
        const stars = Number(document.getElementById("orderRevStars").value) || 5;
        const text = document.getElementById("orderRevText").value.trim() || "Good service.";
        API.addReview({ stars, text, targetName: o.seller, targetRole: "seller" }).then(() => {
          UI.closeModal();
          UI.toast("Review submitted ⭐");
        });
      };
    }

    // Buyer Report Bad Mails
    if (act === "report-bad") {
      API.getMe().then((me) => {
        const defaultPhone = me?.whatsapp || "";
        UI.openModal(
          `🚩 নষ্ট মেইল রিপোর্ট — অর্ডার #${o.id}`,
          `<div style="display:grid; gap:12px;">
            <div style="background:var(--surface-2); padding:10px 12px; border-radius:8px; border:1px solid var(--border);">
              <div class="fs13">প্রোডাক্ট: <b>${UI.esc(o.product)}</b></div>
              <div class="fs12 dim">সেলার: <b>${UI.esc(o.seller)}</b> · ডেলিভারি মোট: <b>${o.deliveredItems ? o.deliveredItems.length : o.quantity || 1}টি অ্যাকাউন্ট</b></div>
            </div>

            <div class="field">
              <label class="fs12 fw700" style="color:var(--text);">নষ্ট / অকার্যকর মেইল তালিকা (প্রতি লাইনে একটি) <span class="req">*</span></label>
              <textarea class="textarea mono" id="repBadEmailsInput" rows="4" placeholder="example1@gmail.com:password&#10;example2@gmail.com:password" required style="font-size:12px;"></textarea>
              <span class="dim fs11">যে কয়টি মেইল লগইন হচ্ছে না বা নষ্ট, শুধু সেগুলো কপি করে পেস্ট করুন।</span>
            </div>

            <div class="field">
              <label class="fs12 fw700" style="color:var(--text);">সমস্যার ধরন (Problem Category) <span class="req">*</span></label>
              <select class="select" id="repReasonSelect">
                <option value="পাসওয়ার্ড ভুল / লগইন সমস্যা">পাসওয়ার্ড ভুল / লগইন সমস্যা (Invalid Password)</option>
                <option value="2FA কোড আসে না / সিকিউরিটি ইস্যু">2FA কোড আসে না / সিকিউরিটি ইস্যু (2FA / Security)</option>
                <option value="অ্যাকাউন্ট ডিজেবল / লকড">অ্যাকাউন্ট ডিজেবল / লকড (Disabled / Locked)</option>
                <option value="কুকিজ / সেশন এক্সপায়ারড">কুকিজ / সেশন এক্সপায়ারড (Expired Cookies)</option>
                <option value="অন্যান্য সমস্যা">অন্যান্য সমস্যা (Other Issue)</option>
              </select>
            </div>

            <div class="field">
              <label class="fs12 fw700" style="color:var(--text);">আপনার WhatsApp নাম্বার (রিপ্লেস পেতে) <span class="req">*</span></label>
              <input class="input" id="repPhoneInput" value="${UI.esc(defaultPhone)}" placeholder="01XXXXXXXXX" required>
            </div>

            <div class="field">
              <label class="fs12 fw700" style="color:var(--text);">বিস্তারিত বিবরণ (Details / Note)</label>
              <textarea class="textarea" id="repDetailsInput" rows="2" placeholder="মেইলে কি এরর দেখাচ্ছে সংক্ষেপে লিখুন..."></textarea>
            </div>
          </div>`,
          `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
           <button class="btn btn-primary" id="submitBadReportBtn" style="background:var(--accent); font-weight:800;">🚀 রিপোর্ট জমা দিন</button>`
        );

        document.getElementById("submitBadReportBtn").onclick = () => {
          const badText = document.getElementById("repBadEmailsInput").value.trim();
          const reason = document.getElementById("repReasonSelect").value;
          const buyerWhatsapp = document.getElementById("repPhoneInput").value.trim();
          const details = document.getElementById("repDetailsInput").value.trim();

          if (!badText) {
            UI.toast("অনুগ্রহ করে অন্তত ১টি নষ্ট মেইল বা অ্যাকাউন্ট লিখুন!", "error");
            return;
          }
          if (!buyerWhatsapp) {
            UI.toast("অনুগ্রহ করে আপনার WhatsApp নাম্বারটি দিন!", "error");
            return;
          }

          const badEmails = badText.split("\n").map((s) => s.trim()).filter(Boolean);

          API.submitReport({
            orderId: o.id,
            productId: o.productId || o.id,
            productTitle: o.product,
            sellerName: o.seller,
            buyerName: me?.name || "Buyer",
            buyerWhatsapp,
            badEmails,
            reason,
            details
          }).then((rep) => {
            UI.closeModal();
            UI.toast(`রিপোর্ট #${rep.id} সফলভাবে জমা হয়েছে! সেলার ও অ্যাডমিনকে জানানো হয়েছে।`, "ok");
            API.getOrders("all").then((fresh) => {
              all = fresh;
              renderStats();
              renderOrders();
            });
          });
        };
      });
    }

    // View Report Details
    if (act === "view-report") {
      API.getReports().then((reps) => {
        const rep = reps.find((r) => r.orderId === o.id || r.id === o.reportId);
        const badList = rep?.badEmails || o.badEmails || [];
        const replList = rep?.replacementItems || o.replacementItems || [];

        UI.openModal(
          `🚩 রিপোর্ট বিবরণ — অর্ডার #${o.id}`,
          `<div style="display:grid; gap:12px;">
            <div class="flex jb ac">
              <span class="fs13 dim">রিপোর্ট আইডি: <b>${rep ? rep.id : o.reportId || "—"}</b></span>
              <span class="badge ${o.reportStatus === 'refunded' ? 'cyan' : o.reportStatus === 'replaced' ? 'green' : o.reportStatus === 'resolved' ? 'green' : 'amber'} no-dot">স্ট্যাটাস: ${o.reportStatus || 'Pending'}</span>
            </div>

            <div style="background:var(--surface-2); padding:10px 12px; border-radius:8px; border:1px solid var(--border);">
              <div class="fs13">প্রোডাক্ট: <b>${UI.esc(o.product)}</b></div>
              <div class="fs12 dim">সেলার: <b>${UI.esc(o.seller)}</b> · বায়ার: <b>${UI.esc(o.buyer)}</b></div>
              ${rep?.reason ? `<div class="fs12 mt4" style="color:var(--accent);">কারণ: <b>${UI.esc(rep.reason)}</b></div>` : ""}
              ${rep?.details ? `<div class="fs12 dim mt2">বিবরণ: ${UI.esc(rep.details)}</div>` : ""}
            </div>

            <div class="field">
              <label class="fs12 fw700" style="color:var(--red);">রিপোর্টকৃত নষ্ট মেইলসমূহ (${badList.length}টি):</label>
              <pre class="mono" style="font-size:12px; color:#ff4060; background:#070a14; padding:10px; border-radius:6px; max-height:90px; overflow-y:auto;">${UI.esc(badList.join("\n") || "কোন মেইল নেই")}</pre>
            </div>

            ${
              replList.length > 0
                ? `<div class="field">
                    <label class="fs12 fw700" style="color:var(--green);">প্রদত্ত রিপ্লেসমেন্ট অ্যাকাউন্ট (${replList.length}টি):</label>
                    <pre class="mono" style="font-size:12px; color:#00e676; background:#070a14; padding:10px; border-radius:6px; max-height:90px; overflow-y:auto;">${UI.esc(replList.join("\n"))}</pre>
                   </div>`
                : ""
            }

            ${
              o.role === "seller" && o.reportStatus !== "replaced" && o.reportStatus !== "refunded"
                ? `<div class="mt8">
                    <button class="btn btn-primary btn-sm w-100" id="modalGiveReplBtn">🔄 এখন রিপ্লেসমেন্ট মেইল দিন</button>
                   </div>`
                : ""
            }
          </div>`,
          `<button class="btn btn-primary" onclick="UI.closeModal()">ঠিক আছে (Close)</button>`
        );

        const giveBtn = document.getElementById("modalGiveReplBtn");
        if (giveBtn) {
          giveBtn.onclick = () => {
            UI.closeModal();
            triggerSellerReplacement(o);
          };
        }
      });
    }

    // Seller Give Replacement
    if (act === "seller-repl") {
      triggerSellerReplacement(o);
    }

    if (act === "details") {
      const accList = (o.deliveredItems || []).join("\n");
      UI.openModal(
        `Order Details — ${o.id}`,
        `<div style="display:grid; gap:10px;">
          <div class="flex jb"><span>Product:</span><b class="t-main">${UI.esc(o.product)}</b></div>
          <div class="flex jb"><span>Role:</span><b>${o.role.toUpperCase()}</b></div>
          <div class="flex jb"><span>Amount:</span><b style="color:var(--accent)">${UI.money(o.amount)}</b></div>
          <div class="flex jb"><span>Status:</span>${UI.badge(o.status)}</div>
          <div class="flex jb"><span>Date:</span><b>${o.date}</b></div>
          ${
            accList
              ? `<div class="mt12">
                  <div class="flex jb ac mb4">
                    <label>Delivered Credentials (${o.deliveredItems.length}):</label>
                    <button class="btn btn-outline btn-sm" onclick="UI.copyText(document.getElementById('modalAccText').value)">Copy</button>
                  </div>
                  <textarea class="textarea mono" style="font-size:12px; height:100px;" readonly id="modalAccText">${UI.esc(accList)}</textarea>
                 </div>`
              : ""
          }
        </div>`
      );
    }
  });

  function triggerSellerReplacement(o) {
    API.getReports().then((reps) => {
      const rep = reps.find((r) => r.orderId === o.id || r.id === o.reportId);
      const badList = rep?.badEmails || o.badEmails || [];

      UI.openModal(
        `🔄 রিপ্লেসমেন্ট প্রদান — অর্ডার #${o.id}`,
        `<div style="display:grid; gap:12px;">
          <div style="background:var(--surface-2); padding:10px 12px; border-radius:8px; border:1px solid var(--border);">
            <div class="fs13">বায়ার: <b>${UI.esc(o.buyer)}</b> (${o.buyerWhatsapp || 'WhatsApp'})</div>
            <div class="fs12 dim">প্রোডাক্ট: <b>${UI.esc(o.product)}</b></div>
          </div>

          <div class="field">
            <label class="fs12 fw700" style="color:var(--red);">বায়ারের রিপোর্টকৃত নষ্ট মেইল (${badList.length}টি):</label>
            <pre class="mono" style="font-size:11px; color:#ff4060; background:#070a14; padding:8px; border-radius:6px; max-height:75px; overflow-y:auto;">${UI.esc(badList.join("\n") || "মেইল তালিকা পাওয়া যায়নি")}</pre>
          </div>

          <div class="field">
            <label class="fs12 fw700" style="color:var(--green);">নতুন সচল রিপ্লেসমেন্ট অ্যাকাউন্ট (প্রতি লাইনে একটি) <span class="req">*</span></label>
            <textarea class="textarea mono" id="replInputAccs" rows="4" placeholder="freshmail1@gmail.com:password&#10;freshmail2@gmail.com:password" required style="font-size:12px;"></textarea>
            <span class="dim fs11">বায়ার তৎক্ষণাৎ তার অর্ডারে এই রিপ্লেসমেন্ট মেইলগুলো দেখতে পাবেন।</span>
          </div>
        </div>`,
        `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
         <button class="btn btn-success" id="submitReplBtn" style="font-weight:800;">✓ রিপ্লেসমেন্ট পাঠিয়ে দিন</button>`
      );

      document.getElementById("submitReplBtn").onclick = () => {
        const text = document.getElementById("replInputAccs").value.trim();
        if (!text) {
          UI.toast("অন্তত ১টি রিপ্লেসমেন্ট মেইল বা অ্যাকাউন্ট লিখুন!", "error");
          return;
        }
        const accs = text.split("\n").map((s) => s.trim()).filter(Boolean);
        const repId = rep?.id || o.reportId;

        if (!repId) {
          UI.toast("রিপোর্ট আইডি পাওয়া যায়নি!", "error");
          return;
        }

        API.sendReportReplacement(repId, accs).then((res) => {
          UI.closeModal();
          UI.toast(`সফলভাবে ${res.count}টি রিপ্লেসমেন্ট বায়ারের কাছে পাঠানো হয়েছে!`, "ok");
          API.getOrders("all").then((fresh) => {
            all = fresh;
            renderStats();
            renderOrders();
          });
        }).catch((err) => {
          UI.toast(err.message, "error");
        });
      };
    });
  }
}

Router.INIT["orders"] = initOrders;

/* ---------- js/pages/wallet.js ---------- */
/* Wallet — Deposit (DP) & Withdraw flows with exact platform numbers */
function initWallet() {
  const METHODS = [
    {
      id: "bKash",
      badge: "bk",
      label: "bKash",
      fee: 0.015,
      type: "Personal (Send Money)",
      platform: "01609166109",
      hint: "Send Money to Personal bKash: 01609166109"
    },
    {
      id: "Nagad",
      badge: "ng",
      label: "Nagad",
      fee: 0.015,
      type: "Personal (Send Money)",
      platform: "01620576996",
      hint: "Send Money to Personal Nagad: 01620576996"
    },
    {
      id: "Binance Pay",
      badge: "bn",
      label: "Binance",
      fee: 0.0,
      type: "Binance Pay ID",
      platform: "1271861063",
      hint: "Binance Pay ID: 1271861063 or USDT TRC20"
    }
  ];

  let wallet, me;
  let payoutNum = {};
  let depSel = "bKash", wdSel = "bKash";

  Promise.all([API.getWallet(), API.getMe(), API.getTransactions()]).then(([w, u, txns]) => {
    wallet = w;
    me = u;
    payoutNum = {
      "bKash": u.bkash || "01609166109",
      "Nagad": u.nagad || "01620576996",
      "Binance Pay": u.binance || "1271861063"
    };

    renderHero();
    renderMethods();
    renderHistory(txns);

    // Deep link tab handler (?tab=withdraw or ?tab=deposit)
    const t = new URLSearchParams(Router.queryStr()).get("tab");
    if (t) {
      const btn = document.querySelector(`#walletTabs [data-tab="${t}"]`);
      btn?.click();
    }
  });

  function renderHero() {
    const totalEarned = wallet.totalEarned || 0;
    document.getElementById("walletHero").innerHTML = `
      <div class="flex jb ac" style="flex-wrap:wrap; gap:16px;">
        <div>
          <div class="wallet-label">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00e676; box-shadow:0 0 8px #00e676;"></span>
            ACTIVE WALLET BALANCE (DP)
          </div>
          <div class="w-amount">
            ${UI.money(wallet.balance)} <small>BDT</small>
          </div>
          <div class="wallet-stats-row">
            <span>💰 Sales Earned: <b class="text-earned">${UI.money(totalEarned)}</b></span>
            <span>·</span>
            <span>⏳ Pending Withdraw: <b class="text-pending">${UI.money(wallet.pendingWithdraw || 0)}</b></span>
            <span>·</span>
            <span>Min DP: <b style="color:#38bdf8;">৳50</b></span>
            <span>·</span>
            <span>Min Withdraw: <b style="color:#38bdf8;">৳50</b></span>
          </div>
        </div>
        <div class="w-btns">
          <button class="btn btn-primary" data-goto="deposit">↓ Add Deposit</button>
          <button class="btn btn-outline" data-goto="withdraw">↑ Withdraw</button>
        </div>
      </div>`;

    document.querySelectorAll("[data-goto]").forEach((b) => {
      b.onclick = () => document.querySelector(`#walletTabs [data-tab="${b.dataset.goto}"]`)?.click();
    });
  }

  function getMethodLogo(mId) {
    if (mId === "bKash") {
      return `<img src="assets/bkash.png" alt="bKash" class="payment-method-img" style="height:32px; max-width:85px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(255,30,66,0.25));">`;
    }
    if (mId === "Nagad") {
      return `<img src="assets/nagad.png" alt="Nagad" class="payment-method-img" style="height:32px; max-width:85px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(249,115,22,0.25));">`;
    }
    return `<img src="assets/binance.png" alt="Binance" class="payment-method-img" style="height:32px; max-width:85px; object-fit:contain; filter:drop-shadow(0 2px 6px rgba(234,179,8,0.25));">`;
  }

  function card(m, selected) {
    const isBk = m.id === "bKash";
    const isNg = m.id === "Nagad";
    const accentColor = isBk ? "#ff1e42" : isNg ? "#f97316" : "#eab308";
    return `
      <div class="method-card ${selected ? "on" : ""}" data-m="${m.id}" style="${selected ? `border-color:${accentColor} !important; box-shadow:0 0 16px ${isBk ? 'rgba(255,30,66,0.2)' : isNg ? 'rgba(249,115,22,0.2)' : 'rgba(234,179,8,0.2)'};` : ''}">
        <div class="method-logo-wrap" style="height:42px; display:flex; align-items:center; justify-content:center; margin-bottom:6px;">
          ${getMethodLogo(m.id)}
        </div>
        <div class="m-name" style="${selected ? `color:${accentColor} !important; font-weight:800;` : 'font-weight:700;'}">${m.label}</div>
        <div class="m-fee">${m.type}</div>
      </div>`;
  }

  function renderMethods() {
    const dep = document.getElementById("depMethods");
    const wd = document.getElementById("wdMethods");
    dep.innerHTML = METHODS.map((m) => card(m, m.id === depSel)).join("");
    wd.innerHTML = METHODS.map((m) => card(m, m.id === wdSel)).join("");

    dep.onclick = (e) => {
      const c = e.target.closest(".method-card");
      if (c) {
        depSel = c.dataset.m;
        renderMethods();
        updatePlatformBox();
      }
    };

    wd.onclick = (e) => {
      const c = e.target.closest(".method-card");
      if (c) {
        wdSel = c.dataset.m;
        renderMethods();
        updateWdCalc();
      }
    };

    updatePlatformBox();
    updateWdCalc();
  }

  function updatePlatformBox() {
    const m = METHODS.find((x) => x.id === depSel) || METHODS[0];
    const el = document.getElementById("platformNo");
    el.innerHTML = `
      <div class="flex ac gap14" style="flex-wrap:wrap">
        <div style="background:var(--surface-2); padding:8px 14px; border-radius:12px; border:1px solid var(--border); display:flex; align-items:center; justify-content:center;">
          ${getMethodLogo(m.id)}
        </div>
        <div>
          <div class="dim fs11 text-uppercase" style="letter-spacing:1px; color:#94a3b8;">Official Platform ${m.label} Number:</div>
          <div class="platform-val">${m.platform}</div>
          <div class="fs12" style="color:#cbd5e1; margin-top:2px;">${m.hint || m.type}</div>
        </div>
      </div>
      <button class="copy-btn btn" data-copy="${m.platform}" title="Copy Number">
        ${UI.icon("copy")} Copy Number
      </button>`;

    el.querySelector("[data-copy]").onclick = () => UI.copyText(m.platform);
  }

  function updateWdCalc() {
    const m = METHODS.find((x) => x.id === wdSel) || METHODS[0];
    const amt = Number(document.getElementById("wdAmount").value) || 0;
    const fee = Number((amt * m.fee).toFixed(2));
    const net = Math.max(0, Number((amt - fee).toFixed(2)));

    const numInput = document.getElementById("wdTargetNumber");
    if (numInput && !numInput.dataset.manual) {
      numInput.value = payoutNum[wdSel] || "";
    }

    document.getElementById("wdCalc").innerHTML = `
      <div class="flex jb mb8 fs13"><span>Payout Method:</span><b class="t-main">${m.label} (${m.type})</b></div>
      <div class="flex jb mb8 fs13"><span>Service Fee (${(m.fee * 100).toFixed(1)}%):</span><b>${UI.money(fee)}</b></div>
      <div class="flex jb fs14" style="border-top:1px solid var(--border); padding-top:8px;">
        <span>Net Amount you will receive:</span>
        <b style="color:var(--green); font-size:16px;">${UI.money(net)}</b>
      </div>`;
  }

  // Target number manual input flag
  document.getElementById("wdTargetNumber")?.addEventListener("input", function () {
    this.dataset.manual = "true";
  });

  document.getElementById("wdAmount")?.addEventListener("input", updateWdCalc);

  // Deposit Presets
  document.getElementById("depPresets")?.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b && b.dataset.v) {
      document.getElementById("depAmount").value = b.dataset.v;
    }
  });

  // Tab switching
  const tabs = document.querySelectorAll("#walletTabs .tab");
  const panels = {
    deposit: document.getElementById("panel-deposit"),
    withdraw: document.getElementById("panel-withdraw"),
    history: document.getElementById("panel-history")
  };

  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove("on"));
      tab.classList.add("on");
      const name = tab.dataset.tab;
      Object.entries(panels).forEach(([k, el]) => {
        if (el) el.hidden = k !== name;
      });
    };
  });

  // ---------- Submit Deposit ----------
  document.getElementById("depBtn").onclick = () => {
    const amt = Number(document.getElementById("depAmount").value);
    const ref = document.getElementById("depRef").value.trim();
    const sender = document.getElementById("depSender").value.trim();

    if (!amt || amt < 50) {
      return UI.toast("Minimum deposit amount is ৳50", "err");
    }
    if (!ref) {
      return UI.toast("Please enter your transaction TrxID", "err");
    }

    const btn = document.getElementById("depBtn");
    btn.disabled = true;
    btn.textContent = "Submitting Deposit…";

    API.createDeposit({ method: depSel, number: sender, amount: amt, ref })
      .then((txn) => {
        btn.disabled = false;
        btn.textContent = "Submit Deposit for Approval";
        document.getElementById("depAmount").value = "";
        document.getElementById("depRef").value = "";
        document.getElementById("depSender").value = "";

        UI.openModal(
          "✅ Deposit Request Submitted",
          `<div style="display:grid; gap:12px;">
            <p class="muted">Your deposit of <b style="color:var(--green); font-size:16px;">${UI.money(amt)}</b> via <b>${depSel}</b> (TrxID: <b class="mono">${UI.esc(ref)}</b>) has been submitted.</p>
            <div style="background:var(--surface-2); padding:12px; border-radius:8px; border:1px solid var(--border);">
              <div class="flex jb"><span>Status:</span><span class="badge amber no-dot">⏳ Pending Admin Verification</span></div>
              <div class="flex jb mt8 fs12 dim"><span>Platform Verification:</span><b>01609166109 / 01620576996</b></div>
            </div>
            <p class="fs12 dim">Admin will verify your payment and credit your wallet shortly.</p>
          </div>`,
          `<button class="btn btn-primary" onclick="UI.closeModal(); Router.rerender();">Done</button>`
        );
        UI.toast("Deposit submitted for approval!");
      })
      .catch((err) => {
        btn.disabled = false;
        btn.textContent = "Submit Deposit for Approval";
        UI.toast(err.message, "err");
      });
  };

  // ---------- Submit Withdrawal ----------
  document.getElementById("wdBtn").onclick = () => {
    const amt = Number(document.getElementById("wdAmount").value);
    const targetNo = document.getElementById("wdTargetNumber").value.trim();

    if (!amt || amt < 50) {
      return UI.toast("Minimum withdrawal amount is ৳50", "err");
    }
    if (amt > wallet.balance) {
      return UI.toast("Amount exceeds your available balance", "err");
    }
    if (!targetNo) {
      return UI.toast("Please enter your payout destination number", "err");
    }

    const btn = document.getElementById("wdBtn");
    btn.disabled = true;
    btn.textContent = "Submitting Request…";

    API.createWithdraw({ method: wdSel, number: targetNo, amount: amt })
      .then((txn) => {
        btn.disabled = false;
        btn.textContent = "Submit Withdrawal Request";
        document.getElementById("wdAmount").value = "";

        UI.openModal(
          "✅ Withdrawal Request Submitted",
          `<div style="display:grid; gap:12px;">
            <p class="muted">Withdrawal request of <b style="color:var(--accent); font-size:16px;">${UI.money(amt)}</b> to <b class="mono">${UI.esc(targetNo)}</b> (${wdSel}) is created.</p>
            <div style="background:var(--surface-2); padding:12px; border-radius:8px; border:1px solid var(--border);">
              <div class="flex jb"><span>Status:</span><span class="badge amber no-dot">⏳ Pending Payout</span></div>
              <div class="flex jb mt8 fs12 dim"><span>Held from Balance:</span><b>${UI.money(amt)}</b></div>
            </div>
            <p class="fs12 dim">Admin manual payout will be sent to your mobile account within 1-4 hours.</p>
          </div>`,
          `<button class="btn btn-primary" onclick="UI.closeModal(); Router.rerender();">Done</button>`
        );
        UI.toast("Withdrawal request created!");
      })
      .catch((err) => {
        btn.disabled = false;
        btn.textContent = "Submit Withdrawal Request";
        UI.toast(err.message, "err");
      });
  };

  // ---------- History Table ----------
  function renderHistory(txns) {
    const table = document.getElementById("histTable");
    if (!txns.length) {
      table.innerHTML = `<tr><td colspan="6" class="dim" style="text-align:center; padding:24px;">No wallet transactions yet</td></tr>`;
      return;
    }
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th><th>Type</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${txns.map((t) => {
          const isCredit = t.type === "deposit" || t.type === "sale";
          const typeLabel = t.type === "sale" ? "💰 Sale (বিক্রয়)" : t.type === "deposit" ? "📥 Deposit" : t.type === "withdraw" ? "📤 Withdraw" : t.type;
          const typeColor = t.type === "sale" ? "var(--green)" : t.type === "deposit" ? "var(--green)" : t.type === "withdraw" ? "var(--accent)" : "var(--text)";
          return `
          <tr>
            <td class="mono fs12">${t.id}</td>
            <td><b style="color:${typeColor}">${typeLabel}</b></td>
            <td>${UI.esc(t.method)}</td>
            <td class="fw700" style="color:${isCredit ? "var(--green)" : "var(--accent)"}; font-size:14px;">
              ${isCredit ? "+" : "-"}${UI.money(t.amount)}
            </td>
            <td>${UI.badge(t.status)}</td>
            <td class="dim fs12">${t.date}</td>
          </tr>`;
        }).join("")}
      </tbody>`;
  }
}

Router.INIT["wallet"] = initWallet;

/* ---------- js/pages/transactions.js ---------- */
/* Transactions — full ledger with type filter */
function initTransactions() {
  const table = document.getElementById("txnTable");
  let all = [], filter = "";

  API.getTransactions().then((t) => { all = t; stats(); render(); });

  document.getElementById("txnFilter").addEventListener("click", (e) => {
    const p = e.target.closest(".pill"); if (!p) return;
    document.querySelectorAll("#txnFilter .pill").forEach((x) => x.classList.remove("on"));
    p.classList.add("on"); filter = p.dataset.t; render();
  });

  function stats() {
    const sum = (type) => all.filter((t) => t.type === type && t.status === "success").reduce((a, t) => a + t.amount, 0);
    const pend = all.filter((t) => t.status === "pending").length;
    document.getElementById("txnStats").innerHTML = [
      { l: "Total Deposited", v: UI.money(sum("deposit")), i: "arrowDown", c: "green" },
      { l: "Total Withdrawn", v: UI.money(sum("withdraw")), i: "arrowUp", c: "red" },
      { l: "Total Purchases", v: UI.money(sum("purchase")), i: "orders", c: "blue" },
      { l: "Sales Income", v: UI.money(sum("sale")), i: "trendUp", c: "violet" },
      { l: "Pending Items", v: pend, i: "clock", c: "amber" }
    ].map((s) => `
      <div class="card stat-card"><div class="label">${s.l}</div><div class="value">${s.v}</div>
      <span class="ico ${s.c}">${UI.icon(s.i)}</span></div>`).join("");
  }

  function render() {
    const rows = all.filter((t) => !filter || t.type === filter);
    const typeColor = { deposit: "green", withdraw: "red", purchase: "blue", sale: "violet" };
    table.innerHTML = `
      <tr><th>TXN ID</th><th>Type</th><th>Method</th><th>From/To</th><th>Amount</th><th>Status</th><th>Date</th><th>Ref</th></tr>
      ${rows.map((t) => {
        const pos = t.type === "deposit" || t.type === "sale";
        return `<tr>
          <td class="mono t-main">${t.id}</td>
          <td><span class="badge ${typeColor[t.type]} no-dot">${t.type}</span></td>
          <td class="t-main">${UI.esc(t.method)}</td>
          <td class="dim fs12">${UI.esc(t.number)}</td>
          <td class="amount ${pos ? "pos" : "neg"}">${pos ? "+" : "−"}${UI.money(t.amount)}</td>
          <td>${UI.badge(t.status)}</td>
          <td class="dim fs12">${t.date}</td>
          <td class="mono fs12">${UI.esc(t.ref)}</td>
        </tr>`;
      }).join("") || `<tr><td colspan="8"><div class="empty"><div class="e-ico">🧾</div><h4>No transactions</h4></div></td></tr>`}`;
  }
}

Router.INIT["transactions"] = initTransactions;

/* ---------- js/pages/profile.js ---------- */
/* Profile — view/edit name, WhatsApp, bKash, Nagad, Binance, photo + my reviews */
function initProfile() {
  let me;

  API.getMe().then((u) => { me = u; hero(); initForm(); reviews(); disputes(); });

  function hero() {
    document.getElementById("profileHero").innerHTML = `
      <div class="ph-avatar">
        ${UI.avatar(me.name, me.photo, "lg")}
        <label class="cam" title="Change profile picture">${ICONS.camera}
          <input type="file" id="photoInput" accept="image/*" hidden>
        </label>
      </div>
      <div class="ph-info">
        <h2>${UI.esc(me.name)} ${me.verified ? '<span class="badge green">✓ Verified</span>' : ""} <span class="badge cyan no-dot">${me.role || "Member"}</span></h2>
        <div class="ph-sub">@${UI.esc(me.username || "user")} · Member since ${me.memberSince || "2026-10-05"}</div>
        <div class="mt8">${UI.stars(me.rating || 5.0, (me.ratingCount || 0) + " reviews")}</div>
        <div class="ph-stats">
          <div><span>Sales</span><b>${me.salesCount || 0}</b></div>
          <div><span>Rating</span><b>${(me.rating || 5.0).toFixed(1)} ★</b></div>
          <div><span>Reviews</span><b>${me.ratingCount || 0}</b></div>
          <div><span>Wallet</span><b id="heroBal">—</b></div>
        </div>
      </div>`;
    API.getWallet().then((w) => (document.getElementById("heroBal").textContent = UI.money(w.balance)));

    // photo upload (instant local preview & save)
    document.getElementById("photoInput").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) return UI.toast("Please choose an image file.", "err");
      const rd = new FileReader();
      rd.onload = () => {
        API.updateProfile({ photo: rd.result }).then((updatedUser) => {
          me = updatedUser;
          UI.toast("Profile picture updated!");
          document.dispatchEvent(new Event("profile:updated"));
          hero();
        });
      };
      rd.readAsDataURL(f);
    });
  }

  function initForm() {
    const form = document.getElementById("profileForm");
    if (!form) return;

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v || "";
    };

    set("fName", me.name);
    set("fUser", me.username);
    set("fBkash", me.bkash);
    set("fNagad", me.nagad);
    set("fBinance", me.binance);
    set("fWa", me.whatsapp);

    form.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById("fName").value.trim();
      const username = document.getElementById("fUser").value.trim() || me.username;
      const bkash = document.getElementById("fBkash").value.trim();
      const nagad = document.getElementById("fNagad").value.trim();
      const binance = document.getElementById("fBinance").value.trim();
      const whatsapp = document.getElementById("fWa").value.trim();

      if (name.length < 2) return UI.toast("দয়া করে একটি সঠিক নাম লিখুন।", "err");

      const btn = document.getElementById("saveProfileBtn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "সেভ হচ্ছে...";
      }

      API.updateProfile({
        name,
        username,
        bkash,
        nagad,
        binance,
        whatsapp
      }).then((updatedUser) => {
        me = updatedUser;
        if (btn) {
          btn.disabled = false;
          btn.textContent = "💾 তথ্য সেভ করুন (Save Details)";
        }
        UI.toast("প্রোফাইল তথ্য সফলভাবে সেভ হয়েছে! (পেমেন্ট তথ্য গোপন ও সুরক্ষিত)", "success");
        document.dispatchEvent(new Event("profile:updated"));
        hero();
      }).catch((err) => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "💾 তথ্য সেভ করুন (Save Details)";
        }
        UI.toast(err.message || "সমস্যা হয়েছে।", "err");
      });
    };
  }

  function reviews() {
    API.getReviews("You").then((list) => {
      const avg = list.length ? list.reduce((a, r) => a + r.stars, 0) / list.length : me.rating;
      const dist = [5, 4, 3, 2, 1].map((n) => list.filter((r) => r.stars === n).length);
      const total = Math.max(list.length, 1);
      document.getElementById("myReviewSummary").innerHTML = `
        <div class="review-score">
          <div class="big">${avg.toFixed(1)}</div>
          <div>${UI.stars(avg)}</div>
          <div class="dim fs12 mt8">${me.ratingCount} total</div>
        </div>
        <div class="review-bars">
          ${dist.map((c, i) => `<div class="rbar-row"><span>${5 - i}★</span><div class="rbar"><i style="width:${(c / total) * 100}%"></i></div><span>${c}</span></div>`).join("")}
        </div>`;
      document.getElementById("myReviewList").innerHTML = list.length
        ? list.map((r) => `
          <div class="review-item">
            <div class="r-head">
              ${UI.avatar(r.from, null, "sm")}
              <div><div class="r-name">${UI.esc(r.from)}</div>
                <span class="badge ${r.role === "buyer" ? "cyan" : "violet"} no-dot r-role">${r.role} ${r.forBuyer === "You" ? "→ reviewing you as buyer" : "→ reviewing you as seller"}</span></div>
              <span class="r-date">${UI.stars(r.stars)} · ${r.date}</span>
            </div>
            <div class="r-text">${UI.esc(r.text)}</div>
          </div>`).join("")
        : `<div class="empty"><div class="e-ico">⭐</div><h4>No reviews yet</h4><p>Complete orders to earn reviews.</p></div>`;
    });
  }

  function disputes() {
    const listEl = document.getElementById("myDisputesList");
    const badgeEl = document.getElementById("myDisputesBadge");
    if (!listEl) return;

    API.getReports().then((reports) => {
      const myReports = (reports || []).filter((r) => {
        const s = (r.sellerName || r.targetSeller || "").toLowerCase();
        const mName = (me?.name || "").toLowerCase();
        const mUser = (me?.username || "").toLowerCase();
        return s === mName || s === mUser || s === "you" || s.includes(mName);
      });

      const pendingCount = myReports.filter((r) => r.status === "pending").length;
      if (badgeEl) {
        badgeEl.textContent = `${pendingCount} টি পেন্ডিং রিপোর্ট`;
        badgeEl.className = pendingCount > 0 ? "badge red no-dot" : "badge green no-dot";
      }

      if (!myReports.length) {
        listEl.innerHTML = `
          <div class="empty" style="padding:24px 16px; text-align:center;">
            <div class="e-ico">🛡️</div>
            <h4>কোন বায়ার রিপোর্ট নেই</h4>
            <p class="dim fs13">আপনার বিক্রিত সকল অর্ডারের অ্যাকাউন্ট নিরাপদ ও সঠিক আছে।</p>
          </div>`;
        return;
      }

      listEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${myReports.map((r) => {
            const badList = r.badEmails || [];
            const isDone = r.status === "replaced" || r.status === "refunded" || r.status === "resolved";

            return `
            <div class="card" style="padding:14px; background:var(--surface-2); border:1px solid ${r.status === 'pending' ? 'rgba(255,30,66,0.35)' : 'var(--border)'}; border-radius:10px;">
              <div class="flex jb ac mb8" style="flex-wrap:wrap; gap:8px;">
                <div>
                  <b class="fs14 t-main">অর্ডার #${r.orderId || "—"}</b> · <span class="fs12 dim">${UI.esc(r.productTitle || "Product")}</span>
                </div>
                <span class="badge ${r.status === 'refunded' ? 'cyan' : r.status === 'replaced' ? 'green' : r.status === 'resolved' ? 'green' : 'red'} no-dot">
                  ${r.status === 'refunded' ? 'রিফান্ড সম্পন্ন' : r.status === 'replaced' ? 'রিপ্লেসমেন্ট সম্পন্ন' : r.status === 'resolved' ? 'মীমাংসিত' : 'অপেক্ষমান (Pending)'}
                </span>
              </div>

              <div class="fs12 mb6">
                বায়ার: <b>${UI.esc(r.buyerName || r.reporterName || "Buyer")}</b>
                ${r.buyerWhatsapp ? `· WhatsApp: <a href="https://wa.me/${r.buyerWhatsapp.replace(/[^0-9]/g, '')}" target="_blank" style="color:var(--green); font-weight:700;">${r.buyerWhatsapp}</a>` : ""}
                · তারিখ: <span class="dim">${r.date || "Just now"}</span>
              </div>

              <div class="fs12 mb8" style="color:var(--accent);">
                সমস্যা: <b>${UI.esc(r.reason || "নষ্ট মেইল")}</b>
                ${r.details ? `<div class="dim mt2">বিবরণ: ${UI.esc(r.details)}</div>` : ""}
              </div>

              <div class="field mb8">
                <label class="fs11 fw700" style="color:var(--red);">নষ্ট মেইলসমূহ (${badList.length}টি):</label>
                <pre class="mono" style="font-size:11.5px; color:#ff4060; background:#070a14; padding:8px 10px; border-radius:6px; max-height:80px; overflow-y:auto; margin:0;">${UI.esc(badList.join("\n") || "মেইল পাওয়া যায়নি")}</pre>
              </div>

              ${
                r.replacementItems && r.replacementItems.length
                  ? `<div class="field mb8">
                      <label class="fs11 fw700" style="color:var(--green);">আপনার প্রদত্ত রিপ্লেসমেন্ট (${r.replacementItems.length}টি):</label>
                      <pre class="mono" style="font-size:11.5px; color:#00e676; background:#070a14; padding:8px 10px; border-radius:6px; max-height:80px; overflow-y:auto; margin:0;">${UI.esc(r.replacementItems.join("\n"))}</pre>
                     </div>`
                  : ""
              }

              <div class="flex jb ac mt10 pt8" style="border-top:1px solid var(--border); flex-wrap:wrap; gap:8px;">
                <span class="fs11 dim">রিপোর্ট আইডি: #${r.id}</span>
                <div class="flex gap6">
                  ${
                    !isDone
                      ? `<button class="btn btn-primary btn-xs profile-repl-btn" data-id="${r.id}" data-order="${r.orderId}">🔄 রিপ্লেস দিন</button>`
                      : ""
                  }
                  ${
                    r.buyerWhatsapp
                      ? `<a href="https://wa.me/${r.buyerWhatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(r.buyerName || '')},%20regarding%20Order%20${r.orderId}%20report" target="_blank" class="btn btn-outline btn-xs" style="color:var(--green); border-color:var(--green);">
                          💬 WhatsApp
                         </a>`
                      : ""
                  }
                </div>
              </div>
            </div>`;
          }).join("")}
        </div>`;

      listEl.querySelectorAll(".profile-repl-btn").forEach((btn) => {
        btn.onclick = () => {
          const repId = btn.dataset.id;
          const r = myReports.find((x) => x.id === repId);
          if (!r) return;

          UI.openModal(
            `🔄 বায়ারকে রিপ্লেসমেন্ট প্রদান — অর্ডার #${r.orderId}`,
            `<div style="display:grid; gap:12px;">
              <div class="fs13">বায়ার: <b>${UI.esc(r.buyerName || "Buyer")}</b> (${r.buyerWhatsapp || 'WhatsApp'})</div>
              <div class="field">
                <label class="fs12 fw700" style="color:var(--green);">নতুন সচল রিপ্লেসমেন্ট অ্যাকাউন্ট (প্রতি লাইনে একটি) <span class="req">*</span></label>
                <textarea class="textarea mono" id="profReplAccs" rows="4" placeholder="fresh1@gmail.com:password&#10;fresh2@gmail.com:password" required style="font-size:12px;"></textarea>
                <span class="dim fs11">বায়ারের অ্যাকাউন্টে তৎক্ষণাৎ এই রিপ্লেসমেন্ট মেইলটি পৌঁছে যাবে।</span>
              </div>
            </div>`,
            `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
             <button class="btn btn-success" id="profSubmitReplBtn" style="font-weight:800;">✓ রিপ্লেসমেন্ট পাঠিয়ে দিন</button>`
          );

          document.getElementById("profSubmitReplBtn").onclick = () => {
            const text = document.getElementById("profReplAccs").value.trim();
            if (!text) {
              UI.toast("অনুগ্রহ করে অন্তত ১টি রিপ্লেসমেন্ট মেইল লিখুন!", "error");
              return;
            }
            const accs = text.split("\n").map((s) => s.trim()).filter(Boolean);
            API.sendReportReplacement(r.id, accs).then((res) => {
              UI.closeModal();
              UI.toast(`সফলভাবে ${res.count}টি রিপ্লেসমেন্ট প্রদান করা হয়েছে!`, "ok");
              disputes();
            }).catch((err) => {
              UI.toast(err.message, "error");
            });
          };
        };
      });
    });
  }
}

Router.INIT["profile"] = initProfile;

/* ---------- js/pages/seller.js ---------- */
/* Seller Storefront — view seller profile, accounts added, & direct purchase */
function initSeller() {
  const params = new URLSearchParams(Router.queryStr());
  const sellerQuery = (params.get("name") || params.get("seller") || "").trim();
  const heroEl = document.getElementById("sellerHeroBody");
  const catalogEl = document.getElementById("sellerCatalog");
  const emptyEl = document.getElementById("sellerEmptyState");
  const countEl = document.getElementById("sellerProductCount");
  const titleEl = document.getElementById("sellerStoreTitle");

  const dirView = document.getElementById("sellerDirectoryView");
  const detailView = document.getElementById("sellerDetailView");
  const allGrid = document.getElementById("allSellersGrid");

  if (!sellerQuery) {
    if (dirView) dirView.style.display = "block";
    if (detailView) detailView.style.display = "none";
    document.title = "Verified Seller Profiles — RTN Marketplace";
    loadAllSellers();
    return;
  } else {
    if (dirView) dirView.style.display = "none";
    if (detailView) detailView.style.display = "block";
  }

  function loadAllSellers() {
    API.getSellers().then((sellers) => {
      if (!allGrid) return;
      if (!sellers.length) {
        allGrid.innerHTML = `<div class="empty" style="grid-column:1/-1;"><div class="e-ico">👥</div><h4>এখনো কোনো সেলার যোগ হয়নি</h4></div>`;
        return;
      }
      allGrid.innerHTML = sellers.map((s) => `
        <div class="seller-card">
          <div class="sc-head">
            ${UI.avatar(s.name, s.photo, "md")}
            <div style="min-width:0; flex:1;">
              <div class="flex ac gap6" style="flex-wrap:wrap;">
                <span class="sc-name">${UI.esc(s.name)}</span>
                ${s.verified ? '<span class="badge green no-dot" style="font-size:10px; padding:1px 6px;">✓ Verified</span>' : ''}
              </div>
              <div class="fs12 dim">@${UI.esc(s.username || 'seller')} · ${UI.esc(s.role || 'Vendor')}</div>
            </div>
            <div style="font-size:12px; color:var(--amber); font-weight:700;">${(s.rating || 5.0).toFixed(1)} ★</div>
          </div>
          
          <div class="sc-stats">
            <div class="stat-item">
              <span>মোট যোগ করেছে</span>
              <b style="color:var(--text);">${(s.totalAdded || 0).toLocaleString()} টি</b>
            </div>
            <div class="stat-item">
              <span>লাইভ স্টক এভেইলেবল</span>
              <b style="color:var(--green);">${(s.activeStock || 0).toLocaleString()} টি</b>
            </div>
            <div class="stat-item" style="margin-top:4px;">
              <span>সফল বিক্রি</span>
              <b style="color:var(--cyan);">${(s.soldCount || 0).toLocaleString()} টি</b>
            </div>
            <div class="stat-item" style="margin-top:4px;">
              <span>রেটিং ও ফিডব্যাক</span>
              <b style="color:var(--amber);">${(s.ratingCount || 100)} টি রিভিউ</b>
            </div>
          </div>

          <div class="flex gap8 mt12" style="margin-top:auto;">
            <a href="#/seller?seller=${encodeURIComponent(s.name)}" class="btn btn-outline btn-block btn-sm" style="font-weight:700;">
              👤 প্রোফাইল
            </a>
            <a href="#/seller?seller=${encodeURIComponent(s.name)}" class="btn btn-primary btn-block btn-sm" style="font-weight:800; background:linear-gradient(135deg, #ff1e42 0%, #e11d48 100%);">
              ⚡ স্টক থেকে কিনুন
            </a>
          </div>
        </div>
      `).join("");
    });
  }

  function loadSellerStore() {
    API.getSellerDetail(sellerQuery).then((res) => {
      if (!res || !res.seller) {
        location.href = "#/";
        return;
      }

      const seller = res.seller;
      const inventory = res.inventory || [];

      if (titleEl) titleEl.textContent = `${seller.name} — সেলার ইনভেন্টরি ও প্রোডাক্ট তালিকা`;
      document.title = `${seller.name} — RTN Marketplace Store`;

      // Render High-Contrast Hero Card
      heroEl.innerHTML = `
        <div class="profile-hero flex ac gap20" style="flex-wrap:wrap; background:linear-gradient(135deg, #0d1222 0%, #151d38 100%) !important; border-radius:16px; padding:20px; border:1px solid rgba(255,255,255,0.12);">
          <div style="position:relative;">
            ${UI.avatar(seller.name, seller.photo, "lg")}
            <div style="position:absolute; bottom:-4px; right:-4px; width:18px; height:18px; border-radius:50%; background:#00ff88; border:2px solid #060913;" title="Online"></div>
          </div>
          <div style="flex:1; min-width:240px;">
            <div class="flex ac gap10 mb4" style="flex-wrap:wrap;">
              <h1 style="font-size:24px; font-weight:900; margin:0; color:#ffffff !important; letter-spacing:-0.02em;">${UI.esc(seller.name)}</h1>
              ${seller.verified ? '<span class="badge green no-dot" style="font-size:11px; font-weight:800;">✓ VERIFIED SELLER</span>' : ''}
              ${seller.isOfficial ? '<span class="badge cyan no-dot" style="font-size:11px; font-weight:800;">OFFICIAL ADMIN</span>' : ''}
            </div>
            <div class="flex ac gap10 mb8">
              ${UI.stars(seller.rating || 5.0, (seller.ratingCount || 100) + " reviews")}
              <span class="fs12" style="color:#94a3b8 !important;">· মেম্বার: ${seller.memberSince || '2026-01-15'}</span>
            </div>
            <div class="fs13" style="color:#cbd5e1 !important; line-height:1.5;">
              ${UI.esc(seller.bio || `${seller.name} এর ভেরিফায়েড Meta AI স্টক পুল। অটো ডেলিভারি ও ফুল রিপ্লেস গ্যারান্টি।`)}
            </div>
            <div class="mt10 flex ac gap8 flex-wrap">
              ${seller.isOfficial ? `
                <a href="https://wa.me/8801609166109" target="_blank" class="btn btn-outline btn-sm" style="background:rgba(37,211,102,0.1); border-color:#25d366; color:#25d366 !important;">
                  💬 Admin WhatsApp: 01609166109
                </a>
              ` : `
                <span class="badge green no-dot flex ac gap6" style="padding:6px 12px; font-size:12px;">
                  🛡️ প্রাইভেসী সুরক্ষিত সেলার (Privacy Protected)
                </span>
                <a href="https://wa.me/8801609166109" target="_blank" class="btn btn-outline btn-sm" style="color:var(--text-2); text-decoration:none;">
                  💬 RTN Admin সাপোর্ট
                </a>
              `}
              <button type="button" class="btn btn-outline btn-sm" style="color:var(--red); border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" onclick="window.__reportSeller('${UI.esc(seller.name)}')">
                🚩 রিপোর্ট করুন (Report Seller)
              </button>
            </div>
          </div>

          <!-- Dynamic Seller Stats Boxes -->
          <div class="flex gap12" style="flex-wrap:wrap; margin-left:auto;">
            <div class="profile-hero-stat">
              <div class="lbl">মোট যোগ করেছে</div>
              <div class="val" style="color:#38bdf8 !important;">${(seller.totalAdded || 0).toLocaleString()}</div>
            </div>
            <div class="profile-hero-stat">
              <div class="lbl">বর্তমান লাইভ স্টক</div>
              <div class="val" style="color:#00ff88 !important;">${(seller.activeStock || 0).toLocaleString()}</div>
            </div>
            <div class="profile-hero-stat">
              <div class="lbl">মোট বিক্রি হয়েছে</div>
              <div class="val" style="color:#fbbf24 !important;">${(seller.soldCount || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      `;

      // Check if seller is banned
      if (seller.isBanned) {
        if (catalogEl) {
          catalogEl.innerHTML = `
            <div class="card p24 text-center" style="grid-column:1/-1; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:14px;">
              <div style="font-size:36px; margin-bottom:8px;">🚫</div>
              <h3 style="color:var(--red); margin:0 0 8px;">এই সেলার অ্যাকাউন্টটি এডমিন কর্তৃক ব্যান/স্থগিত করা হয়েছে</h3>
              <p class="fs13 dim" style="max-width:500px; margin:0 auto;">এই সেলারের বিরুদ্ধে নীতি লঙ্ঘন বা বায়ার রিপোর্টের প্রেক্ষিতে অ্যাকাউন্টটি স্থগিত রাখা হয়েছে। এখান থেকে আর কোনো কেনাকাটা করা যাবে না।</p>
            </div>
          `;
        }
        if (countEl) countEl.textContent = "অ্যাকাউন্ট স্থগিত (Account Banned)";
        if (emptyEl) emptyEl.hidden = true;
        return;
      }

      // Check if zero stock
      if (inventory.length === 0 || (seller.activeStock <= 0 && !seller.isOfficial)) {
        if (emptyEl) emptyEl.hidden = false;
        if (catalogEl) {
          catalogEl.innerHTML = `
            <div class="card p24 text-center" style="grid-column:1/-1; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:14px;">
              <div style="font-size:36px; margin-bottom:8px;">📦</div>
              <h3 style="color:var(--amber); margin:0 0 8px;">বর্তমানে এই সেলারের কোনো সক্রিয় স্টক নেই</h3>
              <p class="fs13 dim" style="max-width:480px; margin:0 auto;">সেলার এখনো নতুন কোনো পণ্য যোগ করেননি অথবা তার বর্তমান স্টক শেষ হয়ে গেছে। নতুন স্টক যোগ হলে স্বয়ংক্রিয়ভাবে এখানে লাইভ দেখা যাবে।</p>
            </div>
          `;
        }
        if (countEl) countEl.textContent = "০ টি পণ্য উপলব্ধ (Out of Stock)";
        return;
      }

      if (emptyEl) emptyEl.hidden = true;
      if (countEl) countEl.textContent = `${inventory.length} টি প্রোডাক্টে এই সেলারের সক্রিয় স্টক রয়েছে`;

      catalogEl.innerHTML = inventory
        .map((item, idx) => {
          const p = item.product;
          const sStock = item.sellerStock;
          const uPrice = item.unitPrice || p.price;
          return `
            <div class="card glow-card product-card" style="padding:20px; display:flex; flex-direction:column; justify-content:space-between; border-radius:14px; background:var(--surface-2); border:1px solid var(--border);">
              <div>
                <div class="flex jb ac mb10">
                  <span class="delivery-live-tag"><span class="delivery-live-dot"></span> LIVE STOCK</span>
                  <span class="badge blue no-dot">৳${uPrice.toFixed(2)} / unit</span>
                </div>

                <div class="flex ac gap12 mb12">
                  <div style="width:48px; height:48px; border-radius:12px; background:rgba(255,255,255,0.05); display:grid; place-items:center; overflow:hidden; flex-shrink:0;">
                    <img src="${p.image || 'assets/meta-ai-030.svg'}" alt="${UI.esc(p.title)}" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='assets/meta-ai-logo.png'">
                  </div>
                  <div>
                    <h3 style="font-size:16px; font-weight:800; color:#fff; margin:0 0 4px; line-height:1.3;">${UI.esc(p.title)}</h3>
                    <div class="fs12" style="color:var(--cyan);">👤 সেলার: <b>${UI.esc(seller.name)}</b></div>
                  </div>
                </div>

                <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:12px; margin-bottom:14px; border:1px solid var(--border);">
                  <div class="flex jb ac mb6">
                    <span class="fs12 dim">এই সেলারের স্টক (Seller's Stock):</span>
                    <b style="color:var(--green); font-size:14px;">🟢 ${sStock.toLocaleString()} টি অ্যাকাউন্ট</b>
                  </div>
                  <div class="flex jb ac">
                    <span class="fs12 dim">মার্কেটপ্লেস মোট স্টক:</span>
                    <span class="fs12" style="color:#cbd5e1;">${p.stock.toLocaleString()} টি</span>
                  </div>
                </div>

                <p class="fs12 dim mb14" style="line-height:1.5;">${UI.esc(p.description || '')}</p>
              </div>

              <div>
                <!-- Quantity & Buy Form -->
                <div class="flex ac gap8 mb10">
                  <label class="fs12 dim" style="white-space:nowrap;">পরিমাণ:</label>
                  <input type="number" id="qty_${idx}" class="input" value="1" min="1" max="${sStock}" style="text-align:center; font-weight:700; width:80px; padding:6px;">
                  <button type="button" class="btn btn-meta btn-sm flex-1" style="font-weight:800;" onclick="window.__buyDirectFromSeller('${p.id}', '${idx}', '${UI.esc(seller.name)}')">
                    ⚡ এই সেলার থেকে কিনুন
                  </button>
                </div>

                <div class="flex jb ac">
                  <a href="#/product?id=${p.id}" class="fs12" style="color:var(--text-2); text-decoration:underline;">
                    🌐 ব্রাউজ প্রোডাক্ট থেকে দেখুন
                  </a>
                  <span class="fs11 dim">অটো ডেলিভারি</span>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    });
  }

  // Direct purchase handler from seller storefront
  window.__buyDirectFromSeller = function (productId, idx, sellerName) {
    const qtyInput = document.getElementById("qty_" + idx);
    const qty = parseInt(qtyInput ? qtyInput.value : "1", 10) || 1;

    UI.openModal(
      "🛒 অর্ডার কনফার্মেশন",
      `<div style="text-align:center; padding:10px 0;">
        <div style="font-size:36px; margin-bottom:10px;">⚡</div>
        <h3 style="color:#fff; margin-bottom:6px;">সরাসরি সেলার "${UI.esc(sellerName)}" থেকে কিনবেন?</h3>
        <p class="fs13 dim mb16">পরিমাণ: <b>${qty} টি</b> Meta AI অ্যাকাউন্ট। অর্ডার কনফার্ম করলে তাৎক্ষণিকভাবে আপনার অ্যাকাউন্ট ডেলিভারি করা হবে।</p>
        <div class="flex gap10 jc">
          <button class="btn btn-outline" onclick="UI.closeModal();">বাতিল (Cancel)</button>
          <button class="btn btn-meta" id="confirmSellerBuyBtn">হ্যাঁ, অর্ডার কনফার্ম করুন</button>
        </div>
      </div>`
    );

    setTimeout(() => {
      const confirmBtn = document.getElementById("confirmSellerBuyBtn");
      if (confirmBtn) {
        confirmBtn.onclick = function () {
          confirmBtn.disabled = true;
          confirmBtn.textContent = "ডেলিভারি হচ্ছে...";

          API.purchaseProduct({ productId, quantity: qty, sellerName })
            .then((res) => {
              UI.closeModal();
              loadSellerStore();

              // Show Delivered Credentials Modal
              const accounts = res.order?.deliveredItems || [];
              const rawText = accounts.join("\n");

              UI.openModal(
                "🎉 অ্যাকাউন্ট সফলভাবে ডেলিভারি হয়েছে!",
                `<div style="display:grid; gap:12px; text-align:left;">
                  <div class="badge green no-dot mb6">✓ অটো ডেলিভারি সফল (${accounts.length} টি অ্যাকাউন্ট)</div>
                  <p class="fs13 dim">সেলার: <b>${UI.esc(sellerName)}</b> · নিচের বক্স থেকে আপনার ডেলিভারিকৃত অ্যাকাউন্ট ও কুকিজ কপি করুন:</p>
                  <textarea id="sellerDeliveredBox" class="textarea mono delivered-credentials-box" style="height:140px; font-size:12px;" readonly>${UI.esc(rawText)}</textarea>
                  <div class="flex gap10">
                    <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('sellerDeliveredBox').value); UI.toast('সবগুলো অ্যাকাউন্ট কপি করা হয়েছে!', 'success');">📋 কপি করুন (Copy All)</button>
                    <a href="#/orders" class="btn btn-meta btn-sm" style="font-weight:700;">আমার অর্ডার দেখুন</a>
                  </div>
                </div>`
              );
            })
            .catch((err) => {
              confirmBtn.disabled = false;
              confirmBtn.textContent = "হ্যাঁ, অর্ডার কনফার্ম করুন";
              UI.toast(err.message || "অর্ডার সম্পন্ন হতে ব্যর্থ হয়েছে।", "err");
            });
        };
      }
    }, 100);
  };

  loadSellerStore();
}

Router.INIT["seller"] = initSeller;

/* ---------- js/pages/admin.js ---------- */
/* Admin Control Center — Dynamic Password Protected */
function initAdmin() {
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
        let defImg = fixImg(p.image) || "assets/meta-ai-red.svg";
        const tLower = p.title.toLowerCase();
        if (tLower.includes("0.30") || tLower.includes("no replace")) {
          defPrice = 0.30;
          defImg = "assets/meta-ai-amber.svg";
        } else if (tLower.includes("0.50") || tLower.includes("horjin") || tLower.includes("origin")) {
          defPrice = 0.50;
          defImg = "assets/meta-ai-emerald.svg";
        } else if (tLower.includes("facebook") || tLower.includes("aged")) {
          defPrice = 65.0;
          defImg = "assets/facebook-aged.svg";
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
                  <button type="button" class="btn btn-ghost btn-sm set-i-val" data-target="img_${p.id}" data-prev="prev_${p.id}" data-src="assets/meta-ai-red.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,30,66,0.15); border:1px solid rgba(255,30,66,0.4);">🔴 Red 0.45</button>
                  <button type="button" class="btn btn-ghost btn-sm set-i-val" data-target="img_${p.id}" data-prev="prev_${p.id}" data-src="assets/meta-ai-amber.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,183,3,0.15); border:1px solid rgba(255,183,3,0.4);">🟡 Amber 0.30</button>
                  <button type="button" class="btn btn-ghost btn-sm set-i-val" data-target="img_${p.id}" data-prev="prev_${p.id}" data-src="assets/meta-ai-emerald.svg" style="font-size:11px; padding:4px 8px; background:rgba(0,245,212,0.15); border:1px solid rgba(0,245,212,0.4);">🟢 Horjin 0.50</button>
                  <button type="button" class="btn btn-ghost btn-sm set-i-val" data-target="img_${p.id}" data-prev="prev_${p.id}" data-src="assets/facebook-aged.svg" style="font-size:11px; padding:4px 8px; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.4);">🔵 FB Aged</button>
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
                <label class="fs12 fw700">Price per unit (৳) — (যেমন: 0.45, 0.30, 0.50) <span class="req">*</span></label>
                <input class="input" type="number" step="0.01" id="newAdminProdPrice" value="0.45" required style="font-weight:700; color:var(--accent);">
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
                  <option value="No Replace (০.৩০ রেট)">No Replace</option>
                </select>
              </div>
            </div>

            <!-- Banner Selection -->
            <div class="field">
              <label class="fs12 fw700">Product Banner / Image</label>
              <input type="hidden" id="newAdminProdImage" value="assets/meta-ai-045.svg">
              <div class="flex gap6 mb8" style="flex-wrap:wrap;">
                <button type="button" class="btn btn-ghost btn-sm set-new-img" data-src="assets/meta-ai-045.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,30,66,0.15);">🔴 Red 0.45</button>
                <button type="button" class="btn btn-ghost btn-sm set-new-img" data-src="assets/meta-ai-030.svg" style="font-size:11px; padding:4px 8px; background:rgba(255,183,3,0.15);">🟡 Amber 0.30</button>
                <button type="button" class="btn btn-ghost btn-sm set-new-img" data-src="assets/meta-ai-050.svg" style="font-size:11px; padding:4px 8px; background:rgba(0,245,212,0.15);">🟢 Horjin 0.50</button>
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
                <img id="newAdminImgPreview" src="assets/meta-ai-045.svg" style="width:100%; height:100%; object-fit:cover;" alt="Banner">
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
          const price = Number(document.getElementById("newAdminProdPrice").value) || 0.45;
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

        const currImg = fixImg(p.image) || "assets/meta-ai-red.svg";

        UI.openModal(
          `✏️ Edit Listing: ${p.id}`,
          `<div style="display:grid; gap:12px;">
            <div class="field">
              <label class="fs12 fw700">Product Title</label>
              <input class="input" id="editTitle" value="${UI.esc(p.title)}" required>
            </div>
            
            <div class="grid-2" style="gap:12px;">
              <div class="field">
                <label class="fs12 fw700">Price per unit (৳) — (e.g. 0.45, 0.30, 0.50)</label>
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
                <a href="../#/seller?name=${encodeURIComponent(sName)}" target="_blank" class="btn btn-outline btn-xs" title="View Store">🔗 Store</a>
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
}

Router.INIT["admin"] = initAdmin;