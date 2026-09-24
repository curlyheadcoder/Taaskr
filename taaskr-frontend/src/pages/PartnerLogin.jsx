import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, Wrench, Navigation } from 'lucide-react';
import TaaskrLogo from '../components/TaaskrLogo';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your worker email and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.login(email.trim(), password.trim(), 'SERVICE_PARTNER');
      window.dispatchEvent(new Event('auth_change'));
      window.dispatchEvent(new Event('storage'));

      if (res.role === 'ADMIN') {
        navigate('/admin');
      } else if (res.role === 'PROVIDER') {
        navigate('/provider');
      } else if (res.role === 'SERVICE_PARTNER') {
        navigate('/partner');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Worker authentication failed. Please verify your assigned worker login details.');
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
        maxWidth: '430px',
        width: '100%',
        padding: '2.25rem',
        borderRadius: '16px',
        borderTop: '4px solid #10b981'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <TaaskrLogo size={46} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.75rem'
          }}>
            <Wrench size={13} />
            <span>Field Technician & Driver Console</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
            Service Partner Sign In
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.45 }}>
            View assigned task dispatches, update job status, and capture proof of service.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-bg, rgba(239, 68, 68, 0.12))',
            border: '1px solid var(--error-border, rgba(239, 68, 68, 0.3))',
            color: 'var(--error, #ef4444)',
            padding: '0.75rem 0.85rem',
            borderRadius: '8px',
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

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Worker Login Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="worker@provider.com"
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

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ 
              width: '100%', 
              backgroundColor: '#10b981', 
              color: '#FFFFFF',
              fontWeight: 700,
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }} 
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as Service Worker'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Worker logins are provisioned by your Provider business administrator.</span>
          </div>
          <div style={{ fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Not a worker? </span>
            <Link to="/login" style={{ color: '#0284c7', fontWeight: 600 }}>Customer Sign In</Link>
            <span style={{ color: 'var(--text-muted)' }}> • </span>
            <Link to="/provider-login" style={{ color: '#8b5cf6', fontWeight: 600 }}>Provider Console</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
