/* Product details — info, buy flow (DP/deposit rule), auto accounts delivery, seller card, reviews */
(function () {
  const params = new URLSearchParams(location.search);
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
                  ? `<div class="info-note" style="background:var(--surface-2); padding:12px; border-radius:8px; font-size:13px; color:var(--text-2);">This is your own listing. আপনি প্রতি অ্যাকাউন্ট বিক্রিতে পাবেন: <b style="color:var(--green)">৳${(p.sellerPayout || 0.40).toFixed(2)}</b> (মার্কেট রেট: ৳${p.price.toFixed(2)}, অ্যাডমিন প্রফিট: ৳${(p.price - (p.sellerPayout || 0.40)).toFixed(2)})।</div>`
                  : p.stock <= 0
                    ? `<button class="btn btn-ghost btn-block btn-lg" disabled style="background:var(--surface-2); color:var(--text-3);">Out of Stock</button>`
                    : `<button class="btn btn-primary btn-block btn-lg" id="buyBtn" style="font-size:16px; font-weight:800;">⚡ Instant Buy (Deposit First)</button>`}

                <a href="wallet.html?tab=deposit" class="btn btn-outline btn-block mt8">💰 Add Deposit (Min ৳50)</a>

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
                  <a href="seller.html?name=${encodeURIComponent(p.seller?.name || 'RTN Seller')}" class="fs12" style="color:var(--cyan); font-weight:700;">👤 View Seller Store</a>
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
              `<a href="wallet.html?tab=deposit" class="btn btn-primary btn-block">Go to Deposit (Min ৳50)</a>`
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
                    `<a href="orders.html" class="btn btn-meta">📋 View in My Orders</a>
                     <button class="btn btn-ghost" onclick="UI.closeModal(); location.reload();">Done</button>`
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
            <a href="seller.html?name=${encodeURIComponent(sellerName)}" class="t-main" style="text-decoration:none;">${UI.esc(sellerName)}</a>
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
      <a href="seller.html?name=${encodeURIComponent(sellerName)}" class="btn btn-outline btn-block mt16">
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
        <a href="product.html?id=${s.id}" class="card" style="padding:10px 12px; display:flex; align-items:center; gap:12px; transition:border-color 0.2s;">
          <span style="font-size:24px">${s.emoji || "🤖"}</span>
          <div style="min-width:0; flex:1">
            <div style="font-weight:600; font-size:13px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${UI.esc(s.title)}</div>
            <div class="dim fs11">${s.stock} in stock</div>
          </div>
          <b style="color:var(--accent); font-size:14px">${UI.money(s.price)}</b>
        </a>`).join("");
    });
  }
})();
