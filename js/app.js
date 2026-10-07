/* =========================================================
   app.js — Layout Shell, Navigation, Icons, PWA Support & Shared UI Helpers
   RTN Backup Group — Meta AI & Digital Assets Marketplace
   ========================================================= */

const ICONS = {
  home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  box: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  wallet: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2 2 2 0 0 1 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>',
  receipt: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  orders: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  star: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  checkCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  upload: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
  camera: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  copy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  eye: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  trendUp: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10" stroke-width="2.2"/></svg>',
  arrowDown: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  arrowUp: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  whatsapp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.92-9.91-9.92zm.01 17.5c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.4 0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.26-8.24 8.26zm4.52-6.18c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z"/></svg>',
  image: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  tag: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  download: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  refresh: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  sparkles: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 5.2L20 9.6l-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-2.4z"/></svg>',
  settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
};

// Global PWA Deferred Install Prompt Handler
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.querySelectorAll(".btn-install-app").forEach((el) => {
    el.style.display = "inline-flex";
  });
});

window.installRTNApp = function () {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        UI.toast("🎉 RTN App is installing on your device!");
      }
      deferredInstallPrompt = null;
    });
  } else {
    UI.toast("📱 To install: Tap browser menu (⋮) -> 'Install App' or 'Add to Home screen'", "info");
  }
};

