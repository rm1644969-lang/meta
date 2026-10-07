const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Trace every <div> open and close with line numbers
const lines = html.split('\n');
const stack = [];

lines.forEach((line, lineIdx) => {
  // Regex to match tags while ignoring tags inside <script> and <style>
  // Let's check which line opening/closing divs don't match
});

// Let's check templates:
const tplRegex = /<template\s+id=["']([^"']+)["']>([\s\S]*?)<\/template>/g;
let m;
while ((m = tplRegex.exec(html)) !== null) {
  const id = m[1];
  const content = m[2];
  const opens = (content.match(/<div[\s>]/gi) || []).length;
  const closes = (content.match(/<\/div>/gi) || []).length;
  if (opens !== closes) {
    console.log(`Template ${id}: open divs = ${opens}, close divs = ${closes}, diff = ${opens - closes}`);
  }
}
