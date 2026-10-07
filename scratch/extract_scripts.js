const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let m;
let idx = 0;
while ((m = scriptRegex.exec(html)) !== null) {
  const code = m[1].trim();
  if (code) {
    fs.writeFileSync(`scratch/script_${idx}.js`, code);
    console.log(`Script ${idx} written (${code.length} bytes)`);
    idx++;
  }
}
