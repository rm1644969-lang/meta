const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Let's inspect the duplicate IDs:
// 1. repProduct (lines ~7040 and ~7044 in template or js string)
// 2. deliveredBox (lines ~7625 and ~9838)
// 3. </label> without opening <label> (line 4308)

console.log('--- Checking problem 1 & 2: repProduct and deliveredBox ---');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('id="repProduct"')) console.log(`repProduct at line ${i+1}`);
  if (l.includes('id="deliveredBox"')) console.log(`deliveredBox at line ${i+1}`);
  if (l.includes('placeholder="Pay ID বা ইমেইল"></label>')) console.log(`Extra </label> at line ${i+1}`);
});
