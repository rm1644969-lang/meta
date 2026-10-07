const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const idRegex = /(?:^|\s)id=["']([^"']+)["']/g;
const idCounts = {};
const idLines = {};
const lines = content.split('\n');
lines.forEach((line, idx) => {
  let m;
  const lineIdRegex = /(?:^|\s)id=["']([^"']+)["']/g;
  while ((m = lineIdRegex.exec(line)) !== null) {
    const id = m[1];
    idCounts[id] = (idCounts[id] || 0) + 1;
    if (!idLines[id]) idLines[id] = [];
    idLines[id].push(idx + 1);
  }
});

console.log("--- Real HTML Duplicate IDs ---");
let dupsFound = 0;
for (const [id, count] of Object.entries(idCounts)) {
  if (count > 1) {
    dupsFound++;
    console.log(`Duplicate ID "${id}" (${count} times) at lines: ${idLines[id].join(', ')}`);
  }
}
if (dupsFound === 0) console.log("Zero duplicate IDs found!");
