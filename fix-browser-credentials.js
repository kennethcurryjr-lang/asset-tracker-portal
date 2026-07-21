const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Login.jsx');

if (!fs.existsSync(targetPath)) {
  console.error("❌ src/Login.jsx not found!");
  process.exit(1);
}

let code = fs.readFileSync(targetPath, 'utf8');

// Insert PasswordCredential save call on successful sign-in
const oldAuthSuccess = `if (isSignedIn) {`;
const newAuthSuccess = `if (isSignedIn) {
        // Explicitly trigger browser password manager store if supported
        if (window.PasswordCredential && navigator.credentials) {
          try {
            const cred = new window.PasswordCredential({
              id: email,
              password: password,
              name: email
            });
            await navigator.credentials.store(cred);
          } catch (cErr) {
            console.log('Credential save skipped:', cErr);
          }
        }`;

code = code.replace(oldAuthSuccess, newAuthSuccess);

fs.writeFileSync(targetPath, code, 'utf8');
console.log("✅ Successfully added native PasswordCredential store to Login.jsx!");
