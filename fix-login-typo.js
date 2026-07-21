const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Login.jsx');

if (fs.existsSync(targetPath)) {
  let content = fs.readFileSync(targetPath, 'utf8');
  content = content.replace("fontWeight 600", "fontWeight: 600");
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log("✅ Fixed typo in src/Login.jsx!");
}
