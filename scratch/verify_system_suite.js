const fs = require('fs');
const path = require('path');

console.log("=== COMPREHENSIVE MARKETPLACE SYSTEM VERIFICATION ===");

// 1. Load API mock environment
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
  document: mockDocument,
  CustomEvent: function(type, detail) { this.type = type; this.detail = detail; },
  Notification: function() {},
  addEventListener(t, f) {},
  removeEventListener(t, f) {},
  location: { reload() {} }
};

// Evaluate API in sandboxed VM
const vm = require('vm');
const context = vm.createContext({
  window: mockWindow,
  localStorage: mockLocalStorage,
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

async function runTests() {
  let passed = 0;
  let failed = 0;
  function assert(cond, name) {
    if (cond) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      failed++;
    }
  }

  console.log("\n[TEST 1: Product Add & Admin Control]");
  // 1. Seller adds product with custom accounts
  const sellerProduct = await API.createProduct({
    title: "Meta AI Test Account 0.45",
    price: 0.45,
    category: "meta-ai",
    rawLogs: "test1@meta.com:pass123:cookie1\ntest2@meta.com:pass123:cookie2",
    sellerName: "Test Seller",
    sellerWhatsapp: "01700000000"
  });
  assert(sellerProduct && sellerProduct.stock >= 2, "Seller can add product with accounts pool");

  // 2. Admin adds product directly live
  const adminProduct = await API.createProduct({
    title: "Admin Exclusive 0.50",
    price: 0.50,
    category: "meta-ai",
    rawLogs: "admin1@meta.com:pass\nadmin2@meta.com:pass",
    isAdminDirect: true,
    sellerName: "Admin Official"
  });
  assert(adminProduct && adminProduct.status === "live", "Admin can publish new product directly as live");

  // 3. Admin edits product price & title
  const updatedProduct = await API.updateProduct(adminProduct.id, {
    title: "Admin Exclusive 0.30 Super Sale",
    price: 0.30
  });
  assert(updatedProduct && updatedProduct.price === 0.30, "Admin can edit product price (e.g. to 0.30)");

  // 4. Admin deletes product
  const delRes = await API.deleteProduct(adminProduct.id);
  assert(delRes && delRes.ok === true, "Admin can delete product");

  console.log("\n[TEST 2: Deposit / DP Flow]");
  // Test minimum deposit validation
  let caughtMinDep = false;
  try {
    await API.createDeposit({ method: "bKash", number: "01811111111", amount: 30, ref: "TRX123" });
  } catch (e) {
    caughtMinDep = true;
  }
  assert(caughtMinDep, "Deposit under ৳50 correctly blocked");

  // Valid deposit submission
  const depositTxn = await API.createDeposit({
    method: "bKash",
    number: "01811111111",
    amount: 100,
    ref: "TRXSUCCESS100"
  });
  assert(depositTxn && depositTxn.status === "pending", "Valid deposit submitted with pending status");

  // Admin approves deposit
  const approvedTxn = await API.approveDeposit(depositTxn.id);
  const walletAfterDep = await API.getWallet();
  assert(approvedTxn.status === "success" && walletAfterDep.balance >= 100, "Admin approves deposit & balance credited");

  console.log("\n[TEST 3: Buy & Sell Flow]");
  // Buyer purchases account
  const buyRes = await API.purchaseProduct({
    productId: sellerProduct.id,
    quantity: 1,
    sellerName: "Test Seller"
  });
  assert(buyRes && buyRes.order && buyRes.order.status === "delivered", "Buyer completes purchase & gets delivered items");
  assert(buyRes.order.deliveredItems.length === 1, "Exact 1 account delivered to credentials box");

  console.log("\n[TEST 4: Dispute Report & Replacement Flow]");
  // Buyer reports defective account
  const reportRes = await API.submitReport({
    orderId: buyRes.order.id,
    productId: sellerProduct.id,
    product: sellerProduct.title,
    seller: sellerProduct.seller.name,
    buyer: "Test Buyer",
    badAccounts: "test1@meta.com:pass123 (Password incorrect / dead)",
    whatsapp: "01711111111",
    issue: "dead_email"
  });
  assert(reportRes && reportRes.status === "pending", "Buyer can report bad email / account");

  // Seller sends replacement accounts
  const replaceRes = await API.sendReportReplacement(reportRes.id, "replacement1@meta.com:newpass123");
  const reportsList = await API.getReports();
  const updatedRep = reportsList.find(x => x.id === reportRes.id);
  assert(replaceRes && replaceRes.ok === true && updatedRep.status === "replaced" && updatedRep.replacementItems[0].includes("replacement1@meta.com"), "Seller can deliver fresh replacement accounts");

  console.log("\n[TEST 5: Admin Refund Flow]");
  // Buyer reports another dispute
  const report2 = await API.submitReport({
    orderId: buyRes.order.id,
    productId: sellerProduct.id,
    product: sellerProduct.title,
    seller: sellerProduct.seller.name,
    buyer: "Test Buyer",
    badAccounts: "test2@meta.com (Checkpointed)",
    whatsapp: "01722222222",
    issue: "checkpoint"
  });
  const balanceBeforeRefund = (await API.getWallet()).balance;
  await API.refundReport(report2.id, 0.45);
  const balanceAfterRefund = (await API.getWallet()).balance;
  assert(balanceAfterRefund === Number((balanceBeforeRefund + 0.45).toFixed(2)), "Admin can refund buyer balance directly for defective accounts");

  console.log("\n[TEST 6: Withdrawal Flow]");
  // Test min withdrawal
  let caughtMinWd = false;
  try {
    await API.createWithdraw({ method: "bKash", number: "01822222222", amount: 20 });
  } catch (e) {
    caughtMinWd = true;
  }
  assert(caughtMinWd, "Withdrawal under ৳50 correctly blocked");

  // Valid withdrawal
  const wdTxn = await API.createWithdraw({ method: "Nagad", number: "01822222222", amount: 50 });
  assert(wdTxn && wdTxn.status === "pending", "Withdrawal request submitted as pending");

  // Admin approves withdrawal
  const approvedWd = await API.approveWithdraw(wdTxn.id);
  assert(approvedWd && approvedWd.status === "success", "Admin can approve withdrawal payout");

  console.log("\n==========================================");
  console.log(`TOTAL: ${passed + failed} Tests | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log("ALL LOGICAL AND FUNCTIONAL FLOWS ARE 100% OPERATIONAL!");
  } else {
    process.exit(1);
  }
}

runTests();
