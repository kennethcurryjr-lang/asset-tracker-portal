const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'App.js');
const backupPath = path.join(__dirname, 'src', 'App.js.bak');

if (!fs.existsSync(targetPath)) {
  console.error(`❌ Error: Could not find ${targetPath}`);
  process.exit(1);
}

// 1. Create a backup of App.js
fs.copyFileSync(targetPath, backupPath);
console.log(`📦 Created backup at src/App.js.bak`);

// 2. Prepare new App.js content
const newAppContent = `import React, { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import Login from './Login';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#fff' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Show custom in-app login page if not authenticated
  if (!user) {
    return <Login onLoginSuccess={checkAuth} />;
  }

  // Main portal view when authenticated
  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #334155' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Kinetic Assets Portal</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>{user.username || user.userId}</span>
          <button 
            onClick={async () => { await signOut(); checkAuth(); }}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#1e293b', color: '#fff', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ padding: '24px' }}>
        <h3>Welcome to your Portal</h3>
      </main>
    </div>
  );
}
`;

// 3. Write updated content to src/App.js
fs.writeFileSync(targetPath, newAppContent, 'utf8');
console.log(`✅ Successfully patched src/App.js!`);
