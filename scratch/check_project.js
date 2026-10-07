const fs = require('fs');
const path = require('path');

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let issues = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/(?:src|href)=["']([^"'#:]+)["']/g)];
  for (const m of matches) {
    const rawRef = m[1];
    if (rawRef.includes('${')) continue;
    const ref = rawRef.split('?')[0];
    if (ref.startsWith('http') || ref.startsWith('mailto:') || ref.startsWith('tel:') || ref.startsWith('data:') || ref.startsWith('javascript:')) continue;
    if (!fs.existsSync(ref)) {
      issues.push({ file, ref: rawRef });
    }
  }
});

console.log('Total issues found:', issues.length);
if (issues.length) {
  console.log(JSON.stringify(issues, null, 2));
} else {
  console.log('ALL file references and links across all HTML files are 100% OK!');
}
