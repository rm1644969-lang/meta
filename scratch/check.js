const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// 1. Duplicate IDs
const idRegex = /\bid=["']([^"']+)["']/g;
const counts = {};
let m;
while ((m = idRegex.exec(html)) !== null) {
  counts[m[1]] = (counts[m[1]] || 0) + 1;
}
const dups = Object.entries(counts).filter(([k, v]) => v > 1);
console.log('Duplicate IDs count:', dups.length);
console.log('Dups:', dups);

// 2. Check for HTML lint errors: unclosed elements, doctype, etc.
// Check if any script tag has syntax errors
const scriptContents = [];
const scriptTagRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let scMatch;
let scIndex = 0;
while ((scMatch = scriptTagRegex.exec(html)) !== null) {
  const code = scMatch[1].trim();
  if (code) {
    try {
      new Function(code);
      console.log(`Script ${scIndex}: OK`);
    } catch (e) {
      console.log(`Script ${scIndex} Syntax Error:`, e.message);
    }
  }
  scIndex++;
}
