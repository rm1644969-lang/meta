const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

// 1. Check all script tags for JS syntax errors
const scriptRegex = /<script(?:\s+type="([^"]*)")?(?:\s+src="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  scriptIndex++;
  const [full, type, src, code] = match;
  if (src) continue; // external
  if (type && type !== 'text/javascript' && type !== 'application/javascript') continue; // e.g. json or template
  
  // Try parsing JS code
  try {
    new Function(code);
    console.log(`Script ${scriptIndex}: OK`);
  } catch (err) {
    console.error(`Script ${scriptIndex} syntax error:`, err.message);
    // Find line number in file
    const charPos = match.index;
    const lineNumber = content.substring(0, charPos).split('\n').length;
    console.error(`  Around line: ${lineNumber}`);
  }
}

// 2. Check duplicate IDs in index.html
const idRegex = /\bid=["']([^"']+)["']/g;
const idCounts = {};
const idLines = {};
let idMatch;
const lines = content.split('\n');
lines.forEach((line, idx) => {
  let m;
  const lineIdRegex = /\bid=["']([^"']+)["']/g;
  while ((m = lineIdRegex.exec(line)) !== null) {
    const id = m[1];
    idCounts[id] = (idCounts[id] || 0) + 1;
    if (!idLines[id]) idLines[id] = [];
    idLines[id].push(idx + 1);
  }
});

console.log("\n--- Duplicate IDs ---");
let dupsFound = 0;
for (const [id, count] of Object.entries(idCounts)) {
  if (count > 1) {
    dupsFound++;
    console.log(`Duplicate ID "${id}" (${count} times) at lines: ${idLines[id].join(', ')}`);
  }
}
if (dupsFound === 0) console.log("No duplicate IDs found!");
