const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Let's inspect all warnings/errors that standard html tools check
// Check tags matching
const tagRegex = /<\/?([a-zA-Z0-9\-]+)(?:\s+[^>]*)?>/g;
let match;
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const stack = [];
const lines = html.split('\n');

// Also check css inside <style>
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
if (styleMatch) {
  console.log('Style length:', styleMatch[1].length);
}

// Let's search for common VS Code HTML warnings:
// 1. Duplicate attributes on an element
const dupAttrRegex = /<([a-zA-Z0-9\-]+)(\s+[^>]+)>/g;
let elemMatch;
let dupAttrsFound = 0;
while ((elemMatch = dupAttrRegex.exec(html)) !== null) {
  const [full, tag, attrsStr] = elemMatch;
  // find attribute names
  const attrRegex = /([a-zA-Z0-9\-:]+)(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g;
  let aMatch;
  const attrNames = [];
  while ((aMatch = attrRegex.exec(attrsStr)) !== null) {
    attrNames.push(aMatch[1].toLowerCase());
  }
  const seen = new Set();
  for (const name of attrNames) {
    if (seen.has(name)) {
      console.log(`Duplicate attribute "${name}" in <${tag}>:`, full.slice(0, 100));
      dupAttrsFound++;
    }
    seen.add(name);
  }
}
console.log('Duplicate attributes found:', dupAttrsFound);

// Check for unclosed tags or syntax issues
