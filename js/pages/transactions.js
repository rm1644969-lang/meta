/* Transactions — full ledger with type filter */
(function () {
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
})();
