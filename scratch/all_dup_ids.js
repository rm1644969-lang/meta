const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Check all IDs in the whole HTML:
const idRegex = /\bid=["']([^"']+)["']/g;
const counts = {};
let m;
while ((m = idRegex.exec(html)) !== null) {
  const id = m[1];
  counts[id] = (counts[id] || 0) + 1;
}

for (const [id, count] of Object.entries(counts)) {
  if (count > 1) {
    console.log(`Duplicate ID: "${id}" appears ${count} times`);
  }
}
