/* Orders — Buyer and Seller views with auto-delivered accounts & Excel logs inspection */
(function () {
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
})();
