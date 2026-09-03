import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, Mail, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Check if email passed in query string or currentUser stored
    const paramEmail = searchParams.get('email');
    if (paramEmail) {
      setEmail(paramEmail);
    } else {
      try {
        const stored = localStorage.getItem('taaskr_current_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.email) setEmail(parsed.email);
        }
      } catch (e) {}
    }
  }, [searchParams]);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim() || !otp.trim()) {
      setError('Please provide your email and 6-digit verification code');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.auth.verifyEmail(email.trim(), otp.trim());
      setVerified(true);
      setMessage(res.message || 'Email verified successfully!');
      
      // Update local storage user if exists
      try {
        const stored = localStorage.getItem('taaskr_current_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.emailVerified = true;
          localStorage.setItem('taaskr_current_user', JSON.stringify(parsed));
        }
      } catch (e) {}
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.sendVerificationOtp(email.trim());
      setMessage(res.message || `Verification code sent to ${email}. Please check your inbox.`);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: verified ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-subtle)',
            color: verified ? '#10B981' : 'var(--primary)',
            marginBottom: '0.85rem'
          }}>
            {verified ? <CheckCircle2 size={28} /> : <ShieldCheck size={28} />}
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            {verified ? 'Email Verified!' : 'Verify Your Email'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.5 }}>
            {verified
              ? 'Your account is now fully verified. You can now access all services securely.'
              : `Enter the 6-digit verification code sent to ${email || 'your email address'}.`}
          </p>
        </div>

        {/* Alerts */}
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

        {!verified ? (
          <form onSubmit={handleVerify}>
            {!searchParams.get('email') && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
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
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>6-Digit Verification Code</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valid for 15 mins</span>
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

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }} 
              disabled={loading}
            >
              <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
              <ArrowRight size={15} />
            </button>

            {/* Resend Action */}
            <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Didn't receive the code? </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading || !email}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: 0
                }}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => navigate('/')} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <span>Continue to Taaskr</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
