import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { isSignedIn } = await signIn({
        username: email,
        password: password,
      });

      if (isSignedIn) {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff' }}>
      
      {/* Exact Native Glowing Header Lockup */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <svg width="86" height="72" viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0px 4px 8px)' }}>
          <path d="M50 5 L95 25 L50 45 L5 25 Z" fill="#0052cc"></path>
          <path d="M50 25 L95 45 L50 65 L5 45 Z" fill="#007aff"></path>
          <path d="M35 25 L60 25 L60 15 L85 35 L60 55 L60 45 L35 45 Z" fill="#ffffff"></path>
        </svg>

        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', fontFamily: '"SF Pro Display", -apple-system, sans-serif', fontWeight: 900, fontSize: '24px', letterSpacing: '0.5px', filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0px 2px 4px)' }}>
          <style>{`
            @keyframes kineticShimmer {
              0% { background-position: 200% center; }
              100% { background-position: -200% center; }
            }
            .kinetic-shimmer {
              background: linear-gradient(90deg, #ffffff 0%, #ffffff 40%, #4da3ff 50%, #ffffff 60%, #ffffff 100%);
              background-size: 200% auto;
              color: transparent;
              -webkit-background-clip: text;
              background-clip: text;
              animation: kineticShimmer 8s linear infinite;
              display: inline-block;
            }
          `}</style>
          <span className="kinetic-shimmer">KINETIC</span>
          <span style={{ color: '#ffcc00' }}>CARDS<span style={{ fontSize: '13px', verticalAlign: 'super', marginLeft: '2px' }}>™</span></span>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#1e293b', padding: '32px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <h3 style={{ margin: '0 0 8px 0', textAlign: 'center' }}>Sign In</h3>

        {error && <div style={{ color: '#ef4444', fontSize: '14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', color: '#94a3b8' }}>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', color: '#94a3b8' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ marginTop: '8px', padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
