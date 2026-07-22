const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Inventory.js');

if (!fs.existsSync(targetPath)) {
  console.error("❌ src/Inventory.js not found!");
  process.exit(1);
}

let code = fs.readFileSync(targetPath, 'utf8');

// Replace filteredStock logic to strictly match user's tenant ID
const oldFilter = `const filteredStock = stock.filter(item => {
    // Admin override or explicit clientId ownership match
    if (isAdmin) return true;
    return item.clientId === userClientId;
  })`;

const newFilter = `const filteredStock = stock.filter(item => {
    // Enforce strict tenant matching
    return item.clientId === userClientId;
  })`;

if (code.includes(oldFilter)) {
  code = code.replace(oldFilter, newFilter);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log("✅ Patched Inventory.js to strictly filter by userClientId!");
} else {
  // Regex fallback
  code = code.replace(/const filteredStock = stock\.filter\(item => \{[\s\S]*?return item\.clientId === userClientId;?\s*\}\);?/, 
    `const filteredStock = stock.filter(item => item.clientId === userClientId);`);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log("✅ Updated Inventory.js filter via regex fallback!");
}
