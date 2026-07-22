const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Inventory.js');
const backupPath = path.join(__dirname, 'src', 'Inventory.js.bak');

if (!fs.existsSync(targetPath)) {
  console.error("❌ src/Inventory.js not found!");
  process.exit(1);
}

// 1. Create a safety backup
fs.copyFileSync(targetPath, backupPath);

let code = fs.readFileSync(targetPath, 'utf8');

const targetStr = `const userClientId = user?.attributes?.["custom:clientId"] || auth?.user?.profile?.["custom:clientId"];
  const isAdmin = user?.signInUserSession?.idToken?.payload?.["cognito:groups"]?.includes("Admin");`;

const replacementStr = `const uTenant = user?.profile?.['custom:tenant_id'] || user?.profile?.['custom:clientId'] || 'GLOBAL_ADMIN';
  const userGroups = user?.profile?.['cognito:groups'] || [];
  const isAdmin = uTenant === 'GLOBAL_ADMIN' || userGroups.includes('Admins') || userGroups.includes('Admin');
  const userClientId = uTenant;`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log("✅ Successfully updated src/Inventory.js!");
} else {
  // Fallback line-by-line replace
  code = code.replace(/const userClientId = [^\n]+/, `const uTenant = user?.profile?.['custom:tenant_id'] || user?.profile?.['custom:clientId'] || 'GLOBAL_ADMIN';\n  const userGroups = user?.profile?.['cognito:groups'] || [];\n  const userClientId = uTenant;`);
  code = code.replace(/const isAdmin = [^\n]+/, `const isAdmin = uTenant === 'GLOBAL_ADMIN' || userGroups.includes('Admins') || userGroups.includes('Admin');`);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log("✅ Successfully updated src/Inventory.js via line replace!");
}
