const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("=== TESTING ADMIN 0.55, DEFAULT 0.50, SELLER 0.40, ADMIN PROFIT 0.10 ===");

const apiCode = fs.readFileSync(path.join(__dirname, '../js/api.js'), 'utf8');

const mockLocalStorage = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = v; },
  removeItem(k) { delete this.data[k]; }
};

const domListeners = {};
const mockDocument = {
  dispatchEvent(evt) {
    if (domListeners[evt.type]) {
      domListeners[evt.type].forEach(fn => fn(evt));
    }
  },
  addEventListener(type, fn) {
    if (!domListeners[type]) domListeners[type] = [];
    domListeners[type].push(fn);
  }
};

const mockWindow = {
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  document: mockDocument,
  CustomEvent: function(type, detail) { this.type = type; this.detail = detail; },
  Notification: function() {},
  addEventListener(t, f) {},
  removeEventListener(t, f) {},
  location: { reload() {} }
};

const context = vm.createContext({
  window: mockWindow,
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  document: mockDocument,
  CustomEvent: mockWindow.CustomEvent,
  Notification: mockWindow.Notification,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  console: console,
  Date: Date,
  Math: Math,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  RegExp: RegExp,
  Promise: Promise
});

vm.runInContext(apiCode, context);
const API = context.window.API;

async function runProfitTests() {
  function assert(cond, name) {
    if (cond) {
      console.log(`  ✓ ${name}`);
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      process.exit(1);
    }
  }

  // 1. Check default products
  const products = await API.getProducts({ status: "live" });
  console.log("\n[1. Checking Default Products & Pricing]");
  const adminProd = products.find(p => p.id === "P1004" || (p.title && p.title.includes("Admin Meta")));
  assert(adminProd && adminProd.price === 0.55, `Admin product price is 0.55 (Actual: ${adminProd?.price})`);

  const defProd = products.find(p => p.id === "P1001" || (p.title && p.title.includes("With Replace")));
  assert(defProd && defProd.price === 0.50, `Default market product price is 0.50 (Actual: ${defProd?.price})`);
  assert(defProd && defProd.sellerPayout === 0.40, `Default seller payout is 0.40 (Actual: ${defProd?.sellerPayout})`);

  // Setup buyer profile
  await API.updateProfile({ name: "BuyerRakib", whatsapp: "01811111111" });

  // 2. Seller adds a product to the pool
  console.log("\n[2. Seller Adding Product (Market 0.50, Seller Payout 0.40)]");
  const sellerListing = await API.createProduct({
    title: "Meta AI Account 0.50 (With Replace)",
    price: 0.50,
    sellerPayout: 0.40,
    category: "meta-ai",
    sellerName: "SuperSeller99",
    sellerWhatsapp: "01799999999",
    rawLogs: "seller_acc_1@meta.com:pass123\nseller_acc_2@meta.com:pass456"
  });
  assert(sellerListing && sellerListing.price === 0.50, "Seller listing created with price 0.50");
  assert(sellerListing.sellerPayout === 0.40, "Seller payout stored as 0.40");

  // Admin approves seller listing to live
  await API.approveProduct(sellerListing.id);

  // 3. Buyer deposits money into wallet
  console.log("\n[3. Buyer Deposit & Purchase Flow]");
  const depTxn = await API.createDeposit({
    method: "bKash",
    number: "01788888888",
    amount: 100,
    ref: "DEP100PROFIT"
  });
  await API.approveDeposit(depTxn.id);

  const buyerBalBefore = (await API.getWallet()).balance;
  assert(buyerBalBefore >= 100, "Buyer wallet has deposit balance");

  // 4. Buyer purchases 1 account from SuperSeller99
  const purchaseRes = await API.purchaseProduct({
    productId: sellerListing.id,
    quantity: 1,
    sellerName: "SuperSeller99"
  });
  const buyerBalAfter = (await API.getWallet()).balance;
  assert(purchaseRes && purchaseRes.order, "Purchase completed successfully");
  assert(purchaseRes.order.unitPrice === 0.50, "Buyer was charged exactly ৳0.50");
  console.log("  Diff:", buyerBalBefore - buyerBalAfter, "Before:", buyerBalBefore, "After:", buyerBalAfter);
  assert(Number((buyerBalBefore - buyerBalAfter).toFixed(2)) === 0.50, "Buyer wallet reduced by exactly ৳0.50");

  // 5. Verify Seller earnings in seller directory
  const sellers = await API.getAllSellersForAdmin();
  const sellerRecord = sellers.find(s => s.name.toLowerCase() === "superseller99");
  assert(sellerRecord && sellerRecord.balance === 0.40, `Seller received exactly ৳0.40 for selling (Actual: ${sellerRecord?.balance})`);

  // 6. Test Admin product purchase at 0.55
  console.log("\n[4. Admin Exclusive 0.55 Product Purchase]");
  // Admin adds stock to P1004
  const adminStockAdd = await API.createProduct({
    productId: "P1004",
    title: "⭐ Admin Meta 0.55 (অ্যাডমিন স্পেশাল)",
    price: 0.55,
    isAdminDirect: true,
    sellerName: "Ratan Majumder (Admin)",
    sellerWhatsapp: "01609166109",
    adminPassword: API.getAdminPassword(),
    rawLogs: "admin_acc_1@meta.com:adminpass"
  });
  const adminBuyRes = await API.purchaseProduct({
    productId: "P1004",
    quantity: 1
  });
  assert(adminBuyRes && adminBuyRes.order.unitPrice === 0.55, "Buyer bought Admin Meta at ৳0.55");

  console.log("\n========================================================");
  console.log("🎉 ALL PROFIT & PRICING TESTS PASSED 100% PERFECTLY!");
  console.log("  • Admin price: ৳0.55");
  console.log("  • Default buyer price: ৳0.50");
  console.log("  • Seller payout: ৳0.40");
  console.log("  • Admin platform profit: ৳0.10 (৳0.50 - ৳0.40)");
  console.log("========================================================\n");
}

runProfitTests();
