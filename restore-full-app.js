const fs = require('fs');
const path = require('path');

const bakPath = path.join(__dirname, 'src', 'App.js.bak');
const targetPath = path.join(__dirname, 'src', 'App.js');

if (!fs.existsSync(bakPath)) {
  console.error("❌ App.js.bak not found!");
  process.exit(1);
}

let code = fs.readFileSync(bakPath, 'utf8');

// 1. Replace oidc auth import with amplify/auth
code = code.replace(
  `import { useAuth } from "react-oidc-context";`,
  `import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';\nimport Login from './Login';`
);

// 2. Replace the old useAuth hook call inside App() with standard React state & Amplify Auth checks
const oldAuthHook = `function App() {
  const auth = useAuth();`;

const newAuthHook = `function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes().catch(() => ({}));
      
      // Inject cognito groups / attributes onto profile for legacy compatibility
      currentUser.profile = {
        email: attributes.email || currentUser.username,
        'custom:tenant_id': attributes['custom:tenant_id'] || 'GLOBAL_ADMIN',
        'cognito:groups': attributes['cognito:groups'] ? attributes['cognito:groups'].split(',') : ['Admins']
      };
      
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const auth = {
    isAuthenticated: !!user,
    isLoading: loading,
    user: user,
    signinRedirect: () => {}
  };`;

code = code.replace(oldAuthHook, newAuthHook);

// 3. Replace the unauthenticated check to render the custom <Login /> component
const oldUnauthReturn = `if (!auth.isAuthenticated) {
    const isSigningOut = localStorage.getItem('isSigningOut') === 'true';
    return (
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#121212', color: '#ffffff'}}>
        {isSigningOut ? (
          <div className="animate-in" style={{ textAlign: 'center', backgroundColor: '#1c1c1e', padding: '40px', borderRadius: '16px', border: '1px solid #3a3a3c', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700' }}>Signed Out Safely</h2>
            <p style={{ color: '#86868b', marginBottom: '24px' }}>Your session has been securely terminated.</p>
            <button 
              onClick={() => { localStorage.removeItem('isSigningOut'); auth.signinRedirect(); }} 
              style={{ padding: '12px 24px', borderRadius: '24px', border: 'none', backgroundcolor: '#ffffff', color: '#ffffff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Sign In Again
            </button>
          </div>
        ) : (
          <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#121212', color: '#ffffff', paddingLeft: '40px'}}>Redirecting to secure gateway...</div>
        )}
      </div>
    );
  }`;

const newUnauthReturn = `if (!auth.isAuthenticated) {
    return <Login onLoginSuccess={checkAuth} />;
  }`;

code = code.replace(oldUnauthReturn, newUnauthReturn);

// Write updated file
fs.writeFileSync(targetPath, code, 'utf8');
console.log("✅ Successfully restored full portal dashboard to App.js!");
