const fs = require('fs');

const files = [
  'index-multi.html',
  'product.html',
  'dashboard.html',
  'add-product.html',
  'my-products.html',
  'orders.html',
  'wallet.html',
  'transactions.html',
  'profile.html',
  'seller.html',
  'admin/index.html'
];

files.forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  const opens = (html.match(/<div[\s>]/gi) || []).length;
  const closes = (html.match(/<\/div>/gi) || []).length;
  if (opens !== closes) {
    console.log(`Mismatch in ${f}: opened ${opens}, closed ${closes} (diff: ${opens - closes})`);
  } else {
    console.log(`OK: ${f} (${opens} divs)`);
  }
});
