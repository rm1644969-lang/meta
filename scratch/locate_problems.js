const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split('\n');

lines.forEach((l, i) => {
  if (/<head[\s>]/i.test(l)) {
    console.log(`Line ${i + 1}: <head> found:`, l.trim());
  }
  if (/id=["']repProduct["']/i.test(l)) {
    console.log(`Line ${i + 1}: id="repProduct" found:`, l.trim());
  }
  if (/id=["']deliveredBox["']/i.test(l)) {
    console.log(`Line ${i + 1}: id="deliveredBox" found:`, l.trim());
  }
});
