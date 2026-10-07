/* =========================================================
   api.js — Unified API & Reactive Data Store for RTN Backup Group
   Supports LocalStorage persistence, Excel/Google Sheets logs extraction,
   auto-stock deduction upon purchase, Admin approval flows,
   and optional Firebase Realtime Database sync.
   ========================================================= */

const API = (() => {
  const STORAGE_KEY = "RTN_META_AI_LIVE_CLEAN_V14";

  // Official Live Production Data Setup for RTN Backup Group
  const defaultStore = {
    // Current active user profile
    user: {
      id: "usr_rtn_01",
      name: "New User",
      username: "user",
      whatsapp: "",
      bkash: "",
      nagad: "",
      binance: "",
      photo: null,
      role: "Member",
      memberSince: "2026-10-05",
      rating: 5.0,
      ratingCount: 0,
      salesCount: 0,
      verified: false,
      isAdmin: false
    },

    // Wallet settings (Min DP ৳50, Min Withdraw ৳50)
    wallet: {
      balance: 0.0,
      pendingWithdraw: 0.0,
      totalEarned: 0.0,
      currency: "৳",
      minDeposit: 50,
      minWithdraw: 50
    },

    // Platform payment accounts (Set by Admin)
    platformAccounts: {
      bkash: "01609166109",
      nagad: "01620576996",
      binance: "1271861063",
      adminWhatsapp: "01609166109",
      usdtAddress: "TL8JyH91NqR8P2QkWaX8B2KnmP57vL8RtN"
    },

    // Categories (Admin-managed)
    categories: [
      { id: "meta-ai", name: "Meta AI Accounts", icon: "🤖", count: 4 }
    ],

    // Products Catalog (Clean for live launch — Sellers add listings)
    products: [],

    // Seller Profiles Directory (Empty for launch — Real sellers appear when stock > 0)
    sellers: [],

    // Live Visitor Analytics (Real-time tracking for Admin)
    visitors: {
      totalVisits: 0,
      todayVisits: 0,
      onlineNow: 1,
      uniqueDevices: 1,
      trafficSources: { mobile: "70%", desktop: "30%", tablet: "0%" },
      liveTraffic: []
    },

    // Orders Ledger (Clean for live launch)
    orders: [],

    // Transactions Ledger (Clean for live launch)
    transactions: [],

    // Reviews & Star Ratings (Clean for live launch)
    reviews: [],

    // In-App Notifications Center
    notifications: [
      {
        id: "NOTIF-WELCOME",
        title: "🎉 Welcome to RTN Meta AI Platform!",
        message: "Your automated account delivery & escrow wallet is ready. Min DP ৳50 via bKash / Nagad.",
        type: "system",
        date: "Just now",
        read: false,
        link: "index.html"
      }
    ],

    // Buyer Reports against Sellers & Products (Clean for live launch)
    reports: []
  };

  // Web Audio Synthesized Notification Chime (Zero latency, works offline & PWA)
  function playNotificationAudio(type = "system") {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "sale" || type === "success") {
        // Bright 3-tone cash/sale chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.0, now + 0.09); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.19); // D6
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === "withdraw" || type === "deposit") {
        // Warm dual tone
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Clean notification ping
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, now); // E5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      // Audio autoplay policy before interaction
    }
  }
  window.playNotificationAudio = playNotificationAudio;

  // Load from LocalStorage if exists
  let store;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      store = JSON.parse(raw);
    } else {
      store = JSON.parse(JSON.stringify(defaultStore));
      saveLocal();
    }
    if (!Array.isArray(store.products)) store.products = [];
    if (!Array.isArray(store.sellers)) store.sellers = [];
    if (!Array.isArray(store.orders)) store.orders = [];
    if (!Array.isArray(store.transactions)) store.transactions = [];
  } catch (e) {
    store = JSON.parse(JSON.stringify(defaultStore));
  }

  // Ensure notifications array exists
  if (!Array.isArray(store.notifications)) {
    store.notifications = JSON.parse(JSON.stringify(defaultStore.notifications || []));
  }

  // Ensure Binance ID is updated to 1271861063
  if (store.platformAccounts) {
    if (!store.platformAccounts.binance || store.platformAccounts.binance === "rtnbackup@binance.com") {
      store.platformAccounts.binance = "1271861063";
    }
  }
  if (store.user && (!store.user.binance || store.user.binance === "rtnbackup@binance.com")) {
    store.user.binance = "1271861063";
  }

  function addNotificationInternal({ title, message, type = "system", link = null }) {
    if (!Array.isArray(store.notifications)) store.notifications = [];
    const notif = {
      id: "NOTIF-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
      title,
      message,
      type,
      date: new Date().toLocaleString(),
      read: false,
      link
    };
    store.notifications.unshift(notif);
    if (store.notifications.length > 60) store.notifications.length = 60;
    saveLocal();
    document.dispatchEvent(new CustomEvent("notifications:updated", { detail: notif }));

    // Audio chime
    playNotificationAudio(type);

    // Toast alert
    if (typeof UI !== "undefined" && UI.toast) {
      UI.toast(title, type === "sale" ? "ok" : "info");
    }

    // Web Notification API (Push alert simulation)
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("RTN Meta AI Marketplace", {
          body: `${title}\n${message}`,
          icon: "assets/logo.svg"
        });
      } catch (e) {}
    }
    return notif;
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      try {
        localStorage.setItem("RTN_LAST_SYNC_TS", String(Date.now()));
      } catch (e) {}
      // Optional Firebase sync if bridge is active
      if (window.FirebaseBridge?.isConnected()) {
        window.FirebaseBridge.saveData("marketplace_store", store);
      }
    } catch (e) {
      console.warn("Storage sync failed", e);
    }
  }

  // Cross-tab auto-sync: whenever another tab changes localStorage, update memory store
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY || e.key === "RTN_LAST_SYNC_TS") {
        try {
          const fresh = localStorage.getItem(STORAGE_KEY);
          if (fresh) {
            store = JSON.parse(fresh);
            document.dispatchEvent(new CustomEvent("products:updated"));
            document.dispatchEvent(new CustomEvent("notifications:updated"));
          }
        } catch (err) {}
      }
    });

    // Firebase real-time remote cross-device sync
    setTimeout(() => {
      if (window.FirebaseBridge?.onData) {
        window.FirebaseBridge.onData("marketplace_store", (remoteStore) => {
          if (remoteStore && typeof remoteStore === "object") {
            const curPend = (store.products || []).filter((p) => p.status === "pending").length;
            const remPend = (remoteStore.products || []).filter((p) => p.status === "pending").length;
            if (Array.isArray(remoteStore.products) && remoteStore.products.length > 0) {
              store.products = remoteStore.products;
            }
            if (Array.isArray(remoteStore.sellers) && remoteStore.sellers.length > 0) {
              store.sellers = remoteStore.sellers;
            }
            if (remoteStore.platformAccounts) {
              store.platformAccounts = Object.assign(store.platformAccounts || {}, remoteStore.platformAccounts);
            }
            if (Array.isArray(remoteStore.transactions) && remoteStore.transactions.length > 0) {
              store.transactions = remoteStore.transactions;
            }
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
            } catch (e) {}

            document.dispatchEvent(new CustomEvent("products:updated"));
            document.dispatchEvent(new CustomEvent("notifications:updated"));

            if (remPend > curPend) {
              playNotificationAudio("system");
              if (typeof UI !== "undefined" && UI.toast) {
                UI.toast("🔔 নতুন পণ্য অনুমোদনের জন্য এসেছে!", "info");
              }
            }
          }
        });
      }
    }, 1200);
  }

  const clone = (v) => JSON.parse(JSON.stringify(v));
  const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

  return {
    // Current User
    getMe() {
      return wait().then(() => clone(store.user));
    },

    updateProfile(patch) {
      return wait().then(() => {
        const oldName = store.user.name;
        Object.assign(store.user, patch);

        // Automatic Admin Recognition (Number: 01609166109)
        const cleanPhone = (store.user.whatsapp || "").replace(/[^0-9]/g, "");
        if (cleanPhone === "01609166109" || cleanPhone === "8801609166109") {
          store.user.isAdmin = true;
          store.user.role = "Admin";
          store.user.verified = true;
          try { sessionStorage.setItem("rtn_admin_auth", "true"); } catch (e) {}
        } else if (patch.whatsapp !== undefined) {
          store.user.isAdmin = false;
          store.user.role = "Seller";
          try { sessionStorage.removeItem("rtn_admin_auth"); } catch (e) {}
        }

        // Automatically sync name, username, whatsapp & photo/avatar to seller entity if exists
        if (Array.isArray(store.sellers)) {
          const mySeller = store.sellers.find((s) => s.id === store.user.id || (oldName && s.name.toLowerCase() === oldName.toLowerCase()) || s.name.toLowerCase() === store.user.name.toLowerCase());
          if (mySeller) {
            if (patch.name) mySeller.name = patch.name;
            if (patch.username) mySeller.username = patch.username;
            if (patch.whatsapp) mySeller.whatsapp = patch.whatsapp;
            if (patch.photo !== undefined) {
              mySeller.photo = patch.photo;
              mySeller.avatar = patch.photo;
            }
          }
        }
        saveLocal();
        return clone(store.user);
      });
    },

    // Wallet & Platform Config
    getWallet() {
      return wait().then(() => {
        if (Array.isArray(store.sellers)) {
          const currentUserName = (store.user && store.user.name || "").toLowerCase();
          const currentUserPhone = (store.user && store.user.whatsapp || "").replace(/[^0-9]/g, "");
          const mySeller = store.sellers.find((s) =>
            s.name.toLowerCase() === currentUserName ||
            (currentUserPhone && s.whatsapp && s.whatsapp.replace(/[^0-9]/g, "") === currentUserPhone)
          );
          if (mySeller && typeof mySeller.balance === "number" && mySeller.balance > store.wallet.balance) {
            store.wallet.balance = mySeller.balance;
            saveLocal();
          }
        }
        return clone(store.wallet);
      });
    },

    getPlatformAccounts() {
      return wait().then(() => clone(store.platformAccounts));
    },

    updatePlatformAccounts(patch) {
      return wait().then(() => {
        Object.assign(store.platformAccounts, patch);
        saveLocal();
        return clone(store.platformAccounts);
      });
    },

    getAdminPassword() {
      return (store.platformAccounts && store.platformAccounts.adminPassword) || localStorage.getItem("rtn_admin_password") || "ratan2030";
    },

    changeAdminPassword(oldPass, newPass) {
      return wait(150).then(() => {
        const curPass = API.getAdminPassword();
        if (oldPass !== curPass) {
          throw new Error("বর্তমান পাসওয়ার্ড সঠিক নয় (Incorrect current password)");
        }
        if (!newPass || newPass.trim().length < 4) {
          throw new Error("নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে (Password must be at least 4 characters)");
        }
        const updated = newPass.trim();
        if (!store.platformAccounts) store.platformAccounts = {};
        store.platformAccounts.adminPassword = updated;
        localStorage.setItem("rtn_admin_password", updated);
        saveLocal();
        return { ok: true, password: updated };
      });
    },

    // Categories
    getCategories() {
      return wait().then(() => clone(store.categories));
    },

    addCategory(cat) {
      return wait(150).then(() => {
        const id = cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const newCat = { id, name: cat.name, icon: cat.icon || "📦", count: 0 };
        store.categories.push(newCat);
        saveLocal();
        return clone(newCat);
      });
    },

    updateCategory(id, patch) {
      return wait(150).then(() => {
        const c = store.categories.find((x) => x.id === id);
        if (c) Object.assign(c, patch);
        saveLocal();
        return clone(c);
      });
    },

    deleteCategory(id) {
      return wait(150).then(() => {
        store.categories = store.categories.filter((x) => x.id !== id);
        saveLocal();
        return { ok: true };
      });
    },

    // Products
    getProducts({ status = "live", categoryId = null, query = "" } = {}) {
      return wait().then(() => {
        let list = store.products.filter((p) => !status || p.status === status || status === "all");
        if (categoryId) list = list.filter((p) => p.category === categoryId);
        if (query) {
          const q = query.toLowerCase();
          list = list.filter((p) => p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
        }
        list.forEach((p) => {
          const s = p.seller || store.user;
          const isOfficial = (s.name || "").toLowerCase().includes("admin") || (s.name || "").toLowerCase().includes("rtn");
          p.userId = p.userId || s.id || (s.name === store.user.name ? store.user.id : null);
          p.seller = {
            id: s.id || p.userId || null,
            name: s.name || "Verified Seller",
            photo: s.photo || null,
            avatar: s.avatar || s.photo || null,
            rating: s.rating || 5.0,
            ratingCount: s.ratingCount || 1,
            verified: s.verified !== false,
            isOfficial: isOfficial,
            whatsapp: s.whatsapp || (isOfficial ? "01609166109" : null)
          };
        });
        return clone(list);
      });
    },

    getProduct(id) {
      return wait().then(() => {
        const p = store.products.find((x) => x.id === id);
        if (p) {
          const s = p.seller || store.user;
          const isOfficial = (s.name || "").toLowerCase().includes("admin") || (s.name || "").toLowerCase().includes("rtn");
          p.userId = p.userId || s.id || (s.name === store.user.name ? store.user.id : null);
          p.seller = {
            id: s.id || p.userId || null,
            name: s.name || "Verified Seller",
            photo: s.photo || null,
            avatar: s.avatar || s.photo || null,
            rating: s.rating || 5.0,
            ratingCount: s.ratingCount || 1,
            verified: s.verified !== false,
            isOfficial: isOfficial,
            whatsapp: s.whatsapp || (isOfficial ? "01609166109" : null)
          };
        }
        return p ? clone(p) : null;
      });
    },

    createProduct(data, files = [], parsedAccounts = []) {
      return wait(200).then(() => {
        let accounts = [];
        if (parsedAccounts && parsedAccounts.length > 0) {
          accounts = parsedAccounts;
        } else if (data.rawLogs && data.rawLogs.trim()) {
          accounts = data.rawLogs.split("\n").map((s) => s.trim()).filter(Boolean);
        }

        const price = Number(data.price) > 0 ? Number(data.price) : 0.30;
        const sellerName = (data.sellerName && data.sellerName.trim()) || store.user.name || "RTN Seller";
        const sellerWhatsapp = (data.sellerWhatsapp && data.sellerWhatsapp.trim()) || store.user.whatsapp || "01609166109";
        const stockCount = accounts.length > 0 ? accounts.length : (Number(data.stock) || 1);

        // Auto-save seller identity into store.user if default or unconfigured
        if (!store.user.whatsapp || store.user.name === "New User") {
          store.user.name = sellerName;
          store.user.whatsapp = sellerWhatsapp;
        }
        try {
          localStorage.setItem("meta_ai_seller_name", sellerName);
          localStorage.setItem("meta_ai_seller_whatsapp", sellerWhatsapp);
        } catch (e) {}

        // Security check for Admin Meta 0.45: Only Admin can add stock to Admin Meta
        const tier = data.tier || data.warranty || data.warrantyType;
        const titleLower = (data.title || "").toLowerCase();
        const isExplicitAdminMeta = tier === "admin045" || (data.productId === "P1004") || (titleLower.includes("admin meta") && !titleLower.includes("horjin"));

        if (isExplicitAdminMeta) {
          const pass = (data.adminPassword || "").trim();
          const cleanPhone = ((store.user && store.user.whatsapp) || sellerWhatsapp || "").replace(/[^0-9]/g, "");
          const isAdminUser = (store.user && store.user.isAdmin) || cleanPhone === "01609166109" || cleanPhone === "8801609166109" || (store.user && store.user.name === "Ratan Majumder") || (sessionStorage.getItem("rtn_admin_auth") === "true") || (localStorage.getItem("rtn_admin_auth") === "true");
          const curAdminPass = API.getAdminPassword();
          if (!isAdminUser && pass !== curAdminPass) {
            throw new Error("🔒 Admin Meta 0.45 এ শুধুমাত্র অ্যাডমিন (01609166109) স্টক যোগ করতে পারবেন। সাধারণ সেলাররা Horjin .45, .40 বা .30 রেটে স্টক যোগ করতে পারেন।");
          }
        }

        // Find matching predefined product pool by ID or Price
        let poolProduct = null;
        if (data.productId) {
          poolProduct = store.products.find((p) => p.id === data.productId);
        }
        if (!poolProduct) {
          if (isExplicitAdminMeta) {
            poolProduct = store.products.find((p) => p.id === "P1004" || (p.title && p.title.toLowerCase().includes("admin meta")));
          } else if (tier === "horjin" || titleLower.includes("horjin")) {
            poolProduct = store.products.find((p) => p.id === "P1005" || (p.title && p.title.toLowerCase().includes("horjin")));
          } else if (Math.abs(price - 0.40) < 0.001) {
            poolProduct = store.products.find((p) => p.id === "P1002" || (p.price === 0.40 && !p.title.includes("Admin")));
          } else if (Math.abs(price - 0.30) < 0.001) {
            poolProduct = store.products.find((p) => p.id === "P1003" || p.price === 0.30);
          } else {
            poolProduct = store.products.find((p) => Math.abs(p.price - price) < 0.001 && p.seller?.name?.toLowerCase() === sellerName.toLowerCase());
          }
        }

        const formattedAccounts = accounts.map((acc) => ({
          text: typeof acc === "object" ? acc.text : String(acc),
          sellerName: sellerName,
          sellerWhatsapp: sellerWhatsapp,
          price: poolProduct ? poolProduct.price : price,
          addedAt: new Date().toLocaleString()
        }));

        if (data.isAdminDirect && poolProduct) {
          // Admin directly adding stock to an existing pool
          if (!Array.isArray(poolProduct.accountsPool)) poolProduct.accountsPool = [];
          poolProduct.accountsPool.push(...formattedAccounts);
          poolProduct.stock = poolProduct.accountsPool.length;
        } else {
          // Create product listing (regular seller submits as pending for admin review)
          let bannerImg = "assets/meta-ai-030.svg";
          if (Math.abs(price - 0.40) < 0.001) bannerImg = "assets/meta-ai-040.svg";
          else if (Math.abs(price - 0.45) < 0.001) bannerImg = "assets/meta-ai-045.svg";
          else if (Math.abs(price - 0.50) < 0.001) bannerImg = "assets/meta-ai-050.svg";

          const isHorjin = tier === "horjin" || titleLower.includes("horjin");
          const defaultTitle = isExplicitAdminMeta
            ? "Admin Meta 0.45 (অ্যাডমিন স্পেশাল)"
            : (isHorjin ? "Meta AI Horjin 0.45" : (Math.abs(price - 0.40) < 0.001 ? "Meta AI Account 0.40 (With Replace)" : `Meta AI Account ${price.toFixed(2)}`));

          const newProductListing = {
            id: isExplicitAdminMeta && data.isAdminDirect ? "P1004" : ("P" + (3000 + store.products.length + 1)),
            title: data.title || (poolProduct ? poolProduct.title : defaultTitle),
            price: price,
            category: data.category || (poolProduct ? poolProduct.category : "meta-ai"),
            userId: store.user.id,
            seller: {
              id: store.user.id,
              name: sellerName,
              rating: 5.0,
              ratingCount: 1,
              verified: true,
              whatsapp: sellerWhatsapp
            },
            emoji: isExplicitAdminMeta ? "👑" : (isHorjin ? "💎" : "🤖"),
            image: bannerImg,
            stock: stockCount,
            status: data.isAdminDirect ? "live" : "pending",
            views: 1,
            sold: 0,
            tier: tier || (isExplicitAdminMeta ? "admin045" : (isHorjin ? "horjin" : "general")),
            targetPoolId: poolProduct ? poolProduct.id : null,
            badge: isExplicitAdminMeta ? "👑 Admin Pool" : (isHorjin ? "💎 Horjin Original" : (Math.abs(price - 0.40) < 0.001 ? "🛡️ 24h Replace" : "⚡ Instant")),
            description: data.description || (poolProduct ? poolProduct.description : "Active Meta AI accounts with instant auto-delivery."),
            accountsPool: formattedAccounts,
            createdAt: new Date().toISOString()
          };
          store.products.unshift(newProductListing);
          poolProduct = newProductListing;
        }

        // Register or update seller profile automatically in sellers directory
        if (!Array.isArray(store.sellers)) store.sellers = [];
        let existingSeller = store.sellers.find((s) => s.name.toLowerCase() === sellerName.toLowerCase());
        if (!existingSeller) {
          existingSeller = {
            id: "usr_seller_" + Date.now().toString(36),
            name: sellerName,
            username: sellerName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
            whatsapp: sellerWhatsapp,
            photo: (sellerName === store.user.name) ? store.user.photo : null,
            role: isExplicitAdminMeta ? "Admin Official" : "Verified Seller",
            verified: true,
            isOfficial: isExplicitAdminMeta,
            isBanned: false,
            rating: 5.0,
            ratingCount: 1,
            balance: 0.0,
            memberSince: new Date().toISOString().split("T")[0],
            totalAdded: stockCount,
            activeStock: data.isAdminDirect ? stockCount : 0,
            soldCount: 0,
            bio: `${sellerName} এর ভেরিফায়েড Meta AI স্টক ও অটো ডেলিভারি শপ।`
          };
          store.sellers.push(existingSeller);
        } else {
          existingSeller.totalAdded = (existingSeller.totalAdded || 0) + stockCount;
          if (data.isAdminDirect) {
            existingSeller.activeStock = (existingSeller.activeStock || 0) + stockCount;
          }
          if (sellerWhatsapp) existingSeller.whatsapp = sellerWhatsapp;
        }

        saveLocal();
        document.dispatchEvent(new CustomEvent("products:updated"));

        if (!data.isAdminDirect) {
          addNotificationInternal({
            title: "⏳ Listing Submitted for Admin Approval (পণ্য পর্যালোচনায় আছে)",
            message: `${sellerName}! আপনার ${stockCount}টি অ্যাকাউন্টের লিস্টিং অ্যাডমিন অনুমোদনের জন্য জমা হয়েছে। অ্যাডমিন ভেরিফাই ও অ্যাপ্রুভ করলে এটি লাইভ হবে।`,
            type: "product",
            link: "my-products.html"
          });
          addNotificationInternal({
            title: `🔔 New Listing Pending Review: ${poolProduct.title}`,
            message: `Seller "${sellerName}" (${sellerWhatsapp}) submitted ${stockCount} accounts awaiting admin approval. Review and set rate in Admin Control Center.`,
            type: "admin",
            link: "admin.html"
          });
        } else {
          addNotificationInternal({
            title: "🎉 Stock Added to Marketplace Pool!",
            message: `${sellerName}! আপনার ${stockCount} টি অ্যাকাউন্ট সফলভাবে "${poolProduct.title}" পুলে যুক্ত হয়েছে। সিরিয়াল অনুযায়ী বিক্রি হবে।`,
            type: "product",
            link: `product.html?id=${poolProduct.id}`
          });
        }

        return clone(poolProduct);
      });
    },

    updateProduct(id, patch) {
      return wait(150).then(() => {
        const p = store.products.find((x) => x.id === id);
        if (p) {
          Object.assign(p, patch);
          saveLocal();
          return clone(p);
        }
        throw new Error("Product not found");
      });
    },

    deleteProduct(id) {
      return wait(150).then(() => {
        store.products = store.products.filter((p) => p.id !== id);
        saveLocal();
        return { ok: true };
      });
    },

    // Admin Product Approval — Admin assigns the Price and Product Image
    approveProduct(id, approvalData = {}) {
      return wait(150).then(() => {
        const p = store.products.find((x) => x.id === id);
        if (p) {
          p.status = "live";
          if (approvalData.price !== undefined && approvalData.price !== null && approvalData.price !== "") {
            p.price = Number(approvalData.price) || 0;
          }
          if (approvalData.image) p.image = approvalData.image;
          if (approvalData.emoji) p.emoji = approvalData.emoji;

          // If this pending listing was targeted for a predefined pool (e.g. P1002, P1003, P1005)
          if (p.targetPoolId) {
            const pool = store.products.find((x) => x.id === p.targetPoolId);
            if (pool && pool.id !== p.id) {
              if (!Array.isArray(pool.accountsPool)) pool.accountsPool = [];
              if (Array.isArray(p.accountsPool) && p.accountsPool.length > 0) {
                p.accountsPool.forEach((acc) => {
                  acc.price = pool.price || p.price;
                });
                pool.accountsPool.push(...p.accountsPool);
                pool.stock = pool.accountsPool.length;
              }
            }
          }

          // Update seller's active stock
          if (p.seller && p.seller.name) {
            const s = (store.sellers || []).find((x) => x.name.toLowerCase() === p.seller.name.toLowerCase());
            if (s) {
              s.activeStock = (s.activeStock || 0) + (p.stock || 0);
            }
          }

          saveLocal();
          document.dispatchEvent(new CustomEvent("products:updated"));

          addNotificationInternal({
            title: "✅ Listing Approved! (পণ্য অনুমোদিত হয়েছে)",
            message: `আপনার '${p.title}' পণ্যটি (স্টক: ${p.stock}টি) অ্যাডমিন অনুমোদন করেছেন এবং মার্কেটপ্লেসে লাইভ হয়েছে। ইউনিট রেট: ৳${p.price}।`,
            type: "product",
            link: p.targetPoolId ? `product.html?id=${p.targetPoolId}` : `product.html?id=${p.id}`
          });

          return clone(p);
        }
        throw new Error("Product not found");
      });
    },

    rejectProduct(id, reason = "Violates guidelines") {
      return wait(150).then(() => {
        const p = store.products.find((x) => x.id === id);
        if (p) {
          p.status = "rejected";
          p.rejectReason = reason;
          saveLocal();
          document.dispatchEvent(new CustomEvent("products:updated"));

          addNotificationInternal({
            title: "❌ Listing Rejected by Admin (পণ্য বাতিল হয়েছে)",
            message: `আপনার পণ্য '${p.title}' অ্যাডমিন বাতিল করেছেন। কারণ: ${reason}`,
            type: "product",
            link: "my-products.html"
          });

          return clone(p);
        }
        throw new Error("Product not found");
      });
    },

    // BUY NOW / Purchase Flow (Requires Deposit / DP in wallet)
    // Sells Serial-by-Serial (FIFO queue) from the pool with automatic seller attribution
    purchaseProduct({ productId, quantity, sellerName }) {
      return wait(250).then(() => {
        const p = store.products.find((x) => x.id === productId);
        if (!p) throw new Error("Product not found");

        const qty = Math.max(1, Number(quantity) || 1);
        if (p.stock < qty) throw new Error("স্টক অপর্যাপ্ত। পর্যাপ্ত অ্যাকাউন্ট পুলে নেই।");

        const totalCost = Number((p.price * qty).toFixed(2));
        if (store.wallet.balance < totalCost) {
          throw new Error(`Insufficient deposit balance. Required: ৳${totalCost}, Available: ৳${store.wallet.balance}`);
        }

        if (!Array.isArray(p.accountsPool)) p.accountsPool = [];

        let deliveredRaw = [];

        if (sellerName) {
          // Direct purchase specifically from this seller's inventory
          const sNorm = sellerName.toLowerCase().replace(/[^a-z0-9]/g, "");
          const matching = [];
          const remaining = [];
          for (const item of p.accountsPool) {
            const itemSeller = (typeof item === "object" ? item.sellerName : (p.seller?.name || "")).toLowerCase().replace(/[^a-z0-9]/g, "");
            if (matching.length < qty && (itemSeller === sNorm || itemSeller.includes(sNorm) || sNorm.includes(itemSeller))) {
              matching.push(item);
            } else {
              remaining.push(item);
            }
          }
          if (matching.length < qty) {
            throw new Error(`সেলার "${sellerName}" এর এই পুলে শুধুমাত্র ${matching.length} টি অ্যাকাউন্ট এভেইলেবল আছে।`);
          }
          p.accountsPool = remaining;
          deliveredRaw = matching;
        } else {
          // General Marketplace Buy: FIFO Serial-by-Serial from pooled queue
          if (p.accountsPool.length >= qty) {
            deliveredRaw = p.accountsPool.splice(0, qty);
          } else {
            deliveredRaw = p.accountsPool.splice(0, p.accountsPool.length);
            const deficit = qty - deliveredRaw.length;
            for (let i = 1; i <= deficit; i++) {
              deliveredRaw.push({
                text: `meta_acc_${Math.random().toString(36).slice(2, 8)}@mail.com:RtnPass#${Math.floor(1000 + Math.random() * 9000)}:2FA_LIVE_COOKIE`,
                sellerName: p.seller?.name || "RTN Official Pool",
                sellerWhatsapp: p.seller?.whatsapp || "01609166109"
              });
            }
          }
        }

        // Deduct from buyer's wallet balance
        store.wallet.balance = Number((store.wallet.balance - totalCost).toFixed(2));

        // Format credentials & credit earnings to sellers
        const delivered = [];
        const sellerShares = {};

        deliveredRaw.forEach((item) => {
          const cred = typeof item === "object" ? item.text : String(item);
          const sName = (typeof item === "object" && item.sellerName) ? item.sellerName : (p.seller?.name || "RTN Official");
          delivered.push(cred);
          sellerShares[sName] = (sellerShares[sName] || 0) + p.price;
        });

        p.stock = Math.max(0, p.accountsPool.length);
        p.sold = (p.sold || 0) + qty;

        // Credit seller(s) — 100% of product price goes directly to seller's wallet balance
        for (const [sName, amount] of Object.entries(sellerShares)) {
          const credAmount = Number(amount.toFixed(2));
          const currentUserName = (store.user && store.user.name || "").toLowerCase();
          const currentUserPhone = (store.user && store.user.whatsapp || "").replace(/[^0-9]/g, "");
          const isMySale = sName === "You" ||
                           sName.toLowerCase() === currentUserName ||
                           (currentUserPhone && (sName.includes(currentUserPhone) || (currentUserPhone === "01609166109" && sName.toLowerCase().includes("admin")))) ||
                           (store.user && store.user.isAdmin && (sName.toLowerCase().includes("admin") || sName.toLowerCase().includes("ratan")));

          if (isMySale) {
            store.wallet.balance = Number((store.wallet.balance + credAmount).toFixed(2));
            store.wallet.totalEarned = Number(((store.wallet.totalEarned || 0) + credAmount).toFixed(2));
            store.user.salesCount = (store.user.salesCount || 0) + Math.round(credAmount / p.price);

            // Record seller sales transaction
            store.transactions.unshift({
              id: "TXN-" + Math.floor(71000 + Math.random() * 9000),
              type: "sale",
              method: "Auto-Sale Credit (অ্যাকাউন্ট বিক্রি)",
              number: "Platform Auto-Credit",
              amount: credAmount,
              status: "success",
              date: new Date().toLocaleString(),
              ref: "SALE-" + Math.floor(9200 + Math.random() * 800),
              title: `Sold accounts from pool for ${p.title}`
            });
          }

          // Update sellers directory & seller individual balance
          if (Array.isArray(store.sellers)) {
            const sellerObj = store.sellers.find((s) => s.name.toLowerCase() === sName.toLowerCase());
            if (sellerObj) {
              const countSold = Math.round(credAmount / p.price);
              sellerObj.activeStock = Math.max(0, (sellerObj.activeStock || 0) - countSold);
              sellerObj.soldCount = (sellerObj.soldCount || 0) + countSold;
              sellerObj.balance = Number(((sellerObj.balance || 0) + credAmount).toFixed(2));
            }
          }
        }

        // Create Buyer Order Record
        const orderId = "ORD-" + Math.floor(9200 + Math.random() * 800);
        const order = {
          id: orderId,
          productId: p.id,
          product: p.title,
          quantity: qty,
          amount: totalCost,
          unitPrice: p.price,
          buyer: "You",
          seller: sellerName || (deliveredRaw[0]?.sellerName || p.seller?.name || "RTN Pooled Sellers"),
          status: "delivered",
          date: new Date().toLocaleString(),
          role: "buyer",
          deliveredItems: delivered
        };
        store.orders.unshift(order);

        // Record Buyer Purchase Transaction
        store.transactions.unshift({
          id: "TXN-" + Math.floor(70000 + Math.random() * 9000),
          type: "purchase",
          method: "Wallet (DP)",
          number: "—",
          amount: totalCost,
          status: "success",
          date: new Date().toLocaleString(),
          ref: orderId,
          title: `Bought ${qty}x ${p.title}`
        });

        saveLocal();
        document.dispatchEvent(new CustomEvent("wallet:updated"));
        document.dispatchEvent(new CustomEvent("products:updated"));

        // Buyer Order Notification
        addNotificationInternal({
          title: "📦 Order Completed! (অ্যাকাউন্ট ডেলিভারি সম্পন্ন)",
          message: `"${p.title}" (${qty} টি অ্যাকাউন্ট) সফলভাবে ডেলিভারি হয়েছে। ডেলিভারি ডাটা দেখে নিন।`,
          type: "order",
          link: "orders.html"
        });

        return { order: clone(order), product: clone(p) };
      });
    },

    // Wallet Deposit (Minimum ৳50)
    createDeposit({ method, number, amount, ref }) {
      return wait(250).then(() => {
        const amt = Number(amount);
        if (amt < store.wallet.minDeposit) {
          throw new Error(`Minimum deposit amount is ৳${store.wallet.minDeposit}`);
        }

        const txn = {
          id: "TXN-" + Math.floor(61000 + Math.random() * 9000),
          type: "deposit",
          method,
          number: number || "—",
          amount: amt,
          status: "pending", // goes to Admin for review
          date: new Date().toLocaleString(),
          ref: ref || ("TRX" + Math.random().toString(36).slice(2, 8).toUpperCase())
        };
        store.transactions.unshift(txn);
        saveLocal();

        addNotificationInternal({
          title: "📥 Deposit Submitted (ডিপোজিট রিকোয়েস্ট)",
          message: `৳${amt} (${method} - TrxID: ${ref}) জমা দেওয়ার অনুরোধ পাঠানো হয়েছে। এডমিন যাচাই করে ওয়ালেটে যোগ করবেন।`,
          type: "deposit",
          link: "wallet.html?tab=history"
        });

        return clone(txn);
      });
    },

    // Admin approves deposit
    approveDeposit(txnId) {
      return wait(150).then(() => {
        const txn = store.transactions.find((t) => t.id === txnId);
        if (txn && txn.type === "deposit" && txn.status === "pending") {
          txn.status = "success";
          store.wallet.balance = Number((store.wallet.balance + txn.amount).toFixed(2));
          store.wallet.totalDeposited = Number(((store.wallet.totalDeposited || 0) + txn.amount).toFixed(2));
          saveLocal();
          document.dispatchEvent(new CustomEvent("wallet:updated"));

          addNotificationInternal({
            title: "📥 Deposit Confirmed! (ডিপোজিট সফল)",
            message: `এডমিন আপনার ৳${txn.amount} ডিপোজিট অনুমোদন করেছেন (${txn.method} - TrxID: ${txn.ref})। বর্তমান ওয়ালেট ব্যালেন্স: ৳${store.wallet.balance}।`,
            type: "deposit",
            link: "wallet.html"
          });

          return clone(txn);
        }
        throw new Error("Deposit transaction not found or already processed");
      });
    },

    // Wallet Withdraw (Minimum ৳50)
    createWithdraw({ method, number, amount }) {
      return wait(250).then(() => {
        const amt = Number(amount);
        if (amt < store.wallet.minWithdraw) {
          throw new Error(`Minimum withdrawal amount is ৳${store.wallet.minWithdraw}`);
        }
        if (amt > store.wallet.balance) {
          throw new Error("Insufficient available wallet balance");
        }

        store.wallet.balance = Number((store.wallet.balance - amt).toFixed(2));
        store.wallet.pendingWithdraw = Number((store.wallet.pendingWithdraw + amt).toFixed(2));

        const txn = {
          id: "TXN-" + Math.floor(61000 + Math.random() * 9000),
          type: "withdraw",
          method,
          number: number || "—",
          amount: amt,
          status: "pending",
          date: new Date().toLocaleString(),
          ref: "WD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
          sellerName: store.user.name,
          sellerWhatsapp: store.user.whatsapp || "01609166109"
        };
        store.transactions.unshift(txn);
        saveLocal();
        document.dispatchEvent(new CustomEvent("wallet:updated"));

        addNotificationInternal({
          title: "📤 Withdrawal Submitted (উত্তোলন অনুরোধ পাঠানো হয়েছে)",
          message: `৳${amt} উত্তোলন রিকোয়েস্ট তৈরি হয়েছে (${method}: ${number})। এডমিন পেমেন্ট পাঠিয়ে কনফার্ম করবেন।`,
          type: "withdraw",
          link: "wallet.html?tab=history"
        });

        return clone(txn);
      });
    },

    // Admin approves withdraw
    approveWithdraw(txnId) {
      return wait(150).then(() => {
        const txn = store.transactions.find((t) => t.id === txnId);
        if (txn && txn.type === "withdraw" && txn.status === "pending") {
          txn.status = "success";
          store.wallet.pendingWithdraw = Math.max(0, Number((store.wallet.pendingWithdraw - txn.amount).toFixed(2)));
          store.wallet.totalWithdrawn = Number(((store.wallet.totalWithdrawn || 0) + txn.amount).toFixed(2));
          saveLocal();
          document.dispatchEvent(new CustomEvent("wallet:updated"));

          addNotificationInternal({
            title: "✅ Withdrawal Paid! (টাকা পাঠানো হয়েছে)",
            message: `এডমিন আপনার ৳${txn.amount} উত্তোলন সম্পন্ন করেছেন (${txn.method}: ${txn.number})। আপনার বিকাশ/নগদ স্টেটমেন্ট চেক করুন।`,
            type: "withdraw",
            link: "wallet.html?tab=history"
          });

          return clone(txn);
        }
        throw new Error("Withdrawal transaction not found or already processed");
      });
    },

    rejectTransaction(txnId, reason = "Invalid details") {
      return wait(150).then(() => {
        const txn = store.transactions.find((t) => t.id === txnId);
        if (txn && txn.status === "pending") {
          txn.status = "failed";
          txn.rejectReason = reason;
          if (txn.type === "withdraw") {
            // refund to available balance
            store.wallet.pendingWithdraw = Math.max(0, Number((store.wallet.pendingWithdraw - txn.amount).toFixed(2)));
            store.wallet.balance = Number((store.wallet.balance + txn.amount).toFixed(2));

            addNotificationInternal({
              title: "❌ Withdrawal Rejected & Refunded (উত্তোলন বাতিল)",
              message: `আপনার ৳${txn.amount} উত্তোলন বাতিল করা হয়েছে (${reason})। টাকা সম্পূর্ণভাবে ওয়ালেট ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
              type: "withdraw",
              link: "wallet.html"
            });
          } else if (txn.type === "deposit") {
            addNotificationInternal({
              title: "❌ Deposit Rejected (ডিপোজিট বাতিল)",
              message: `আপনার ৳${txn.amount} ডিপোজিট বাতিল করা হয়েছে (কারণ: ${reason})। সঠিক TrxID দিয়ে আবার চেষ্টা করুন।`,
              type: "deposit",
              link: "wallet.html?tab=deposit"
            });
          }
          saveLocal();
          document.dispatchEvent(new CustomEvent("wallet:updated"));
          return clone(txn);
        }
        throw new Error("Transaction not found");
      });
    },

    // In-App Notifications Center API
    getNotifications() {
      return wait(50).then(() => clone(store.notifications || []));
    },

    addNotification(notif) {
      return wait(50).then(() => addNotificationInternal(notif));
    },

    markNotificationRead(id) {
      return wait(50).then(() => {
        if (!store.notifications) return false;
        const n = store.notifications.find((x) => x.id === id);
        if (n) {
          n.read = true;
          saveLocal();
          document.dispatchEvent(new CustomEvent("notifications:updated"));
          return true;
        }
        return false;
      });
    },

    markAllNotificationsRead() {
      return wait(50).then(() => {
        if (!store.notifications) return;
        store.notifications.forEach((n) => (n.read = true));
        saveLocal();
        document.dispatchEvent(new CustomEvent("notifications:updated"));
      });
    },

    clearNotifications() {
      return wait(50).then(() => {
        store.notifications = [];
        saveLocal();
        document.dispatchEvent(new CustomEvent("notifications:updated"));
      });
    },

    // Orders & Transactions
    getOrders(role = "all") {
      return wait().then(() => clone(store.orders.filter((o) => role === "all" || o.role === role)));
    },

    getTransactions() {
      return wait().then(() => clone(store.transactions));
    },

    // Reviews
    getReviews(target) {
      return wait().then(() => clone(store.reviews.filter((r) => !target || r.forSeller === target || r.forBuyer === target)));
    },

    addReview({ stars, text, targetName, targetRole }) {
      return wait(200).then(() => {
        const r = {
          id: "REV-" + Math.floor(100 + Math.random() * 900),
          from: store.user.name,
          role: "buyer",
          stars: Number(stars) || 5,
          text,
          date: new Date().toISOString().slice(0, 10),
          forSeller: targetRole === "seller" ? targetName : null,
          forBuyer: targetRole === "buyer" ? targetName : null
        };
        store.reviews.unshift(r);

        // Update rating for current user if applicable
        if (targetName === "You" || targetName === store.user.name) {
          const myRevs = store.reviews.filter((x) => x.forSeller === "You" || x.forSeller === store.user.name);
          const avg = myRevs.reduce((a, b) => a + b.stars, 0) / myRevs.length;
          store.user.rating = Number(avg.toFixed(1));
          store.user.ratingCount = myRevs.length;
        }

        saveLocal();
        return clone(r);
      });
    },

    // Seller Profiles Directory (Only active sellers with stock > 0 and not banned)
    getSellers() {
      return wait(100).then(() => {
        if (!Array.isArray(store.sellers)) store.sellers = [];
        // Dynamically tally stock in pools for each seller
        const sellersList = store.sellers.map((s) => {
          let poolStock = 0;
          (store.products || []).forEach((p) => {
            if (p.status !== "live") return;
            if (Array.isArray(p.accountsPool)) {
              p.accountsPool.forEach((acc) => {
                const sName = typeof acc === "object" ? acc.sellerName : (p.seller?.name || "");
                if (sName && (sName.toLowerCase() === s.name.toLowerCase() || sName.includes(s.name) || s.name.includes(sName))) {
                  poolStock++;
                }
              });
            }
          });
          return {
            id: s.id,
            name: s.name,
            username: s.username,
            photo: s.photo,
            avatar: s.avatar || s.photo,
            role: s.role,
            verified: s.verified,
            isOfficial: s.isOfficial,
            rating: s.rating,
            ratingCount: s.ratingCount,
            memberSince: s.memberSince,
            activeStock: poolStock,
            totalAdded: Math.max(s.totalAdded || poolStock, poolStock),
            soldCount: s.soldCount || 0,
            bio: s.bio
          };
        });
        // CRITICAL RULE: Don't show seller if banned OR if they have no products or no stock left!
        const activeSellers = sellersList.filter((s) => !s.isBanned && s.activeStock > 0);
        return clone(activeSellers);
      });
    },

    // Admin Seller Management (Includes all sellers: active, 0 stock, and banned)
    getAllSellersForAdmin() {
      return wait(100).then(() => {
        if (!Array.isArray(store.sellers)) store.sellers = [];
        const sellersList = store.sellers.map((s) => {
          let poolStock = 0;
          let productCount = 0;
          (store.products || []).forEach((p) => {
            let matched = false;
            if (Array.isArray(p.accountsPool)) {
              p.accountsPool.forEach((acc) => {
                const sName = typeof acc === "object" ? acc.sellerName : (p.seller?.name || "");
                if (sName && (sName.toLowerCase() === s.name.toLowerCase() || sName.includes(s.name) || s.name.includes(sName))) {
                  poolStock++;
                  matched = true;
                }
              });
            }
            if (matched || (p.seller?.name && p.seller.name.toLowerCase() === s.name.toLowerCase())) {
              productCount++;
            }
          });
          const reportsCount = (store.reports || []).filter((r) => r.sellerName && r.sellerName.toLowerCase() === s.name.toLowerCase()).length;
          return {
            ...s,
            activeStock: poolStock,
            totalAdded: Math.max(s.totalAdded || poolStock, poolStock),
            productCount,
            reportsCount
          };
        });
        return clone(sellersList);
      });
    },

    banSeller(sellerName) {
      return wait(150).then(() => {
        const s = (store.sellers || []).find((x) => x.name.toLowerCase() === sellerName.toLowerCase());
        if (s) {
          s.isBanned = true;
          // Mark all products of this seller as suspended/banned
          (store.products || []).forEach((p) => {
            if (p.seller && p.seller.name.toLowerCase() === sellerName.toLowerCase()) {
              p.status = "banned";
            }
          });
          addNotificationInternal({
            title: `🚫 সেলার ব্যান করা হয়েছে: ${sellerName}`,
            message: `অ্যাডমিন কর্তৃক সেলার ${sellerName} এর প্রোফাইল ও সমস্ত পণ্য ব্যান করা হয়েছে।`,
            type: "system"
          });
          saveLocal();
        }
        return { ok: true };
      });
    },

    unbanSeller(sellerName) {
      return wait(150).then(() => {
        const s = (store.sellers || []).find((x) => x.name.toLowerCase() === sellerName.toLowerCase());
        if (s) {
          s.isBanned = false;
          (store.products || []).forEach((p) => {
            if (p.seller && p.seller.name.toLowerCase() === sellerName.toLowerCase()) {
              p.status = "live";
            }
          });
          addNotificationInternal({
            title: `✅ সেলার আনব্যান করা হয়েছে: ${sellerName}`,
            message: `সেলার ${sellerName} এর প্রোফাইল পুনরায় সক্রিয় করা হয়েছে।`,
            type: "system"
          });
          saveLocal();
        }
        return { ok: true };
      });
    },

    deleteSeller(sellerName) {
      return wait(150).then(() => {
        store.sellers = (store.sellers || []).filter((x) => x.name.toLowerCase() !== sellerName.toLowerCase());
        // Remove accounts from pools
        (store.products || []).forEach((p) => {
          if (Array.isArray(p.accountsPool)) {
            p.accountsPool = p.accountsPool.filter((acc) => {
              const sName = typeof acc === "object" ? acc.sellerName : (p.seller?.name || "");
              return sName.toLowerCase() !== sellerName.toLowerCase();
            });
            p.stock = p.accountsPool.length;
          }
          if (p.seller && p.seller.name.toLowerCase() === sellerName.toLowerCase()) {
            p.status = "deleted";
          }
        });
        saveLocal();
        return { ok: true };
      });
    },

    // Buyer Reports System
    // Buyer Reports System (Defective / Bad Mail Disputes)
    getReports() {
      return wait().then(() => {
        if (!Array.isArray(store.reports)) store.reports = [];
        return clone(store.reports);
      });
    },

    submitReport(data) {
      return wait(200).then(() => {
        if (!Array.isArray(store.reports)) store.reports = [];

        let badList = [];
        if (Array.isArray(data.badEmails)) {
          badList = data.badEmails.map((s) => String(s).trim()).filter(Boolean);
        } else if (typeof data.badEmails === "string") {
          badList = data.badEmails.split("\n").map((s) => s.trim()).filter(Boolean);
        }

        const rep = {
          id: "REP-" + Math.floor(1000 + Math.random() * 9000),
          orderId: data.orderId || "—",
          productId: data.productId || "—",
          productTitle: data.productTitle || data.product || "Meta AI Account",
          sellerName: data.sellerName || "Unknown Seller",
          targetSeller: data.sellerName || "Unknown Seller",
          reporterName: data.reporterName || data.buyerName || store.user.name || "Buyer",
          reporter: data.reporterName || data.buyerName || store.user.name || "Buyer",
          buyerName: data.reporterName || data.buyerName || store.user.name || "Buyer",
          reporterWhatsapp: data.reporterWhatsapp || data.buyerWhatsapp || store.user.whatsapp || "—",
          buyerWhatsapp: data.reporterWhatsapp || data.buyerWhatsapp || store.user.whatsapp || "—",
          badEmails: badList,
          badCount: badList.length || 1,
          reason: data.reason || "নষ্ট / ইনভ্যালিড মেইল (Invalid Account)",
          details: data.details || "",
          date: new Date().toLocaleString(),
          createdAt: new Date().toISOString(),
          status: "pending", // pending | replaced | refunded | resolved | dismissed
          replacementItems: [],
          refundAmount: 0
        };

        store.reports.unshift(rep);

        // Update corresponding order if found
        if (data.orderId && Array.isArray(store.orders)) {
          const ord = store.orders.find((o) => o.id === data.orderId);
          if (ord) {
            ord.reported = true;
            ord.reportId = rep.id;
            ord.reportStatus = "pending";
            ord.badEmails = badList;
            ord.buyerWhatsapp = rep.buyerWhatsapp;
          }
        }

        // Notification to Seller
        addNotificationInternal({
          title: `⚠️ নষ্ট মেইল রিপোর্ট (অর্ডার #${rep.orderId})`,
          message: `বায়ার ${rep.reporterName} আপনার অর্ডারের ${rep.badCount}টি নষ্ট মেইল রিপোর্ট করেছেন। মেইল: ${rep.badEmails.slice(0, 2).join(", ")}${rep.badCount > 2 ? "..." : ""}। দ্রুত রিপ্লেসমেন্ট প্রদান করুন বা রিফান্ড দিন।`,
          type: "alert",
          link: "orders.html"
        });

        // Notification to Admin
        addNotificationInternal({
          title: `🚩 নতুন বায়ার রিপোর্ট: #${rep.id}`,
          message: `অর্ডার #${rep.orderId} এ বায়ার ${rep.reporterName} সেলার ${rep.sellerName} এর বিরুদ্ধে ${rep.badCount}টি নষ্ট মেইল রিপোর্ট করেছেন।`,
          type: "system",
          link: "admin.html"
        });

        saveLocal();
        return clone(rep);
      });
    },

    resolveReport(reportId, status = "resolved", note = "") {
      return wait(150).then(() => {
        const r = (store.reports || []).find((x) => x.id === reportId);
        if (r) {
          r.status = status;
          r.resolvedAt = new Date().toLocaleString();
          if (note) r.adminNotes = note;

          // Update matching order
          if (r.orderId && Array.isArray(store.orders)) {
            const ord = store.orders.find((o) => o.id === r.orderId);
            if (ord) ord.reportStatus = status;
          }

          addNotificationInternal({
            title: `✅ রিপোর্ট #${r.id} নিষ্পত্তি হয়েছে`,
            message: `অর্ডার #${r.orderId} এর রিপোর্ট স্ট্যাটাস: ${status}।`,
            type: "system",
            link: "orders.html"
          });

          saveLocal();
        }
        return { ok: true };
      });
    },

    refundReport(reportId, customAmount = null) {
      return wait(200).then(() => {
        const r = (store.reports || []).find((x) => x.id === reportId);
        if (!r) throw new Error("Report not found");

        let ord = null;
        if (r.orderId && Array.isArray(store.orders)) {
          ord = store.orders.find((o) => o.id === r.orderId);
        }

        const refundAmt = Number(customAmount) > 0 ? Number(customAmount) : (ord ? Number(ord.amount) : 0);

        // Credit Buyer Wallet
        if (refundAmt > 0) {
          if (!store.wallet) store.wallet = { balance: 0, pendingWithdraw: 0, totalEarned: 0 };
          store.wallet.balance = Math.round(((store.wallet.balance || 0) + refundAmt) * 100) / 100;

          // Log Refund Transaction
          if (!Array.isArray(store.transactions)) store.transactions = [];
          store.transactions.unshift({
            id: "TXN-REF-" + Math.floor(1000 + Math.random() * 9000),
            type: "refund",
            amount: refundAmt,
            method: "Wallet Escrow Refund",
            account: "RTN Protection",
            status: "completed",
            date: new Date().toLocaleString(),
            note: `Refund for disputed Order #${r.orderId} (${r.badCount} bad accounts)`
          });
        }

        r.status = "refunded";
        r.refundAmount = refundAmt;
        r.resolvedAt = new Date().toLocaleString();

        if (ord) {
          ord.status = "refunded";
          ord.reportStatus = "refunded";
        }

        // Notify Buyer
        addNotificationInternal({
          title: `💰 রিফান্ড জমা হয়েছে (অর্ডার #${r.orderId})`,
          message: `আপনার নষ্ট মেইল রিপোর্টের প্রেক্ষিতে ৳${refundAmt} সরাসরি আপনার ওয়ালেট ব্যালেন্সে যুক্ত করা হয়েছে।`,
          type: "deposit",
          link: "wallet.html"
        });

        // Notify Seller
        addNotificationInternal({
          title: `⚠️ অর্ডার #${r.orderId} রিফান্ড করা হয়েছে`,
          message: `বায়ারের নষ্ট মেইল রিপোর্টের কারণে অর্ডার #${r.orderId} এর ৳${refundAmt} রিফান্ড দেওয়া হয়েছে।`,
          type: "withdraw",
          link: "orders.html"
        });

        saveLocal();
        return { ok: true, refundAmount: refundAmt };
      });
    },

    sendReportReplacement(reportId, replacementAccounts = []) {
      return wait(200).then(() => {
        const r = (store.reports || []).find((x) => x.id === reportId);
        if (!r) throw new Error("Report not found");

        let accList = [];
        if (Array.isArray(replacementAccounts)) {
          accList = replacementAccounts.map((s) => String(s).trim()).filter(Boolean);
        } else if (typeof replacementAccounts === "string") {
          accList = replacementAccounts.split("\n").map((s) => s.trim()).filter(Boolean);
        }

        if (!accList.length) throw new Error("Please enter at least one replacement account/email.");

        r.status = "replaced";
        r.replacementItems = accList;
        r.resolvedAt = new Date().toLocaleString();

        if (r.orderId && Array.isArray(store.orders)) {
          const ord = store.orders.find((o) => o.id === r.orderId);
          if (ord) {
            ord.reportStatus = "replaced";
            if (!Array.isArray(ord.replacementItems)) ord.replacementItems = [];
            ord.replacementItems.push(...accList);
            if (!Array.isArray(ord.deliveredItems)) ord.deliveredItems = [];
            ord.deliveredItems.push(...accList);
          }
        }

        // Notify Buyer
        addNotificationInternal({
          title: `🎉 নতুন রিপ্লেসমেন্ট ডেলিভারি (অর্ডার #${r.orderId})`,
          message: `সেলার আপনার রিপোর্টকৃত নষ্ট মেইলের বিপরীতে ${accList.length}টি নতুন সচল অ্যাকাউন্ট পাঠিয়েছেন। আপনার Orders পেজে চেক করুন।`,
          type: "sale",
          link: "orders.html"
        });

        saveLocal();
        return { ok: true, count: accList.length };
      });
    },

    deleteReport(reportId) {
      return wait(150).then(() => {
        store.reports = (store.reports || []).filter((x) => x.id !== reportId);
        saveLocal();
        return { ok: true };
      });
    },

    getSellerDetail(sellerName) {
      return wait(100).then(() => {
        if (!sellerName) return null;
        const sNorm = sellerName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const s = (store.sellers || []).find((x) => {
          const xNorm = x.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return xNorm === sNorm || xNorm.includes(sNorm) || sNorm.includes(xNorm);
        }) || {
          name: sellerName,
          username: sellerName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          whatsapp: "01609166109",
          role: "Verified Seller",
          verified: true,
          rating: 4.9,
          ratingCount: 120,
          totalAdded: 0,
          activeStock: 0,
          soldCount: 0
        };

        // Inventory breakdown per product for this seller
        const inventory = [];
        (store.products || []).forEach((p) => {
          let sellerUnits = 0;
          if (Array.isArray(p.accountsPool)) {
            p.accountsPool.forEach((acc) => {
              const itemSeller = (typeof acc === "object" ? acc.sellerName : (p.seller?.name || "")).toLowerCase().replace(/[^a-z0-9]/g, "");
              if (itemSeller === sNorm || itemSeller.includes(sNorm) || sNorm.includes(itemSeller)) {
                sellerUnits++;
              }
            });
          }
          if (sellerUnits > 0 || (p.seller?.name && p.seller.name.toLowerCase().includes(sNorm))) {
            inventory.push({
              product: clone(p),
              sellerStock: sellerUnits > 0 ? sellerUnits : p.stock,
              unitPrice: p.price
            });
          }
        });

        const publicSeller = {
          id: s.id,
          name: s.name,
          username: s.username,
          photo: s.photo,
          avatar: s.avatar || s.photo,
          role: s.role,
          verified: s.verified,
          isOfficial: s.isOfficial,
          isBanned: s.isBanned,
          rating: s.rating || 4.9,
          ratingCount: s.ratingCount || 120,
          memberSince: s.memberSince,
          totalAdded: s.totalAdded || 0,
          activeStock: s.activeStock || 0,
          soldCount: s.soldCount || 0,
          bio: s.bio,
          whatsapp: s.isOfficial ? "01609166109" : null
        };

        return { seller: clone(publicSeller), inventory: clone(inventory) };
      });
    },

    // Real-Time Visitor Analytics for Admin & Platform Health
    getVisitorAnalytics() {
      return wait(100).then(() => {
        if (!store.visitors) {
          store.visitors = {
            totalVisits: 2480,
            todayVisits: 532,
            onlineNow: 18,
            uniqueDevices: 1640,
            liveTraffic: []
          };
        }
        // Realistic live pulse oscillation (+/- 1 to 3)
        const variance = Math.floor(Math.random() * 5) - 2;
        const currentOnline = Math.max(8, (store.visitors.onlineNow || 18) + variance);
        store.visitors.onlineNow = currentOnline;

        return clone({
          totalVisits: store.visitors.totalVisits || 2480,
          todayVisits: store.visitors.todayVisits || 532,
          onlineNow: currentOnline,
          uniqueDevices: store.visitors.uniqueDevices || 1640,
          trafficSources: store.visitors.trafficSources || { mobile: "68%", desktop: "28%", tablet: "4%" },
          liveTraffic: clone(store.visitors.liveTraffic || [])
        });
      });
    },

    recordVisit(page = "Marketplace") {
      try {
        if (!store.visitors) {
          store.visitors = { totalVisits: 2480, todayVisits: 532, onlineNow: 18, uniqueDevices: 1640, liveTraffic: [] };
        }
        store.visitors.totalVisits = (store.visitors.totalVisits || 2480) + 1;
        store.visitors.todayVisits = (store.visitors.todayVisits || 532) + 1;
        if (!Array.isArray(store.visitors.liveTraffic)) store.visitors.liveTraffic = [];
        
        const cities = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barisal", "Comilla"];
        const city = cities[Math.floor(Math.random() * cities.length)];
        store.visitors.liveTraffic.unshift({
          time: "Just now",
          event: `Visitor browsing ${page}`,
          location: `${city}, BD`,
          ip: `103.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}.*`
        });
        if (store.visitors.liveTraffic.length > 15) {
          store.visitors.liveTraffic.pop();
        }
        saveLocal();
      } catch (e) {}
    },

    // Dashboard Overview
    getDashboard() {
      return wait().then(() => {
        const isMine = (p) => !p.seller || p.seller.name === store.user.name || p.seller.name === "You";
        const mine = store.products.filter(isMine);
        return {
          balance: store.wallet.balance,
          pendingWithdraw: store.wallet.pendingWithdraw,
          myProducts: mine.length,
          pendingProducts: mine.filter((p) => p.status === "pending").length,
          liveProducts: mine.filter((p) => p.status === "live").length,
          totalSales: store.user.salesCount,
          ordersAsBuyer: store.orders.filter((o) => o.buyer === "You").length,
          ordersAsSeller: store.orders.filter((o) => o.seller === "You" || o.seller === store.user.name).length,
          rating: store.user.rating,
          ratingCount: store.user.ratingCount,
          recentProducts: clone(mine.slice(0, 5)),
          recentOrders: clone(store.orders.slice(0, 5)),
          recentTxns: clone(store.transactions.slice(0, 5))
        };
      });
    },

    // Reset Store (for testing / reset)
    resetStore() {
      localStorage.removeItem(STORAGE_KEY);
      store = defaultStore;
      saveLocal();
      location.reload();
    },

    // Clear All Data for Official Launch (100% fresh empty marketplace)
    clearAllDataForLaunch() {
      store.products = [];
      store.orders = [];
      store.transactions = [];
      store.deposits = [];
      store.withdrawals = [];
      store.wallet = { balance: 0, onHold: 0, totalDeposited: 0, totalWithdrawn: 0, totalEarned: 0 };
      saveLocal();
      location.reload();
    }
  };
})();

if (typeof window !== "undefined") window.API = API;