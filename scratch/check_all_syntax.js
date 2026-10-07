const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'scratch') checkDir(full);
    } else if (f.endsWith('.js')) {
      try {
        execSync(`node --check "${full}"`);
        console.log('✓ OK: ' + full);
      } catch (e) {
        console.error('✗ ERROR: ' + full);
      }
    }
  }
}
checkDir('.');
