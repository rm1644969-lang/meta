const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'marketpro.html');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('assets/logo.svg')) {
    content = content.replace(/<link rel="icon" href="assets\/logo\.svg">/g, '<link rel="icon" type="image/png" href="assets/meta-ai-logo.png">');
    fs.writeFileSync(f, content);
    console.log('Updated favicon in', f);
  }
});
