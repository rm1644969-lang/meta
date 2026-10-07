const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) {
  console.log('No style block');
  process.exit();
}
const css = styleMatch[1];
const cssLines = css.split('\n');

// Check common VS Code CSS warnings:
// 1. Unknown vendor prefixes or duplicate properties
// 2. CSS syntax errors: unclosed braces
let braceCount = 0;
cssLines.forEach((l, idx) => {
  const opens = (l.match(/\{/g) || []).length;
  const closes = (l.match(/\}/g) || []).length;
  braceCount += (opens - closes);
  if (braceCount < 0) {
    console.log(`Unmatched closing brace at line ${idx + 1}`);
  }
});
console.log('Final brace balance:', braceCount);

// Check if any line in CSS has empty rules or syntax problems
cssLines.forEach((l, idx) => {
  if (/\{\s*\}/.test(l)) {
    console.log(`Empty rule at line ${idx + 1}:`, l.trim());
  }
});
