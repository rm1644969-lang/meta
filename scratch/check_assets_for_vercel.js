const fs = require('fs');
const path = require('path');

console.log("=== CHECKING ASSETS AND VERCEL READINESS ===");

const indexHtml = fs.readFileSync('index.html', 'utf8');

// Find all local asset references
const regex = /(?:src|href|url)\s*=\s*["']([^"']+\.(?:png|jpg|jpeg|svg|gif|webp|ico|json))["']/gi;
let match;
const localAssets = new Set();
while ((match = regex.exec(indexHtml)) !== null) {
  const asset = match[1];
  if (!asset.startsWith('http://') && !asset.startsWith('https://') && !asset.startsWith('//')) {
    localAssets.add(asset);
  }
}

console.log("Found local assets referenced in index.html:");
let missingCount = 0;
localAssets.forEach(asset => {
  const cleanPath = asset.split('?')[0].split('#')[0];
  const exists = fs.existsSync(cleanPath);
  if (exists) {
    console.log(`  ✓ EXISTS: ${cleanPath}`);
  } else {
    console.log(`  ✗ MISSING: ${cleanPath}`);
    missingCount++;
  }
});

console.log(`\nResult: ${localAssets.size - missingCount}/${localAssets.size} assets exist.`);
if (missingCount === 0) {
  console.log("🎉 ALL ASSETS EXIST! Ready for Vercel deployment.");
} else {
  console.log(`⚠️ ${missingCount} assets are missing!`);
}
