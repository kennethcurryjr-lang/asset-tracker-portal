const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Login.jsx');

if (!fs.existsSync(targetPath)) {
  console.error("❌ src/Login.jsx not found!");
  process.exit(1);
}

let code = fs.readFileSync(targetPath, 'utf8');

// Replace the inline SVG block back to the proper CSGroup image asset
const svgPattern = /<svg[\s\S]*?<\/svg>\s*<div style=\{\{ display: 'flex', gap: '6px'[\s\S]*?<\/div>/;

const properLogo = `<img 
  src="/CSGroup_Logo_Main_White.webp" 
  alt="Kinetic Assets" 
  style={{ height: '75px', objectFit: 'contain', filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.5))' }} 
/>`;

if (svgPattern.test(code)) {
  code = code.replace(svgPattern, properLogo);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log("✅ Successfully restored logo image in Login.jsx!");
} else {
  // Direct string replace fallback
  code = code.replace(/<svg[\s\S]*?<\/svg>/, properLogo);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log("✅ Restored logo via fallback!");
}
