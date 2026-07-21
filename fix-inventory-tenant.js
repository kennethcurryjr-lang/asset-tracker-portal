const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Inventory.js');

if (!fs.existsSync(targetPath)) {
  console.error("❌ src/Inventory.js not found!");
  process.exit(1);
}

let code = fs.readFileSync(targetPath, 'utf8');

// Update isAdmin and userClientId checks to use Amplify v6 profile structure
const oldCheck = `const userClientId = user?.attributes?.["custom:clientId"] || auth?.user?.profile?.["custom:clientId"];
  const isAdmin = user?.signInUserSession?.idToken?.payload?.["cognito:groups"]?.includes("Admin");`;

const newCheck = `const uTenant = user?.profile?.['custom:tenant_id'] || user?.profile?.['custom:clientId'] || 'GLOBAL_ADMIN';
  const userGroups = user?.profile?.['cognito:groups'] || [];
  const isAdmin = uTenant === 'GLOBAL_ADMIN' || userGroups.includes('Admins') || userGroups.includes('Admin');
  const userClientId = uTenant;`;

code = code.replace(oldCheck, newCheck);

fs.writeFileSync(targetPath, code, 'utf8');
console.log("✅ Successfully patched src/Inventory.js!");
