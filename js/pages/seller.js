/* Seller Storefront — view seller profile, accounts added, & direct purchase */
(function () {
  const params = new URLSearchParams(location.search);
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
            <a href="seller.html?seller=${encodeURIComponent(s.name)}" class="btn btn-outline btn-block btn-sm" style="font-weight:700;">
              👤 প্রোফাইল
            </a>
            <a href="seller.html?seller=${encodeURIComponent(s.name)}" class="btn btn-primary btn-block btn-sm" style="font-weight:800; background:linear-gradient(135deg, #ff1e42 0%, #e11d48 100%);">
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
        location.href = "index.html";
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
                  <a href="product.html?id=${p.id}" class="fs12" style="color:var(--text-2); text-decoration:underline;">
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
                    <a href="orders.html" class="btn btn-meta btn-sm" style="font-weight:700;">আমার অর্ডার দেখুন</a>
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
})();
