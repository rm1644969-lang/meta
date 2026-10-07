const fs = require('fs');
const orbPng = fs.readFileSync('assets/meta-ai-logo.png');
const orbBase64 = 'data:image/png;base64,' + orbPng.toString('base64');

function makeSvg({ id, badge1, badge2, badge2Color, title, subtitle, price, priceColor, glowColor, bgStop }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 600 340" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgStop}"/>
      <stop offset="50%" stop-color="#090b14"/>
      <stop offset="100%" stop-color="#04060a"/>
    </linearGradient>
    <radialGradient id="glow_${id}" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow_${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${glowColor}" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="600" height="340" rx="18" fill="url(#bg_${id})"/>
  <circle cx="300" cy="130" r="160" fill="url(#glow_${id})"/>

  <g opacity="0.12" stroke="#ffffff" stroke-width="1">
    <line x1="0" y1="85" x2="600" y2="85"/>
    <line x1="0" y1="170" x2="600" y2="170"/>
    <line x1="0" y1="255" x2="600" y2="255"/>
    <line x1="150" y1="0" x2="150" y2="340"/>
    <line x1="300" y1="0" x2="300" y2="340"/>
    <line x1="450" y1="0" x2="450" y2="340"/>
  </g>

  <circle cx="300" cy="125" r="68" fill="none" stroke="${glowColor}" stroke-width="2" opacity="0.4" stroke-dasharray="6 4"/>
  <circle cx="300" cy="125" r="76" fill="none" stroke="${glowColor}" stroke-width="1" opacity="0.2"/>

  <g filter="url(#shadow_${id})">
    <image href="${orbBase64}" x="235" y="60" width="130" height="130"/>
  </g>

  <g>
    <rect x="36" y="24" width="146" height="28" rx="8" fill="rgba(255,255,255,0.06)" stroke="${glowColor}" stroke-width="1.2"/>
    <text x="109" y="42" fill="${glowColor}" font-family="'Inter', sans-serif" font-size="11.5" font-weight="800" text-anchor="middle" letter-spacing="1">${badge1}</text>
  </g>

  <g>
    <rect x="375" y="24" width="189" height="28" rx="8" fill="rgba(255,255,255,0.06)" stroke="${badge2Color}" stroke-width="1.2"/>
    <text x="469" y="42" fill="${badge2Color}" font-family="'Inter', sans-serif" font-size="11" font-weight="800" text-anchor="middle">${badge2}</text>
  </g>

  <text x="300" y="234" fill="#ffffff" font-family="'Inter', sans-serif" font-size="22" font-weight="900" text-anchor="middle" letter-spacing="-0.3">${title}</text>
  <text x="300" y="262" fill="#cbd5e1" font-family="'Inter', sans-serif" font-size="13" font-weight="500" text-anchor="middle">${subtitle}</text>

  <rect x="220" y="278" width="160" height="34" rx="17" fill="${priceColor}"/>
  <text x="300" y="300" fill="#ffffff" font-family="'Inter', sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="0.5">${price}</text>
</svg>`;
}

// 1. Meta AI 0.30 (No Replace)
fs.writeFileSync('assets/meta-ai-030.svg', makeSvg({
  id: '030',
  badge1: 'META AI 0.30',
  badge2: '⚠️ STRICTLY NO REPLACE',
  badge2Color: '#ef4444',
  title: 'Meta AI Account .30 (No Replace)',
  subtitle: 'Wholesale Budget · কেনার পর ব্যান দিলে নো রিপ্লেস',
  price: '৳0.30 / UNIT',
  priceColor: '#d97706',
  glowColor: '#f59e0b',
  bgStop: '#221102'
}));

// 2. Meta AI 0.40 (With Replace)
fs.writeFileSync('assets/meta-ai-040.svg', makeSvg({
  id: '040',
  badge1: 'META AI 0.40',
  badge2: '✓ 24H WITH REPLACE',
  badge2Color: '#00e676',
  title: 'Meta AI Account .40 (With Replace)',
  subtitle: 'Full 24-Hour Guarantee · ২৪ ঘণ্টা ফুল রিপ্লেসমেন্ট গ্যারান্টি',
  price: '৳0.40 / UNIT',
  priceColor: '#e024c3',
  glowColor: '#e024c3',
  bgStop: '#21051f'
}));

// 3. Meta AI Admin Product 0.50
fs.writeFileSync('assets/meta-ai-050.svg', makeSvg({
  id: '050_admin',
  badge1: 'ADMIN OFFICIAL ⭐',
  badge2: '💎 HORJIN CLEAN IP',
  badge2Color: '#00e676',
  title: 'Meta AI Admin Product .50',
  subtitle: '100% Original Horjin Residential IP · Zero Checkpoint',
  price: '৳0.50 / UNIT',
  priceColor: '#0284c7',
  glowColor: '#00d2ff',
  bgStop: '#02182b'
}));

console.log('Successfully written exact 3 Meta AI SVGs!');
