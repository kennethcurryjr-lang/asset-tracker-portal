const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Login.jsx');

if (!fs.existsSync(targetPath)) {
  console.error("❌ src/Login.jsx not found!");
  process.exit(1);
}

let code = fs.readFileSync(targetPath, 'utf8');

// Add autoComplete props to email input
code = code.replace(
  'type="email"',
  'type="email" name="username" autoComplete="username"'
);

// Add autoComplete props to password input
code = code.replace(
  'type="password"',
  'type="password" name="password" autoComplete="current-password"'
);

fs.writeFileSync(targetPath, code, 'utf8');
console.log("✅ Successfully updated Login.jsx with browser password manager support!");
