const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Login.jsx');

if (!fs.existsSync(targetPath)) {
  console.error("❌ src/Login.jsx not found!");
  process.exit(1);
}

// Create backup
fs.copyFileSync(targetPath, path.join(__dirname, 'src', 'Login.jsx.bak'));

let code = fs.readFileSync(targetPath, 'utf8');

// Ensure signUp is imported from aws-amplify/auth
code = code.replace(
  `import { signIn, resetPassword, confirmResetPassword } from 'aws-amplify/auth';`,
  `import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';`
);

// Insert mode state and sign-up handler logic
const stateInjection = `  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmStep, setConfirmSignUpStep] = useState(false);
  const [code, setCode] = useState('');`;

code = code.replace(`export default function Login({ onLoginSuccess }) {`, `export default function Login({ onLoginSuccess }) {\n${stateInjection}`);

fs.writeFileSync(targetPath, code, 'utf8');
console.log("✅ Successfully updated Login.jsx!");
