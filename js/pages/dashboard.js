/* Dashboard — stats, approval status, recent orders/txns */
(function () {
  Promise.all([API.getDashboard(), API.getMe()]).then(([d, me]) => {
    document.getElementById("greetTitle").textContent = `Dashboard — ${me.name.split(" ")[0]} 👋`;

    const stats = [
      { label: "Wallet Balance", value: UI.money(d.balance), trend: "+৳5,000 this week", up: true, ico: "green", icon: "wallet", href: "wallet.html" },
      { label: "Live Products", value: d.liveProducts, trend: `${d.pendingProducts} pending approval`, up: true, ico: "blue", icon: "box" },
      { label: "Total Sales", value: d.totalSales, trend: "+12 this month", up: true, ico: "violet", icon: "trendUp" },
      { label: "Seller Rating", value: d.rating.toFixed(1) + " ★", trend: `${d.ratingCount} reviews`, up: true, ico: "amber", icon: "star" },
      { label: "Orders (Buyer)", value: d.ordersAsBuyer, trend: "as customer", up: true, ico: "cyan", icon: "orders" },
      { label: "Orders (Seller)", value: d.ordersAsSeller, trend: "as vendor", up: true, ico: "red", icon: "receipt" }
    ];

    document.getElementById("dashStats").innerHTML = stats.map((s) => `
      <a class="card stat-card" href="${s.href || "#"}" ${s.href ? "" : 'style="cursor:default"'}>
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
        <a href="my-products.html" class="btn btn-ghost btn-sm">Review →</a>
      </div>
      ${pend ? `<div class="info-note mt8">${UI.icon("clock")} Pending listings won't appear in the marketplace until an admin approves them.</div>` : ""}`;

    // my recent listings mini rows
    const catNames = {};
    API.getCategories().then((cats) => {
      cats.forEach((c) => (catNames[c.id] = c.name));
      const dashProds = document.getElementById("dashProducts");
      if (dashProds) {
        dashProds.innerHTML = d.recentProducts.map((p) => `
          <a href="product.html?id=${p.id}" class="flex ac gap12" style="padding:10px; border-radius:10px; border:1px solid var(--border); background:var(--surface-2)">
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
})();
