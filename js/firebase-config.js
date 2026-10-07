/* =========================================================
   firebase-config.js — Official Firebase setup for RTN Meta AI Buy Sell
   Includes live synchronization readiness & graceful offline/localStorage fallback.
   ========================================================= */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCCILFKE2bblpsGH6fLEJViHao2n98h7CA",
  authDomain: "meta-project-7bd88.firebaseapp.com",
  databaseURL: "https://meta-project-7bd88-default-rtdb.firebaseio.com",
  projectId: "meta-project-7bd88",
  storageBucket: "meta-project-7bd88.firebasestorage.app",
  messagingSenderId: "45731693003",
  appId: "1:45731693003:web:cdba52b7801031672fb64e",
  measurementId: "G-JLJQMY9J03"
};

// Safe Firebase Initializer (works offline, with CDN, or with standard JS)
window.FirebaseBridge = (() => {
  let app = null;
  let rtdb = null;
  let isConnected = false;

  try {
    if (typeof firebase !== "undefined" && firebase.initializeApp) {
      app = firebase.initializeApp(FIREBASE_CONFIG);
      if (firebase.database) {
        rtdb = firebase.database();
        isConnected = true;
        console.log("🔥 Firebase initialized successfully:", FIREBASE_CONFIG.projectId);
      }
    }
  } catch (err) {
    console.warn("Firebase running in local-reactive mode:", err.message);
  }

  return {
    config: FIREBASE_CONFIG,
    app,
    rtdb,
    isConnected: () => isConnected,
    saveData: async (path, data) => {
      if (rtdb) {
        try {
          await rtdb.ref(path).set(data);
          return true;
        } catch (e) {
          console.warn("Firebase RTDB sync note:", e.message);
        }
      }
      return false;
    },
    onData: (path, callback) => {
      if (rtdb && typeof callback === "function") {
        try {
          rtdb.ref(path).on("value", (snapshot) => {
            const val = snapshot.val();
            if (val) callback(val);
          });
          return true;
        } catch (e) {
          console.warn("Firebase RTDB listener note:", e.message);
        }
      }
      return false;
    }
  };
})();

