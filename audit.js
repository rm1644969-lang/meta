const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== RUNNING DEEP AUDIT OF INDEX.HTML ===\n');

// 1. Check for querySelector or getElementById that adds event listeners without optional chaining or null check
const getElRegex = /document\.getElementById\(["']([^"']+)["']\)\.(addEventListener|onclick|onchange|onsubmit)/g;
let m;
const missingListenerTargets = [];
while ((m = getElRegex.exec(html)) !== null) {
  const id = m[1];
  const method = m[2];
  // check if id exists anywhere in html
  const idRegex = new RegExp(`id=["']${id}["']`, 'i');
  if (!idRegex.test(html)) {
    missingListenerTargets.push({ id, method });
  }
}
console.log('1. Listener targets without null check whose ID does NOT exist statically:', missingListenerTargets);

// 2. Check all getElementById calls
const allGetIds = new Set();
const allIdsRegex = /getElementById\(["']([^"']+)["']\)/g;
while ((m = allIdsRegex.exec(html)) !== null) {
  allGetIds.add(m[1]);
}

const missingIds = [];
for (const id of allGetIds) {
  const idRegex = new RegExp(`id=["']${id}["']`, 'i');
  if (!idRegex.test(html)) {
    missingIds.push(id);
  }
}
console.log('\n2. IDs queried with getElementById that do not exist in HTML/templates:', missingIds);

// 3. Check inline onclick attributes in HTML
const onclickRegex = /onclick=["']([^"']+)["']/g;
const onclicks = [];
while ((m = onclickRegex.exec(html)) !== null) {
  onclicks.push(m[1]);
}
console.log('\n3. Inline onclicks total:', onclicks.length);

// Check if any onclick calls an undefined function
onclicks.forEach(c => {
  const fnMatch = c.match(/^([a-zA-Z0-9_$.]+)\s*\(/);
  if (fnMatch) {
    const fn = fnMatch[1];
    // check if fn is defined
    if (fn.startsWith('window.')) {
      const real = fn.replace('window.', '');
      if (!html.includes(real)) console.log('  POTENTIAL ERROR: onclick calls missing function:', fn);
    }
  }
});

// 4. Check all template IDs referenced in ROUTES
const routesMatch = html.match(/const ROUTES = \{([\s\S]*?)\};/);
if (routesMatch) {
  const tplRegex = /tpl:\s*["']([^"']+)["']/g;
  let t;
  while ((t = tplRegex.exec(routesMatch[1])) !== null) {
    const tplId = t[1];
    const exists = html.includes(`id="${tplId}"`);
    console.log(`4. Template ${tplId} exists: ${exists}`);
  }
}

// 5. Check CSS for broken syntax or errors
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
if (styleMatch) {
  const css = styleMatch[1];
  // Check for broken calc() or invalid syntax
  const brokenCalc = css.match(/calc\([^)]*$/m);
  if (brokenCalc) console.log('5. Broken calc in CSS:', brokenCalc);
  else console.log('5. CSS calc checks: OK');
}
