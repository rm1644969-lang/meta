const fs = require('fs');

console.log('--- Checking all files for Vercel & GitHub Readiness ---');

const files = [
  'index.html',
  'marketpro.html',
  'orders.html',
  'profile.html',
  'wallet.html',
  'product.html',
  'add-product.html',
  'my-products.html',
  'seller.html',
  'transactions.html',
  'admin/index.html',
  'vercel.json'
];

let allOk = true;
files.forEach(f => {
  if (fs.existsSync(f)) {
    const stat = fs.statSync(f);
    console.log(`✓ ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`✗ MISSING: ${f}`);
    allOk = false;
  }
});

// Check assets
const assets = fs.readdirSync('assets');
console.log(`✓ Assets count: ${assets.length} files in assets/`);

console.log('All readiness checks passed:', allOk);
