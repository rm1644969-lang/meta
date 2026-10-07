/* My Products — seller's own listings with approval-status tracking */
(function () {
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
            <a class="mp-title" href="product.html?id=${p.id}" style="font-size:16px; font-weight:700; color:#fff;">${UI.esc(p.title)}</a>
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
          ${p.status === "live" ? `<a class="btn btn-ghost btn-sm" href="product.html?id=${p.id}">${ICONS.eye} View</a>` : ""}
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
})();
