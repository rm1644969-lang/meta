/* Wallet — Deposit (DP) & Withdraw flows with exact platform numbers */
(function () {
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
    const t = new URLSearchParams(location.search).get("tab");
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
          `<button class="btn btn-primary" onclick="UI.closeModal(); location.reload();">Done</button>`
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
          `<button class="btn btn-primary" onclick="UI.closeModal(); location.reload();">Done</button>`
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
})();
