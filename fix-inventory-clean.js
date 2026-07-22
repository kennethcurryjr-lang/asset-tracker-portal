const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Inventory.js');

if (!fs.existsSync(targetPath)) {
  console.error("❌ src/Inventory.js not found!");
  process.exit(1);
}

let code = fs.readFileSync(targetPath, 'utf8');

// Replace duplicate uTenant/userGroups/isAdmin block with a clean single block
const messyPattern = /(?:const (?:uTenant|userGroups|isAdmin|userClientId) = [^\n]+\n\s*){2,}/g;

const cleanBlock = `const uTenant = user?.profile?.['custom:tenant_id'] || user?.profile?.['custom:clientId'] || 'GLOBAL_ADMIN';
  const userGroups = user?.profile?.['cognito:groups'] || [];
  const isAdmin = uTenant === 'GLOBAL_ADMIN' || userGroups.includes('Admins') || userGroups.includes('Admin');
  const userClientId = uTenant;
`;

if (messyPattern.test(code)) {
  code = code.replace(messyPattern, cleanBlock);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log("✅ Successfully cleaned up duplicate declarations in src/Inventory.js!");
} else {
  // If pattern matching fails, do a direct string replace of the known duplicate chunk
  const exactDuplicate = `const userGroups = user?.profile?.['cognito:groups'] || [];
  const isAdmin = uTenant === 'GLOBAL_ADMIN' || userGroups.includes('Admins') || userGroups.includes('Admin');
  const uTenant = user?.profile?.['custom:tenant_id'] || user?.profile?.['custom:clientId'] || 'GLOBAL_ADMIN';
  const userGroups = user?.profile?.['cognito:groups'] || [];
  const userClientId = uTenant;`;

  if (code.includes(exactDuplicate)) {
    code = code.replace(exactDuplicate, cleanBlock.trim());
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log("✅ Successfully replaced exact duplicate chunk!");
  } else {
    console.log("⚠️ Could not match pattern automatically. Restoring from backup...");
    const backupPath = path.join(__dirname, 'src', 'Inventory.js.bak');
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, targetPath);
      console.log("📦 Restored src/Inventory.js from backup.");
    }
  }
}
