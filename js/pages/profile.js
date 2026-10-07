/* Profile — view/edit name, WhatsApp, bKash, Nagad, Binance, photo + my reviews */
(function () {
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
})();
