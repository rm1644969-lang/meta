/* Marketplace home — categories, search, sort, product grid */
(function () {
  const grid = document.getElementById("catalog");
  const empty = document.getElementById("emptyState");
  const catBar = document.getElementById("catBar");
  const count = document.getElementById("resultCount");
  const params = new URLSearchParams(location.search);

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

    // Always keep Admin Meta 0.55 at the absolute top (Rank 1), followed by other pinned items
    list.sort((a, b) => {
      const aWeight = (a.id === "P1004" || a.isAdminOnly || a.isTopAdmin || (a.price === 0.55 && (a.title || "").includes("Admin Meta")) || (a.title || "").includes("Admin Meta")) ? 3 : ((a.isOfficial || a.isPinned) ? 1 : 0);
      const bWeight = (b.id === "P1004" || b.isAdminOnly || b.isTopAdmin || (b.price === 0.55 && (b.title || "").includes("Admin Meta")) || (b.title || "").includes("Admin Meta")) ? 3 : ((b.isOfficial || b.isPinned) ? 1 : 0);
      return bWeight - aWeight;
    });

    grid.innerHTML = list.map(UI.productCard).join("");
    empty.hidden = list.length > 0;
    count.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  }
})();