// Auto-Register PWA Service Worker (Network-First for instant GitHub updates)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swPath = (location.pathname.includes("/admin") || document.body.dataset.page === "admin") ? "../sw.js" : "./sw.js";
    navigator.serviceWorker
      .register(swPath)
      .then((reg) => {
        // Auto-check for updates every 45s & on visibility change
        setInterval(() => reg.update(), 45000);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update();
        });

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              UI.toast("✨ App updated to latest version from GitHub!", "ok");
            }
          });
        });
      })
      .catch((err) => console.log("SW register notice:", err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

const UI = (() => {
  // Format money: preserves fractional paisa/cents for ৳0.45, ৳0.30
  const money = (n) => {
    const num = Number(n) || 0;
    if (num % 1 !== 0) {
      return "৳" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return "৳" + num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  const initials = (name) =>
    (name || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase();

  const statusMap = {
    live: ["green", "Live"],
    pending: ["amber", "Pending Admin"],
    rejected: ["red", "Rejected"],
    processing: ["blue", "Processing"],
    delivered: ["green", "Delivered"],
    cancelled: ["gray", "Cancelled"],
    refunded: ["violet", "Refunded"],
    success: ["green", "Success"],
    hold: ["amber", "On Hold"],
    failed: ["red", "Failed"]
  };

  const badge = (status, label) => {
    const [cls, txt] = statusMap[status] || ["gray", status || "—"];
    return `<span class="badge ${cls}">${label || txt}</span>`;
  };

  const stars = (rating, count) => {
    let h = '<span class="stars">';
    for (let i = 1; i <= 5; i++) {
      h += `<span class="${i <= Math.round(rating) ? "" : "s-off"}">${ICONS.star}</span>`;
    }
    h += `</span>`;
    if (count !== undefined) h += `<span class="stars-label">${Number(rating).toFixed(1)} (${count})</span>`;
    return h;
  };

  const avatar = (name, photo, cls = "") =>
    photo
      ? `<span class="avatar ${cls}"><img src="${photo}" alt=""></span>`
      : `<span class="avatar ${cls}">${initials(name)}</span>`;

  // ---------- Toasts ----------
  function toast(msg, kind = "ok") {
    let box = document.querySelector(".toasts");
    if (!box) {
      box = document.createElement("div");
      box.className = "toasts";
      document.body.appendChild(box);
    }
    const ico = kind === "err" ? ICONS.x : kind === "info" ? ICONS.info : ICONS.checkCircle;
    const t = document.createElement("div");
    t.className = "toast " + (kind === "ok" ? "" : kind);
    t.innerHTML = ico + `<span>${msg}</span>`;
    box.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateX(40px)";
      t.style.transition = "all .3s ease";
      setTimeout(() => t.remove(), 320);
    }, 3200);
  }

  // ---------- Modal ----------
  function openModal(title, bodyHTML, footHTML = "") {
    closeModal();
    const back = document.createElement("div");
    back.className = "modal-back open";
    back.id = "activeModal";
    back.innerHTML = `
      <div class="modal" role="dialog">
        <div class="modal__head">
          <h3>${title}</h3>
          <button class="modal__x" onclick="UI.closeModal()">${ICONS.x}</button>
        </div>
        <div class="modal__body">${bodyHTML}</div>
        ${footHTML ? `<div class="modal__foot">${footHTML}</div>` : ""}
      </div>`;
    back.addEventListener("click", (e) => {
      if (e.target === back) closeModal();
    });
    document.body.appendChild(back);
    return back;
  }

  function closeModal() {
    document.getElementById("activeModal")?.remove();
  }

  function confirmModal(title, msg, onYes, yesLabel = "Confirm", danger = false) {
    const m = openModal(
      title,
      `<p class="muted">${msg}</p>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
       <button class="btn ${danger ? "btn-danger" : "btn-primary"}" id="mYes">${yesLabel}</button>`
    );
    m.querySelector("#mYes").onclick = () => {
      closeModal();
      onYes();
    };
  }

  function copyText(txt) {
    (navigator.clipboard?.writeText(txt) ?? Promise.reject()).then(
      () => toast("Copied: " + txt),
      () => {
        const ta = document.createElement("textarea");
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        toast("Copied to clipboard!");
      }
    );
  }

  // ---------- In-App Notification Center Modal ----------
  function openNotifications() {
    API.getNotifications().then((list) => {
      let currentFilter = "all";

      const renderList = (filter) => {
        const filtered = filter === "all" ? list : list.filter((n) => n.type === filter);
        const container = document.getElementById("notifItemsList");
        if (!container) return;

        if (!filtered.length) {
          container.innerHTML = `
            <div class="notif-empty">
              <span style="font-size:36px; display:block; margin-bottom:8px;">📭</span>
              <b>কোনো নোটিফিকেশন নেই (No Notifications)</b>
              <p class="dim fs12 mt4">নতুন বিক্রি, ডিপোজিট বা উইথড্র অনুমোদন হলে এখানে দেখতে পাবেন।</p>
            </div>`;
          return;
        }

        container.innerHTML = filtered.map((n) => {
          const ico = n.type === "sale" ? "💰" : n.type === "deposit" ? "📥" : n.type === "withdraw" ? "📤" : n.type === "product" ? "⭐" : n.type === "order" ? "📦" : "ℹ️";
          return `
            <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}">
              <div class="notif-ico">${ico}</div>
              <div class="notif-body">
                <div class="notif-title">
                  <span>${esc(n.title)}</span>
                  ${!n.read ? `<span class="badge red no-dot" style="font-size:9.5px; padding:1px 5px;">NEW</span>` : ""}
                </div>
                <div class="notif-msg">${esc(n.message)}</div>
                <div class="notif-meta">
                  <span>${esc(n.date)}</span>
                  ${n.link ? `<a href="${n.link}" class="btn btn-outline btn-sm" style="font-size:11px; padding:3px 8px;">View →</a>` : ""}
                </div>
              </div>
            </div>`;
        }).join("");

        // Mark as read on click
        container.querySelectorAll(".notif-item").forEach((el) => {
          el.onclick = (e) => {
            if (e.target.tagName === "A") return;
            const id = el.dataset.id;
            API.markNotificationRead(id).then(() => {
              el.classList.remove("unread");
              el.querySelector(".badge")?.remove();
            });
          };
        });
      };

      const pushBanner = ("Notification" in window && Notification.permission !== "granted")
        ? `<div class="push-optin-box">
             <div>
               <b style="font-size:13px; color:var(--text); display:block;">📲 লাইভ পুশ নোটিফিকেশন চালু করুন</b>
               <span class="dim fs11">অ্যাকাউন্ট বিক্রি বা টাকা জমা হওয়ার সাথে সাথে ফোনের পর্দায় নোটিফিকেশন পাবেন।</span>
             </div>
             <button type="button" class="btn btn-primary btn-sm" id="enablePushBtn" style="font-size:11.5px; padding:6px 12px; font-weight:700;">
               🔔 Enable Push
             </button>
           </div>`
        : "";

      const unreadCount = list.filter((n) => !n.read).length;

      const bodyHTML = `
        <div class="notif-modal-wrap">
          ${pushBanner}

          <div class="notif-toolbar">
            <div class="flex ac gap8">
              <span class="badge ${unreadCount > 0 ? "red" : "gray"} no-dot">${unreadCount} Unread</span>
              <button class="btn btn-ghost btn-sm" id="testSoundBtn" title="Test Notification Chime" style="font-size:11.5px; padding:4px 8px;">
                🔊 Test Chime
              </button>
            </div>
            <div class="flex ac gap6">
              <button class="btn btn-ghost btn-sm" id="markAllReadBtn" style="font-size:11.5px; padding:4px 8px;">
                ✓ Mark all read
              </button>
              <button class="btn btn-ghost btn-sm" id="clearAllNotifBtn" style="font-size:11.5px; padding:4px 8px; color:var(--red);">
                🗑️ Clear
              </button>
            </div>
          </div>

          <div class="notif-tabs" id="notifTabs">
            <button class="notif-tab-btn on" data-filter="all">All (${list.length})</button>
            <button class="notif-tab-btn" data-filter="sale">💰 Sales</button>
            <button class="notif-tab-btn" data-filter="deposit">📥 Deposits</button>
            <button class="notif-tab-btn" data-filter="withdraw">📤 Withdraw</button>
            <button class="notif-tab-btn" data-filter="product">⭐ Listings</button>
          </div>

          <div class="notif-list" id="notifItemsList"></div>
        </div>`;

      openModal("🔔 Notification Center (নোটিফিকেশন সেন্টার)", bodyHTML);

      renderList("all");

      // Hook push enable
      document.getElementById("enablePushBtn")?.addEventListener("click", () => {
        if ("Notification" in window) {
          Notification.requestPermission().then((perm) => {
            if (perm === "granted") {
              toast("🎉 Push Notifications Enabled! You will receive live alerts.");
              document.querySelector(".push-optin-box")?.remove();
              new Notification("RTN Meta AI Marketplace", {
                body: "Push alerts activated! You will receive instant notifications for every sale & order.",
                icon: "assets/logo.svg"
              });
            } else {
              toast("Notification permission was closed/denied.", "info");
            }
          });
        }
      });

      // Hook test sound
      document.getElementById("testSoundBtn")?.addEventListener("click", () => {
        if (typeof window.playNotificationAudio === "function") {
          window.playNotificationAudio("sale");
          toast("🔊 Notification chime played!");
        }
      });

      // Hook mark all read
      document.getElementById("markAllReadBtn")?.addEventListener("click", () => {
        API.markAllNotificationsRead().then(() => {
          list.forEach((n) => (n.read = true));
          renderList(currentFilter);
          toast("All marked as read");
        });
      });

      // Hook clear all
      document.getElementById("clearAllNotifBtn")?.addEventListener("click", () => {
        API.clearNotifications().then(() => {
          list = [];
          renderList(currentFilter);
          toast("Notifications cleared");
        });
      });

      // Hook tabs
      document.querySelectorAll("#notifTabs .notif-tab-btn").forEach((btn) => {
        btn.onclick = () => {
          document.querySelectorAll("#notifTabs .notif-tab-btn").forEach((b) => b.classList.remove("on"));
          btn.classList.add("on");
          currentFilter = btn.dataset.filter;
          renderList(currentFilter);
        };
      });
    });
  }

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const icon = (name, size = 18) => {
    let s = ICONS[name] || "";
    if (!s) return "";
    return s.replace("<svg ", `<svg width="${size}" height="${size}" `);
  };
  const checkMark = () => `<span class="chk" style="color:var(--green);">${ICONS.check}</span>`;

  // ---------- Product Card Component (With Admin Image & Admin Price) ----------
  function productCard(p) {
    const cat = p.categoryName || (p.category ? p.category.replace("-", " ").toUpperCase() : "PRODUCT");
    const stockCls = p.stock <= 0 ? "out" : p.stock <= 50 ? "low" : "in";
    const stockTxt = p.stock <= 0 ? "Out of stock" : p.stock <= 50 ? `Only ${p.stock} left` : `${p.stock.toLocaleString()} in stock`;
    
    // Check if this is the #1 Top Admin 0.55 product
    const isAdmin045 = (p.id === "P1004" || p.isAdminOnly || p.isTopAdmin || (p.price === 0.55 && (p.title || "").toLowerCase().includes("admin meta")) || (p.title || "").toLowerCase().includes("admin meta"));

    // Highlight No Replace vs Guarantee
    const isNoReplace = p.title.toLowerCase().includes("no replace") || (p.description || "").toLowerCase().includes("no replace");
    const isGuarantee = p.title.toLowerCase().includes("guarantee") || p.title.toLowerCase().includes("horjin") || p.title.toLowerCase().includes("origin");

    // Price display: if price is 0 or pending approval
    const priceDisplay = (p.price && p.price > 0)
      ? `${money(p.price)} <small>/unit</small>`
      : `<span style="color:var(--amber); font-size:13px; font-weight:700;">Rate: Set by Admin</span>`;

    const mediaHTML = p.image
      ? `<div class="pc-media has-img ${isAdmin045 ? 'pc-admin-media' : ''}">
          <img src="${p.image}" class="pc-img ${isAdmin045 ? 'pc-admin-img' : ''}" alt="${esc(p.title)}" loading="lazy">
          <span class="pc-cat">${esc(cat)}</span>
          ${isAdmin045 ? '<span class="pc-admin-vip-badge"><span class="pc-pulse-dot"></span> 👑 ADMIN EXCLUSIVE</span>' : ''}
          ${p.seller?.verified ? `<span class="pc-verified" title="RTN Verified Seller">${ICONS.shield}</span>` : ""}
        </div>`
      : `<div class="pc-media ${isAdmin045 ? 'pc-admin-media' : ''}">
          <span class="emoji">${p.emoji || "🤖"}</span>
          <span class="pc-cat">${esc(cat)}</span>
          ${isAdmin045 ? '<span class="pc-admin-vip-badge"><span class="pc-pulse-dot"></span> 👑 ADMIN EXCLUSIVE</span>' : ''}
          ${p.seller?.verified ? `<span class="pc-verified" title="RTN Verified Seller">${ICONS.shield}</span>` : ""}
        </div>`;

    return `
    <a class="card product-card ${isAdmin045 ? 'is-admin-exclusive-card' : ''}" href="product.html?id=${p.id}">
      ${mediaHTML}
      <div class="pc-body">
        <div class="pc-title ${isAdmin045 ? 'pc-admin-title' : ''}" title="${esc(p.title)}">${esc(p.title)}</div>
        <div class="pc-seller" onclick="event.preventDefault(); event.stopPropagation(); window.location.href='seller.html?name=' + encodeURIComponent('${esc(p.seller?.name || 'Seller')}');" title="View all listings by this seller">
          ${avatar(p.seller?.name, p.seller?.photo, "sm")}
          <div style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center;">
            <span style="font-weight:700; color:var(--text);">${esc(p.seller?.name || "Seller")}</span>
            ${(p.seller?.name || "").toLowerCase().includes("admin") ? '<span class="badge red no-dot" style="font-size:9px; padding:1px 5px; margin-left:5px;">Admin</span>' : '<span class="badge cyan no-dot" style="font-size:9px; padding:1px 5px; margin-left:5px;">Seller</span>'}
          </div>
          <span style="margin-left:auto" class="flex ac">${stars(p.seller?.rating || 4.9)}</span>
        </div>
        ${p._sellerExtraCount ? `<div style="font-size:11px; color:var(--accent); font-weight:700; margin-top:4px; display:flex; align-items:center; gap:4px;"><span>📦</span> +${p._sellerExtraCount} more listings from this seller</div>` : ''}
        <div class="pc-meta">
          ${ICONS.eye}<span>${(p.views || 0).toLocaleString()} views</span> · <span>${p.sold || 0} sold</span>
          ${isAdmin045 ? '<span class="badge red no-dot" style="margin-left:auto; font-size:9.5px; font-weight:800; background:rgba(255,30,66,0.2); border:1px solid rgba(255,30,66,0.5);">🔥 TOP CHOICE</span>' : isNoReplace ? '<span class="badge red no-dot" style="margin-left:auto; font-size:9.5px;">No Replace</span>' : isGuarantee ? '<span class="badge green no-dot" style="margin-left:auto; font-size:9.5px;">Warranty</span>' : ''}
        </div>
        <div class="pc-foot">
          <div class="pc-price ${isAdmin045 ? 'pc-admin-price' : ''}">${priceDisplay}</div>
          <div class="pc-stock ${stockCls}">${stockTxt}</div>
        </div>
      </div>
    </a>`;
  }

  function downloadAccounts(order, format = "txt") {
    const items = order.deliveredItems || [];
    if (!items.length) {
      toast("No accounts to download.", "err");
      return;
    }
    const safeTitle = (order.product || "accounts").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const baseName = `${order.id || "order"}_${safeTitle}`;

    if (format === "txt") {
      const content = items.join("\r\n");
      downloadBlob(content, `${baseName}.txt`, "text/plain;charset=utf-8");
      toast("Downloaded as .TXT!");
    } else if (format === "csv") {
      const header = "Row,Account Credentials,Product,Order ID,Date\r\n";
      const rows = items.map((acc, i) => `${i + 1},"${acc.replace(/"/g, '""')}","${(order.product || "").replace(/"/g, '""')}","${order.id}","${order.date || ""}"`).join("\r\n");
      downloadBlob("\uFEFF" + header + rows, `${baseName}.csv`, "text/csv;charset=utf-8");
      toast("Downloaded as .CSV!");
    } else if (format === "xlsx") {
      if (window.XLSX) {
        const aoa = [
          ["Row", "Account / Credentials", "Product", "Order ID", "Date"],
          ...items.map((acc, i) => [i + 1, acc, order.product || "", order.id || "", order.date || ""])
        ];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Accounts");
        XLSX.writeFile(wb, `${baseName}.xlsx`);
        toast("Downloaded as Excel (.xlsx)!");
      } else {
        let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
        xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
        xml += '<Worksheet ss:Name="Accounts"><Table>';
        xml += '<Row><Cell><Data ss:Type="String">Row</Data></Cell><Cell><Data ss:Type="String">Account / Credentials</Data></Cell><Cell><Data ss:Type="String">Product</Data></Cell><Cell><Data ss:Type="String">Order ID</Data></Cell></Row>';
        items.forEach((acc, i) => {
          xml += `<Row><Cell><Data ss:Type="Number">${i + 1}</Data></Cell><Cell><Data ss:Type="String">${esc(acc)}</Data></Cell><Cell><Data ss:Type="String">${esc(order.product || "")}</Data></Cell><Cell><Data ss:Type="String">${esc(order.id || "")}</Data></Cell></Row>`;
        });
        xml += '</Table></Worksheet></Workbook>';
        downloadBlob(xml, `${baseName}.xls`, "application/vnd.ms-excel");
        toast("Downloaded for Excel!");
      }
    }
  }

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openReportModal(targetSeller = "", targetProduct = "") {
    openModal(
      "🚩 বায়ার রিপোর্ট ও অভিযোগ কেন্দ্র",
      `<div style="display:grid; gap:14px; text-align:left;">
        <div style="background:rgba(255,30,66,0.08); border:1px solid rgba(255,30,66,0.25); padding:10px 14px; border-radius:8px; font-size:12.5px; color:var(--text-2);">
          🛡️ <b>নিরাপদ মার্কেটপ্লেস গ্যারান্টি:</b> কোনো সেলারের সার্ভিস, ডেলিভারি বা পণ্যে সমস্যা থাকলে রিপোর্ট করুন। এডমিন তাৎক্ষণিকভাবে যাচাই করে সেলারকে ব্যান বা উপযুক্ত ব্যবস্থা নিবেন।
        </div>
        <div class="field">
          <label style="font-size:12px; font-weight:700; color:var(--text-2); margin-bottom:4px; display:block;">অভিযুক্ত সেলার (Seller):</label>
          <input type="text" id="repSeller" class="input" value="${esc(targetSeller)}" placeholder="Seller Name" ${targetSeller ? 'readonly style="background:var(--surface-2); font-weight:700;"' : ''}>
        </div>
        <div class="field">
          <label style="font-size:12px; font-weight:700; color:var(--text-2); margin-bottom:4px; display:block;">${targetProduct ? "পণ্য বা সার্ভিস (Product):" : "পণ্য / অর্ডার আইডি (ঐচ্ছিক):"}</label>
          <input type="text" id="repProduct" class="input" value="${esc(targetProduct)}" placeholder="e.g. Meta AI 0.45 বা Order #1002" ${targetProduct ? 'readonly style="background:var(--surface-2); font-weight:700;"' : ''}>
        </div>
        <div class="field">
          <label style="font-size:12px; font-weight:700; color:var(--text-2); margin-bottom:4px; display:block;">অভিযোগের কারণ (Reason):</label>
          <select id="repReason" class="select" style="width:100%; padding:8px 10px;">
            <option value="ভুল বা ইনভ্যালিড অ্যাকাউন্ট (Invalid Account)">ভুল বা ইনভ্যালিড অ্যাকাউন্ট (Invalid Account)</option>
            <option value="দেরিতে ডেলিভারি বা স্টক নেই (Out of Stock / Delayed)">দেরিতে ডেলিভারি বা স্টক নেই (Out of Stock / Delayed)</option>
            <option value="সেলার যোগাযোগ করছে না (Unresponsive Seller)">সেলার যোগাযোগ করছে না (Unresponsive Seller)</option>
            <option value="প্রতারণার সন্দেহ বা অনুপযুক্ত আচরণ (Fraud / Abuse)">প্রতারণার সন্দেহ বা অনুপযুক্ত আচরণ (Fraud / Abuse)</option>
            <option value="অন্যান্য অভিযোগ (Other Issue)">অন্যান্য অভিযোগ (Other Issue)</option>
          </select>
        </div>
        <div class="field">
          <label style="font-size:12px; font-weight:700; color:var(--text-2); margin-bottom:4px; display:block;">বিস্তারিত বিবরণ (Details):</label>
          <textarea id="repDetails" class="textarea" style="height:80px; font-size:13px;" placeholder="সমস্যাটির বিস্তারিত লিখুন যাতে এডমিন দ্রুত ব্যবস্থা নিতে পারেন..."></textarea>
        </div>
        <div class="field">
          <label style="font-size:12px; font-weight:700; color:var(--text-2); margin-bottom:4px; display:block;">আপনার নাম / WhatsApp (Reporter Contact):</label>
          <input type="text" id="repReporter" class="input" placeholder="আপনার WhatsApp বা ইউজারনেম">
        </div>
        <div class="flex gap10 jb mt6">
          <button type="button" class="btn btn-outline btn-sm" onclick="UI.closeModal()">বাতিল (Cancel)</button>
          <button type="button" class="btn btn-primary btn-sm" id="submitReportModalBtn" style="background:var(--red); border-color:var(--red); font-weight:800;">🚩 রিপোর্ট জমা দিন</button>
        </div>
      </div>`
    );

    setTimeout(() => {
      const btn = document.getElementById("submitReportModalBtn");
      if (btn) {
        btn.onclick = () => {
          const seller = (document.getElementById("repSeller")?.value || targetSeller || "").trim();
          const product = (document.getElementById("repProduct")?.value || targetProduct || "").trim();
          const reason = document.getElementById("repReason")?.value || "General";
          const details = (document.getElementById("repDetails")?.value || "").trim();
          const reporter = (document.getElementById("repReporter")?.value || "Buyer").trim();

          if (!details) {
            toast("অনুগ্রহ করে অভিযোগের বিস্তারিত বিবরণ লিখুন।", "err");
            return;
          }

          btn.disabled = true;
          btn.textContent = "জমা হচ্ছে...";

          if (typeof API !== "undefined" && API.submitReport) {
            API.submitReport({
              targetSeller: seller,
              targetProduct: product,
              reason: reason,
              details: details,
              reporter: reporter
            }).then(() => {
              closeModal();
              toast("আপনার রিপোর্ট এডমিনের কাছে সফলভাবে জমা হয়েছে। এডমিন দ্রুত যাচাই করবেন।", "success");
            }).catch(err => {
              btn.disabled = false;
              btn.textContent = "🚩 রিপোর্ট জমা দিন";
              toast("রিপোর্ট জমা দিতে ব্যর্থ হয়েছে।", "err");
            });
          } else {
            closeModal();
            toast("রিপোর্ট সাময়িকভাবে রেকর্ড করা হয়েছে।", "success");
          }
        };
      }
    }, 100);
  }

  function openMetaAiBox() {
    const aiContent = `
      <div style="display:grid; gap:14px; text-align:left;">
        <div style="display:flex; align-items:center; gap:12px; background:linear-gradient(135deg, rgba(0, 100, 224, 0.15) 0%, rgba(0, 198, 255, 0.1) 100%); padding:12px 14px; border-radius:12px; border:1px solid rgba(0, 198, 255, 0.3);">
          <img src="assets/meta-ai-logo.png" alt="Meta AI" class="meta-ai-orb-spin" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
          <div>
            <div style="font-weight:800; color:#38bdf8; font-size:14px;">RTN Meta AI অটোমেটেড হেল্প অ্যাসিস্ট্যান্ট</div>
            <div class="fs12 dim">মার্কেটপ্লেস, ডিপোজিট, নষ্ট মেইল ও একাউন্ট বিষয়ক যেকোনো তথ্যের জন্য নিচের বাটন চাপুন।</div>
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:6px;" id="aiQuickChips">
          <button type="button" class="btn btn-outline btn-sm" style="font-size:11px; padding:4px 10px; border-radius:20px;" onclick="window.__metaAiAsk('buy')">🛒 কিভাবে কিনব?</button>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:11px; padding:4px 10px; border-radius:20px;" onclick="window.__metaAiAsk('deposit')">💰 ডিপোজিট (DP) নিয়ম</button>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:11px; padding:4px 10px; border-radius:20px;" onclick="window.__metaAiAsk('report')">🚩 নষ্ট মেইল রিপোর্ট</button>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:11px; padding:4px 10px; border-radius:20px;" onclick="window.__metaAiAsk('login')">🍪 কুকিজ লগইন গাইড</button>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:11px; padding:4px 10px; border-radius:20px;" onclick="window.__metaAiAsk('withdraw')">💸 টাকা উত্তোলন</button>
        </div>

        <div id="aiChatBoxArea" style="background:#090d16; border:1px solid var(--border); border-radius:10px; padding:12px; min-height:120px; max-height:220px; overflow-y:auto; font-size:13px; line-height:1.6; color:#e2e8f0;">
          <div style="display:flex; gap:8px; align-items:flex-start;">
            <span style="font-size:16px;">🤖</span>
            <div>
              <b>স্বাগতম!</b> আমি RTN Meta AI বট। উপরের বাটনগুলোতে চাপ দিয়ে অথবা নিচে লিখে যেকোনো প্রশ্নের তাৎক্ষণিক সমাধান নিন।
            </div>
          </div>
        </div>

        <div style="display:flex; gap:8px;">
          <input type="text" id="aiCustomInput" class="input" placeholder="যেমন: নষ্ট মেইল পাইলে কি করব? অথবা ডিপোজিট কত?" style="font-size:13px;" onkeydown="if(event.key==='Enter') window.__metaAiSubmitCustom()">
          <button type="button" class="btn btn-meta" style="padding:0 16px; font-weight:700;" onclick="window.__metaAiSubmitCustom()">পাঠান</button>
        </div>
      </div>
    `;

    openModal(
      "🤖 Meta AI স্মার্ট হেল্প বক্স",
      aiContent,
      `<div class="flex jb ac w-full" style="width:100%;">
        <a href="https://wa.me/8801609166109" target="_blank" class="btn btn-outline btn-sm" style="color:var(--green); border-color:var(--green);">💬 সরাসরি এডমিন হোয়াটসঅ্যাপ</a>
        <button class="btn btn-primary btn-sm" onclick="UI.closeModal()">বন্ধ করুন</button>
      </div>`
    );
  }

  return {
    money,
    initials,
    badge,
    stars,
    avatar,
    toast,
    openModal,
    closeModal,
    confirmModal,
    copyText,
    esc,
    escape: esc,
    icon,
    checkMark,
    productCard,
    downloadAccounts,
    openNotifications,
    statusMap,
    openReportModal,
    openMetaAiBox
  };
})();
if (typeof window !== "undefined") window.UI = UI;

window.__metaAiAnswers = {
  buy: "<b>🛒 অ্যাকাউন্ট কেনার নিয়ম:</b><br>১. আপনার পছন্দের প্যাকেজ (যেমন: ⭐ Admin Meta 0.55, Market 0.50 With Replace বা 0.40 No Replace) বেছে নিন।<br>২. ওয়ালেটে পর্যাপ্ত DP ব্যালেন্স আছে কিনা দেখে নিয়ে <b>'Buy Now'</b> চাপুন।<br>৩. সাথে সাথে ডেলিভারি বক্স ও আপনার <a href='orders.html' style='color:#38bdf8;'>Orders</a> পেজে আইডি, পাসওয়ার্ড ও কুকিজ পেয়ে যাবেন।",
  deposit: "<b>💰 ডিপোজিট (DP) করার নিয়ম:</b><br>১. <a href='wallet.html' style='color:#38bdf8;'>Wallet</a> পেজে যান এবং বিকাশ (01609166109), নগদ (01620576996) বা বাইনান্সে টাকা পাঠান।<br>২. সর্বনিম্ন ডিপোজিট <b>৳৫০</b>।<br>৩. টাকা পাঠিয়ে TrxID ও প্রেরকের নাম্বার সাবমিট দিন। এডমিন ভেরিফাই করে ব্যালেন্স যোগ করে দেবেন।",
  report: "<b>🚩 নষ্ট মেইল রিপোর্ট ও রিপ্লেসমেন্ট:</b><br>১. কেনার পর ১-২টি মেইল নষ্ট বা ইনভ্যালিড হলে <a href='orders.html' style='color:#38bdf8;'>Orders</a> পেজে যান।<br>২. অর্ডারের পাশে থাকা <b>'🚩 নষ্ট মেইল রিপোর্ট'</b> বাটনে চাপুন।<br>৩. নষ্ট অ্যাকাউন্ট ও হোয়াটসঅ্যাপ দিন। সেলার তাৎক্ষণিক নতুন ভালো অ্যাকাউন্ট রিপ্লেস করবেন অথবা এডমিন ওয়ালেটে রিফান্ড ফেরত দেবেন।",
  login: "<b>🍪 কুকিজ দিয়ে লগইন গাইড:</b><br>১. ডেলিভারি বক্সে পাওয়া JSON কুকিজ কপি করুন।<br>২. Chrome ব্রাউজারে 'Cookie-Editor' এক্সটেনশন দিয়ে Import চাপুন এবং পেস্ট করুন।<br>৩. অথবা পাসওয়ার্ড ও 2FA কোড <a href='https://2fa.live' target='_blank' style='color:#38bdf8;'>2fa.live</a> থেকে নিয়ে ডাইরেক্ট লগইন করুন।",
  withdraw: "<b>💸 টাকা উত্তোলনের নিয়ম:</b><br>১. <a href='wallet.html' style='color:#38bdf8;'>Wallet</a> পেজের Withdraw ট্যাবে যান।<br>২. সর্বনিম্ন ৫০ টাকা দিয়ে আপনার বিকাশ বা নগদ নাম্বার লিখে রিকোয়েস্ট পাঠান।<br>৩. এডমিন ১-৪ ঘণ্টার মধ্যে আপনার একাউন্টে টাকা পাঠিয়ে দিবেন।"
};

window.__metaAiAsk = function (type) {
  const box = document.getElementById("aiChatBoxArea");
  if (!box) return;
  const ans = window.__metaAiAnswers[type] || "অনুগ্রহ করে আরও বিস্তারিত লিখুন।";
  box.innerHTML = `
    <div style="display:flex; gap:8px; align-items:flex-start;">
      <span style="font-size:16px;">🤖</span>
      <div>${ans}</div>
    </div>
  `;
  box.scrollTop = box.scrollHeight;
};

window.__metaAiSubmitCustom = function () {
  const inp = document.getElementById("aiCustomInput");
  const box = document.getElementById("aiChatBoxArea");
  if (!inp || !box) return;
  const q = (inp.value || "").trim().toLowerCase();
  if (!q) return;

  let ans = "";
  if (q.includes("নষ্ট") || q.includes("nosto") || q.includes("dead") || q.includes("রিপোর্ট") || q.includes("report") || q.includes("রিপ্লেস") || q.includes("replace")) {
    ans = window.__metaAiAnswers.report;
  } else if (q.includes("ডিপোজিট") || q.includes("dp") || q.includes("টাকা জমা") || q.includes("deposit") || q.includes("recharge")) {
    ans = window.__metaAiAnswers.deposit;
  } else if (q.includes("উইথড্র") || q.includes("withdraw") || q.includes("তুলব") || q.includes("টাকা তোলা")) {
    ans = window.__metaAiAnswers.withdraw;
  } else if (q.includes("কুকিজ") || q.includes("cookie") || q.includes("লগইন") || q.includes("login") || q.includes("2fa")) {
    ans = window.__metaAiAnswers.login;
  } else if (q.includes("কিনব") || q.includes("buy") || q.includes("অর্ডার") || q.includes("order")) {
    ans = window.__metaAiAnswers.buy;
  } else {
    ans = `<b>🤖 Meta AI উত্তর:</b> আপনার প্রশ্ন (${UI.esc(inp.value)}) সম্পর্কে বিস্তারিত তথ্যের জন্য আমাদের এডমিন হেল্পলাইনে যোগাযোগ করুন। এডমিন হোয়াটসঅ্যাপ: <a href="https://wa.me/8801609166109" target="_blank" style="color:#00e676; font-weight:700;">01609166109</a>। এছাড়া উপরের কুইক বাটনগুলো থেকে যেকোনো বিষয় বিস্তারিত জেনে নিতে পারেন।`;
  }

  box.innerHTML = `
    <div style="margin-bottom:8px; text-align:right;">
      <span style="background:var(--surface-3); padding:4px 10px; border-radius:12px; font-size:12px; color:#fff;">${UI.esc(inp.value)}</span>
    </div>
    <div style="display:flex; gap:8px; align-items:flex-start;">
      <span style="font-size:16px;">🤖</span>
      <div>${ans}</div>
    </div>
  `;
  inp.value = "";
  box.scrollTop = box.scrollHeight;
};

window.__reportSeller = function (seller, product) {
  if (typeof UI !== "undefined" && UI.openReportModal) {
    UI.openReportModal(seller, product);
  }
};

// Apply theme instantly
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("rtn_theme", theme);
  document.querySelectorAll(".theme-toggle-btn .theme-icon").forEach((el) => {
    el.textContent = theme === "light" ? "☀️" : "🌙";
  });
}
const savedTheme = localStorage.getItem("rtn_theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

// Record live visitor analytics
if (typeof API !== "undefined" && API.recordVisit) {
  API.recordVisit(document.body.dataset.page || "Marketplace");
}

// =========================================================
// Layout Shell — Injects sidebar, header, WhatsApp widget, PWA buttons & footer
// =========================================================
(function renderShell() {
  const page = document.body.dataset.page || "";
  if (page === "admin") return; // Admin has dedicated secure standalone layout

  const NAV = [
    { group: "Marketplace" },
    { id: "marketplace", label: "Browse Products", href: "index.html", icon: "home" },
    { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "dashboard" },
    { id: "sellers", label: "Seller Profiles (সেলার)", href: "seller.html", icon: "user" },
    { group: "Selling & Stock" },
    { id: "add-product", label: "Add Product (Seller)", href: "add-product.html", icon: "plus" },
    { id: "my-products", label: "My Listings", href: "my-products.html", icon: "box", badgeId: "navPending" },
    { id: "orders", label: "Orders & Delivery", href: "orders.html", icon: "orders" },
    { group: "Finance & DP" },
    { id: "wallet", label: "Deposit & Withdraw", href: "wallet.html", icon: "wallet" },
    { id: "transactions", label: "Transactions", href: "transactions.html", icon: "receipt" },
    { group: "Account" },
    { id: "profile", label: "My Profile", href: "profile.html", icon: "user" }
  ];

  const navHTML = NAV.map((n) => {
    if (n.group) return `<div class="nav-group-label">${n.group}</div>`;
    const active = n.id === page ? "active" : "";
    return `
      <a class="nav-link ${active}" href="${n.href}" data-nav="${n.id}">
        ${ICONS[n.icon] || ""}
        <span>${n.label}</span>
        ${n.badgeId ? `<span class="nav-badge" id="${n.badgeId}" hidden></span>` : ""}
      </a>`;
  }).join("");

  const shell = document.createElement("div");
  shell.innerHTML = `
    <div class="backdrop" id="backdrop"></div>
    <aside class="sidebar" id="sidebar">
      <a class="sidebar__brand" href="index.html">
        <img src="assets/meta-ai-logo.png" alt="Meta AI Logo" class="brand-logo-img meta-ai-orb-spin">
        <div class="brand-text-wrap">
          <div class="brand-name">RTN <span>META AI</span></div>
          <div class="brand-tag">Exchange & Buy Sell</div>
        </div>
      </a>
      
      <!-- PWA Quick Install Banner in Sidebar -->
      <div style="padding:10px 14px; border-bottom:1px solid var(--border);">
        <button onclick="window.installRTNApp()" class="btn btn-outline btn-block btn-install-app" style="font-size:12px; font-weight:700; padding:8px 10px; display:inline-flex; align-items:center; justify-content:center; gap:6px; border-color:var(--accent); color:var(--accent); background:rgba(255,30,66,0.06);">
          ${ICONS.download} <span>ইনস্টল অ্যাপ (Install App)</span>
        </button>
      </div>

      <nav class="sidebar__nav">${navHTML}</nav>
      <div class="sidebar__foot">
        <a class="sidebar-user" href="profile.html" id="sideUser"></a>
      </div>
    </aside>
    <header class="header">
      <button class="hamburger" id="hamburger" aria-label="Menu">${ICONS.menu}</button>
      <form class="search" action="index.html" method="get" id="headerSearch">
        ${ICONS.search}
        <input type="search" name="q" placeholder="Search Meta AI accounts, bulk logs, software…">
      </form>
      <div class="header__actions">
        <!-- PWA Header Install Button -->
        <button onclick="window.installRTNApp()" class="btn btn-outline btn-sm btn-install-app" style="font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:6px; border-color:var(--accent); color:var(--accent); background:rgba(255,30,66,0.08);">
          ${ICONS.download} <span>Install App</span>
        </button>

        <!-- Theme Day/Night Toggle Button -->
        <button class="icon-btn theme-toggle-btn" id="themeToggleBtn" title="Toggle Day / Night Mode">
          <span class="theme-icon">${savedTheme === "light" ? "☀️" : "🌙"}</span>
        </button>

        <a href="wallet.html" class="balance-chip" title="Wallet balance (Deposit / DP)">
          ${ICONS.wallet}<span class="b-text" id="hdrBalance">৳0</span>
        </a>
        <button class="icon-btn" id="headerNotifBtn" title="Platform Notifications" style="position:relative;" onclick="UI.openNotifications()">
          ${ICONS.bell}
          <span class="badge red no-dot" id="hdrNotifBadge" style="position:absolute; top:-4px; right:-6px; font-size:10px; padding:1px 5px; border-radius:10px; display:none;">0</span>
        </button>
        <a href="profile.html" id="hdrAvatar"></a>
      </div>
    </header>

    <!-- Floating Meta AI Assistant Box Widget -->
    <button class="floating-meta-ai-btn" onclick="UI.openMetaAiBox()" title="Meta AI Instant Assistant Box">
      <img src="assets/meta-ai-logo.png" alt="Meta AI" class="meta-ai-orb-spin" style="width:20px; height:20px; border-radius:50%; object-fit:cover;">
      <span>Meta AI হেল্প</span>
    </button>

    <!-- Floating WhatsApp Support Widget -->
    <a href="https://wa.me/8801609166109?text=Hello%20Admin,%20I%20need%20help%20with%20RTN%20Meta%20AI%20Marketplace" target="_blank" class="floating-whatsapp" title="Chat with Admin on WhatsApp">
      ${ICONS.whatsapp}
      <span>Admin WhatsApp: 01609166109</span>
    </a>

    <!-- Mobile Bottom Navigation Dock -->
    <nav class="mobile-nav" id="mobileNav">
      <a href="index.html" class="mobile-nav-item ${page === 'marketplace' ? 'active' : ''}">
        ${ICONS.home}
        <span>মার্কেট</span>
      </a>
      <a href="seller.html" class="mobile-nav-item ${page === 'sellers' ? 'active' : ''}">
        ${ICONS.user}
        <span>সেলার</span>
      </a>
      <a href="add-product.html" class="mobile-nav-item mobile-nav-add ${page === 'add-product' ? 'active' : ''}">
        <div class="mobile-add-btn">${ICONS.plus}</div>
        <span>অ্যাড স্টক</span>
      </a>
      <a href="wallet.html" class="mobile-nav-item ${page === 'wallet' ? 'active' : ''}">
        ${ICONS.wallet}
        <span>ওয়ালেট</span>
      </a>
      <a href="my-products.html" class="mobile-nav-item ${page === 'my-products' ? 'active' : ''}">
        ${ICONS.box}
        <span>লিস্টিং</span>
      </a>
    </nav>

    <footer class="footer">
      <span>© 2026 RTN BACKUP GROUP — Official Meta AI Buy & Sell Platform. Designer: Ratan Majumder.</span>
      <div class="f-links">
        <a href="wallet.html?tab=deposit">Deposit (DP)</a>
        <a href="add-product.html">Sell Meta</a>
        <a href="https://wa.me/8801609166109" target="_blank">Admin WhatsApp</a>
      </div>
    </footer>`;

  // Move existing .page content into main wrapper
  const pageEl = document.querySelector(".page");
  const app = document.createElement("div");
  app.className = "app";
  const main = document.createElement("div");
  main.className = "main";
  document.body.prepend(app);
  app.appendChild(shell.querySelector("#sidebar"));
  main.appendChild(shell.querySelector(".header"));
  if (pageEl) main.appendChild(pageEl);
  main.appendChild(shell.querySelector(".footer"));
  app.appendChild(main);
  app.parentElement.insertBefore(shell.querySelector(".backdrop"), app);
  document.body.appendChild(shell.querySelector(".floating-whatsapp"));
  const mNav = shell.querySelector("#mobileNav");
  if (mNav) document.body.appendChild(mNav);

  // Day/Night Theme toggle button handler
  document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    UI.toast(next === "light" ? "☀️ Day mode activated" : "🌙 Night mode activated");
  });

  // Drawer behaviour
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  document.getElementById("hamburger").onclick = () => {
    sidebar.classList.add("open");
    backdrop.classList.add("show");
  };
  backdrop.onclick = () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("show");
  };

  // Fill user + balance from API
  API.getMe().then((u) => {
    const sideUserEl = document.getElementById("sideUser");
    if (sideUserEl) {
      sideUserEl.innerHTML =
        UI.avatar(u.name, u.photo) +
        `<div><div class="name">${UI.esc(u.name)}</div><div class="role">${u.verified ? "✓ RTN Verified " : ""}${u.role}</div></div>`;
    }
    const hdrAv = document.getElementById("hdrAvatar");
    if (hdrAv) hdrAv.innerHTML = UI.avatar(u.name, u.photo);
  });

  const updateBalance = () => {
    API.getWallet().then((w) => {
      const hb = document.getElementById("hdrBalance");
      if (hb) hb.textContent = UI.money(w.balance);
    });
  };
  updateBalance();
  document.addEventListener("wallet:updated", updateBalance);

  // Update Pending badges
  const updateBadges = () => {
    API.getProducts({ status: "pending" }).then((list) => {
      const b = document.getElementById("navPending");
      if (b) {
        b.hidden = list.length === 0;
        b.textContent = list.length;
      }
      const adminB = document.getElementById("navAdminPending");
      if (adminB) {
        adminB.hidden = list.length === 0;
        adminB.textContent = list.length;
      }
    });
  };
  updateBadges();
  document.addEventListener("products:updated", updateBadges);

  // Update Notification Badge & Jingle Animation
  const updateNotifBadges = () => {
    API.getNotifications().then((list) => {
      const unread = list.filter((n) => !n.read).length;
      const b = document.getElementById("hdrNotifBadge");
      const hdrBtn = document.getElementById("headerNotifBtn");
      if (b) {
        b.style.display = unread > 0 ? "inline-block" : "none";
        b.textContent = unread > 99 ? "99+" : unread;
      }
      if (hdrBtn) {
        if (unread > 0) hdrBtn.classList.add("bell-ringing");
        else hdrBtn.classList.remove("bell-ringing");
      }

      const adminB = document.getElementById("adminNotifBadge");
      const adminBtn = document.getElementById("adminNotifBtn");
      if (adminB) {
        adminB.style.display = unread > 0 ? "inline-block" : "none";
        adminB.textContent = unread > 99 ? "99+" : unread;
      }
      if (adminBtn) {
        if (unread > 0) adminBtn.classList.add("bell-ringing");
        else adminBtn.classList.remove("bell-ringing");
      }
    });
  };
  updateNotifBadges();
  document.addEventListener("notifications:updated", updateNotifBadges);
})();
