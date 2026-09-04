import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ShieldCheck, Mail, Phone, AlertCircle, CheckCircle2, 
  ArrowRight, RefreshCw, ArrowLeft, KeyRound, Sparkles 
} from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'email' or 'phone'
  const initialMode = searchParams.get('type') === 'phone' ? 'phone' : 'email';
  const [mode, setMode] = useState(initialMode);

  // Email verification state
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);

  // Phone verification state
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // General state
  const [devCode, setDevCode] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'phone') setMode('phone');
    else if (typeParam === 'email') setMode('email');

    const paramEmail = searchParams.get('email');
    const paramPhone = searchParams.get('phone');

    if (paramEmail) setEmail(paramEmail);
    if (paramPhone) setPhone(paramPhone);

    // Read stored current user profile if available
    try {
      const stored = localStorage.getItem('taaskr_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email && !paramEmail) setEmail(parsed.email);
        if (parsed?.phone && !paramPhone) setPhone(parsed.phone);
        if (parsed?.emailVerified) setEmailVerified(true);
        if (parsed?.phoneVerified) setPhoneVerified(true);
      }
    } catch (e) {}

    // Check live profile
    api.auth.me().then(user => {
      if (user) {
        if (user.email) setEmail(user.email);
        if (user.phone && !user.phone.startsWith('NA-')) setPhone(user.phone);
        if (user.emailVerified) setEmailVerified(true);
        if (user.phoneVerified) setPhoneVerified(true);
      }
    }).catch(() => {});
  }, [searchParams]);

  // Timers for resend cooldowns
  useEffect(() => {
    let interval;
    if (emailResendCooldown > 0) {
      interval = setInterval(() => setEmailResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [emailResendCooldown]);

  useEffect(() => {
    let interval;
    if (phoneResendCooldown > 0) {
      interval = setInterval(() => setPhoneResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phoneResendCooldown]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setMessage('');
    setDevCode(null);
    setSearchParams(prev => {
      prev.set('type', newMode);
      return prev;
    });
  };

  const updateLocalStorageUser = (updates) => {
    try {
      const stored = localStorage.getItem('taaskr_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...parsed, ...updates };
        localStorage.setItem('taaskr_current_user', JSON.stringify(merged));
      }
    } catch (e) {}
  };

  // ----------------------------------------
  // EMAIL VERIFICATION HANDLERS
  // ----------------------------------------
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !emailOtp.trim()) {
      setError('Please provide your email and the 6-digit verification code.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.auth.verifyEmail(email.trim(), emailOtp.trim());
      setEmailVerified(true);
      setMessage(res.message || 'Email verified successfully!');
      setDevCode(null);
      updateLocalStorageUser({ emailVerified: true });
    } catch (err) {
      setError(err.message || 'Email verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (!email.trim() || emailResendCooldown > 0 || loading) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.auth.sendVerificationOtp(email.trim());
      setMessage(res.message || `Verification code sent to ${email}. Please check your inbox.`);
      setEmailResendCooldown(60);
      if (res.otp) {
        setDevCode(res.otp);
      }
    } catch (err) {
      setError(err.message || 'Failed to send email verification code.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // PHONE VERIFICATION HANDLERS
  // ----------------------------------------
  const handleSendPhoneOtp = async (e) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your contact phone number.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.auth.sendPhoneOtp(phone.trim());
      setPhoneOtpSent(true);
      setPhoneResendCooldown(60);
      setMessage(res.message || `Verification code sent to ${phone}.`);
      if (res.otp) {
        setDevCode(res.otp);
      }
    } catch (err) {
      setError(err.message || 'Failed to send phone verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !phoneOtp.trim()) {
      setError('Please provide your phone number and 6-digit verification code.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.auth.verifyPhone(phone.trim(), phoneOtp.trim());
      setPhoneVerified(true);
      setMessage(res.message || 'Phone number verified successfully!');
      setDevCode(null);
      updateLocalStorageUser({ phoneVerified: true, phone: phone.trim() });
    } catch (err) {
      setError(err.message || 'Phone verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentModeVerified = mode === 'email' ? emailVerified : phoneVerified;

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
        maxWidth: '460px',
        width: '100%',
        padding: '2.25rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Mode Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.35rem',
          background: 'var(--bg-subtle)',
          padding: '0.3rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.75rem'
        }}>
          <button
            type="button"
            onClick={() => switchMode('email')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: mode === 'email' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'email' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: mode === 'email' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Mail size={15} />
            <span>Email</span>
            {emailVerified && <CheckCircle2 size={13} color="#10B981" />}
          </button>

          <button
            type="button"
            onClick={() => switchMode('phone')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: mode === 'phone' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'phone' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: mode === 'phone' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Phone size={15} />
            <span>Mobile Phone</span>
            {phoneVerified && <CheckCircle2 size={13} color="#10B981" />}
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: isCurrentModeVerified ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-subtle)',
            color: isCurrentModeVerified ? '#10B981' : 'var(--primary)',
            marginBottom: '0.85rem'
          }}>
            {isCurrentModeVerified ? <CheckCircle2 size={28} /> : mode === 'email' ? <Mail size={26} /> : <Phone size={26} />}
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            {mode === 'email' 
              ? (emailVerified ? 'Email Address Verified' : 'Verify Your Email')
              : (phoneVerified ? 'Phone Number Verified' : 'Verify Mobile Number')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
            {mode === 'email' ? (
              emailVerified 
                ? 'Your email address is verified and active for notifications.' 
                : `Enter the 6-digit OTP sent to ${email || 'your registered email'}.`
            ) : (
              phoneVerified 
                ? 'Your phone number is verified and ready for live order updates.' 
                : (phoneOtpSent ? `Enter the 6-digit OTP sent to ${phone}.` : 'We will send a 6-digit verification code to your phone.')
            )}
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

        {/* Development Helper Box */}
        {devCode && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px dashed rgba(99, 102, 241, 0.4)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
              <Sparkles size={15} />
              <span>Simulated Code: <strong>{devCode}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (mode === 'email') setEmailOtp(devCode);
                else setPhoneOtp(devCode);
              }}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Fill Code
            </button>
          </div>
        )}

        {/* EMAIL TAB FORM */}
        {mode === 'email' && (
          !emailVerified ? (
            <form onSubmit={handleVerifyEmail}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Email Address</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
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
                  <button
                    type="button"
                    onClick={handleResendEmailOtp}
                    disabled={emailResendCooldown > 0 || loading || !email.trim()}
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap', padding: '0 0.85rem', fontSize: '0.8rem' }}
                  >
                    {emailResendCooldown > 0 ? `${emailResendCooldown}s` : 'Send Code'}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>6-Digit Email OTP</label>
                  <button
                    type="button"
                    onClick={handleResendEmailOtp}
                    disabled={emailResendCooldown > 0 || loading || !email.trim()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: emailResendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                      cursor: emailResendCooldown > 0 ? 'default' : 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: 0
                    }}
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>{emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>
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
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  disabled={loading}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem' }} 
                disabled={loading || emailOtp.length < 6}
              >
                <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.08)', 
                padding: '1rem', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '1.25rem',
                color: '#10B981',
                fontSize: '0.85rem',
                fontWeight: 500
              }}>
                ✓ Email ({email}) is verified!
              </div>

              {!phoneVerified ? (
                <button 
                  onClick={() => switchMode('phone')} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem' }}
                >
                  <span>Verify Contact Number Next</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/')} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  <span>Continue to Taaskr</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          )
        )}

        {/* PHONE TAB FORM */}
        {mode === 'phone' && (
          !phoneVerified ? (
            <form onSubmit={handleVerifyPhone}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Contact Phone Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      className="form-control"
                      style={{ paddingLeft: '38px' }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={phoneResendCooldown > 0 || loading || !phone.trim()}
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap', padding: '0 0.85rem', fontSize: '0.8rem' }}
                  >
                    {phoneResendCooldown > 0 ? `${phoneResendCooldown}s` : 'Send Code'}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>6-Digit Mobile OTP</label>
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={phoneResendCooldown > 0 || loading || !phone.trim()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: phoneResendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                      cursor: phoneResendCooldown > 0 ? 'default' : 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: 0
                    }}
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>{phoneResendCooldown > 0 ? `Resend in ${phoneResendCooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>
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
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  disabled={loading}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem' }} 
                disabled={loading || phoneOtp.length < 6}
              >
                <span>{loading ? 'Verifying Phone...' : 'Verify Phone Number'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.08)', 
                padding: '1rem', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '1.25rem',
                color: '#10B981',
                fontSize: '0.85rem',
                fontWeight: 500
              }}>
                ✓ Phone ({phone}) is verified!
              </div>

              {!emailVerified ? (
                <button 
                  onClick={() => switchMode('email')} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem' }}
                >
                  <span>Verify Email Next</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/')} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  <span>Continue to Taaskr</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          )
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
