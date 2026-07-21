import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';

export default function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // --- SIGN IN HANDLER ---
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });
      
      if (isSignedIn) {
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
        if (onLoginSuccess) onLoginSuccess();
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        setConfirmStep(true);
        setInfoMsg('Please enter the verification code sent to your email.');
      } else {
        setError(`Additional step required: ${nextStep.signInStep}`);
      }
    } catch (err) {
      if (err.name === 'UserNotConfirmedException') {
        setConfirmStep(true);
        setInfoMsg('Account unconfirmed. Please enter the verification code.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- SIGN UP HANDLER ---
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email: email
          }
        }
      });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setConfirmStep(true);
        setInfoMsg(`Verification code sent to ${email}`);
      } else {
        setInfoMsg('Account created successfully! You can now sign in.');
        setIsSignUp(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // --- CONFIRM SIGN UP HANDLER ---
  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: code
      });

      if (isSignUpComplete) {
        setInfoMsg('Account verified! Signing you in...');
        // Auto sign in after confirmation
        const { isSignedIn } = await signIn({ username: email, password });
        if (isSignedIn && onLoginSuccess) {
          onLoginSuccess();
        } else {
          setConfirmStep(false);
          setIsSignUp(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD REQUEST ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      const output = await resetPassword({ username: email });
      if (output.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
        setForgotStep(true);
        setInfoMsg(`Verification code sent to ${email}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // --- CONFIRM RESET PASSWORD ---
  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword
      });
      setInfoMsg('Password reset successfully! Please sign in with your new password.');
      setIsForgotPassword(false);
      setForgotStep(false);
      setPassword(newPassword);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0d14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'rgba(18, 24, 38, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        padding: '40px 32px',
        boxSizing: 'border-box'
      }}>
        {/* LOGO HEADER */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <img 
  src="/CSGroup_Logo_Main_White.webp" 
  alt="Kinetic Assets" 
  style={{ height: '75px', objectFit: 'contain', filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.5))' }} 
/>
        </div>

        {/* FEEDBACK MESSAGES */}
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}
        {infoMsg && (
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px' }}>
            ℹ️ {infoMsg}
          </div>
        )}

        {/* --- VIEW 1: EMAIL VERIFICATION CODE STEP --- */}
        {confirmStep ? (
          <form onSubmit={handleConfirmSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '18px', textAlign: 'center' }}>Verify Email Address</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', margin: 0 }}>Enter the code sent to {email}</p>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>VERIFICATION CODE</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '16px', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '4px' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#007aff', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
            >
              {loading ? 'Verifying...' : 'Confirm Account'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmStep(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}
            >
              ← Back to Login
            </button>
          </form>
        ) : isForgotPassword ? (
          /* --- VIEW 2: FORGOT PASSWORD FLOW --- */
          <form onSubmit={forgotStep ? handleConfirmResetPassword : handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '18px', textAlign: 'center' }}>Reset Password</h3>
            
            {!forgotStep ? (
              <>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#007aff', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {loading ? 'Sending Code...' : 'Send Reset Code'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>VERIFICATION CODE</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="123456"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', boxSizing: 'border-box', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>NEW PASSWORD</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#007aff', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {loading ? 'Resetting...' : 'Set New Password'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => { setIsForgotPassword(false); setForgotStep(false); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}
            >
              ← Back to Sign In
            </button>
          </form>
        ) : (
          /* --- VIEW 3: MAIN SIGN IN / SIGN UP FORM --- */
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>EMAIL ADDRESS</label>
              <input
                type="email"
                name="username"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>PASSWORD</label>
              <input
                type="password"
                name="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            {isSignUp && (
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>CONFIRM PASSWORD</label>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {!isSignUp && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#007aff' }}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  style={{ background: 'none', border: 'none', color: '#007aff', cursor: 'pointer', fontSize: '13px', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#007aff',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '8px',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            {/* SIGN IN / SIGN UP TOGGLE FOOTER */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', marginTop: '8px', textAlign: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setInfoMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#007aff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
