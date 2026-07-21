import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
        }
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Check email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#fff',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Dynamic Ambient Mesh Glows in Background */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 122, 255, 0.18) 0%, rgba(9, 13, 22, 0) 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -60%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(77, 163, 255, 0.12) 0%, rgba(9, 13, 22, 0) 70%)',
        top: '20%',
        left: '30%',
        pointerEvents: 'none'
      }} />

      {/* Global CSS for Animations and Custom Focus States */}
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
        .glass-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background-color: rgba(15, 23, 42, 0.6);
          color: #fff;
          font-size: 14px;
          transition: all 0.2s ease-in-out;
          box-sizing: border-box;
        }
        .glass-input:focus {
          outline: none;
          border-color: #007aff;
          box-shadow: 0 0 16px rgba(0, 122, 255, 0.4);
          background-color: rgba(15, 23, 42, 0.85);
        }
        .gradient-btn {
          margin-top: 8px;
          padding: 12px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #0052cc 0%, #007aff 100%);
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 4px 15px rgba(0, 82, 204, 0.4);
        }
        .gradient-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 122, 255, 0.6);
        }
        .gradient-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      {/* Main Glass Card Wrapper */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '360px',
        padding: '40px 32px',
        borderRadius: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 82, 204, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>

        {/* Dynamic Animated Header Lockup */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <svg width="80" height="66" viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(rgba(0, 122, 255, 0.5) 0px 4px 12px)' }}>
            <path d="M50 5 L95 25 L50 45 L5 25 Z" fill="#0052cc"></path>
            <path d="M50 25 L95 45 L50 65 L5 45 Z" fill="#007aff"></path>
            <path d="M35 25 L60 25 L60 15 L85 35 L60 55 L60 45 L35 45 Z" fill="#ffffff"></path>
          </svg>

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', fontFamily: '"SF Pro Display", -apple-system, sans-serif', fontWeight: 900, fontSize: '22px', letterSpacing: '0.5px' }}>
            <span className="kinetic-shimmer">KINETIC</span>
            <span style={{ color: '#ffcc00' }}>CARDS<span style={{ fontSize: '12px', verticalAlign: 'super', marginLeft: '2px' }}>™</span></span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {error && (
            <div style={{
              color: '#f87171',
              fontSize: '13px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px 14px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.3px' }}>EMAIL ADDRESS</label>
            <input 
              type="email" name="username" autoComplete="username" 
              className="glass-input"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@company.com"
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.3px' }}>PASSWORD</label>
            <input 
              type="password" name="password" autoComplete="current-password" 
              className="glass-input"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>

          {/* Form Options: Remember Me & Forgot Password */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '-4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#007aff', cursor: 'pointer' }}
              />
              Remember me
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your system administrator to reset your credentials.'); }} style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>

          <button 
            type="submit" 
            className="gradient-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
