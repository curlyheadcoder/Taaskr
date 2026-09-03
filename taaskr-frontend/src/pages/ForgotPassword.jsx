import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { KeyRound, Mail, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Lock, RefreshCw, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email Request, 2: OTP & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Step 1: Send Forgot Password OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.auth.forgotPassword(email.trim());
      setMessage(res.message || `Password reset code sent to ${email}`);
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit reset code');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.auth.resetPassword(email.trim(), otp.trim(), newPassword);
      setMessage(res.message || 'Password successfully updated!');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setMessage(`A fresh reset code has been sent to ${email}`);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: '#cbd5e1' };
    let s = 0;
    if (pass.length >= 6) s++;
    if (pass.length >= 10) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;

    if (s <= 2) return { score: 33, text: 'Weak', color: '#EF4444' };
    if (s <= 4) return { score: 66, text: 'Moderate', color: '#F59E0B' };
    return { score: 100, text: 'Strong', color: '#10B981' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)',
      padding: '2rem 1rem'
    }}>
      <div className="panel animate-fade-in" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.25rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Brand & Security Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: 'var(--primary-subtle)',
            color: 'var(--primary)',
            marginBottom: '0.85rem'
          }}>
            {step === 3 ? (
              <CheckCircle2 size={28} color="#10B981" />
            ) : (
              <KeyRound size={26} />
            )}
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            {step === 1 && 'Reset Your Password'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Password Reset Complete!'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.5 }}>
            {step === 1 && "Enter the email associated with your Taaskr account to receive a 6-digit recovery code."}
            {step === 2 && `We've sent a 6-digit code to ${email}. Please enter it below along with your new password.`}
            {step === 3 && "Your password has been successfully updated. You can now sign in with your new credentials."}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div style={{
            background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            color: 'var(--error)',
            padding: '0.75rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
            padding: '0.75rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem' }} 
              disabled={loading}
            >
              <span>{loading ? 'Sending Code...' : 'Send Recovery Code'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP & Set New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>6-Digit Recovery Code</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Check your inbox</span>
              </label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                className="form-control"
                style={{
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  letterSpacing: '0.35em',
                  fontWeight: 700,
                  fontFamily: 'monospace'
                }}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              {newPassword && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ height: '4px', width: '100%', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${strength.score}%`, height: '100%', background: strength.color, transition: 'all 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: strength.color, marginTop: '2px', display: 'block' }}>
                    Strength: {strength.text}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', marginBottom: '0.85rem' }} 
              disabled={loading}
            >
              <span>{loading ? 'Resetting Password...' : 'Save New Password'}</span>
              <ShieldCheck size={16} />
            </button>

            {/* Resend Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}
              >
                <ArrowLeft size={13} />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success State */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => navigate('/login')} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <span>Proceed to Sign In</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Return to Login */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={14} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
