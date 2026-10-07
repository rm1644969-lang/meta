const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// 1. Duplicate IDs
const idRegex = /\bid=["']([^"']+)["']/g;
const idCounts = {};
let m;
while ((m = idRegex.exec(html)) !== null) {
  const id = m[1];
  // Ignore template interpolations like ${p.id}
  if (!id.includes('${')) {
    idCounts[id] = (idCounts[id] || 0) + 1;
  }
}
const duplicateIds = Object.entries(idCounts).filter(([k, v]) => v > 1);
console.log('Static duplicate IDs:', duplicateIds);

// 2. Multiple body, html, head tags?
console.log('<html> count:', (html.match(/<html/gi) || []).length);
console.log('<head> count:', (html.match(/<head/gi) || []).length);
console.log('<body> count:', (html.match(/<body/gi) || []).length);
console.log('<!DOCTYPE count:', (html.match(/<!DOCTYPE/gi) || []).length);

// 3. Are there template tags with duplicate IDs or inner tags?
// Let's check common HTML lint issues
// Empty href="#" or javascript:void(0)
// Or unclosed tags:
const openTags = ['div', 'span', 'p', 'section', 'article', 'aside', 'main', 'header', 'footer', 'form', 'template', 'script', 'style'];
openTags.forEach(tag => {
  const opens = (html.match(new RegExp(`<${tag}[\\s>]`, 'gi')) || []).length;
  const closes = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
  if (opens !== closes) {
    console.log(`Tag mismatch for <${tag}>: opened ${opens}, closed ${closes} (diff: ${opens - closes})`);
  }
});
