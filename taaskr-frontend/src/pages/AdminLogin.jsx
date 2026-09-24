import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import TaaskrLogo from '../components/TaaskrLogo';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide administrator credentials');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.login(email.trim(), password.trim(), 'ADMIN');
      window.dispatchEvent(new Event('auth_change'));
      window.dispatchEvent(new Event('storage'));

      if (res.role === 'ADMIN') {
        navigate('/admin');
      } else {
        setError('Access Denied: Your account does not have Administrator privileges.');
      }
    } catch (err) {
      setError(err.message || 'Admin authentication failed. Please verify your credentials.');
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
        borderTop: '4px solid #ef4444',
        boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
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
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={13} />
            <span>Executive Command Center</span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
            Admin Portal Sign In
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.45 }}>
            Internal platform oversight, user compliance, and financial reconciliation.
          </p>
        </div>

        {/* Security Warning Notice */}
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '0.65rem 0.85rem',
          fontSize: '0.78rem',
          color: '#f87171',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span>Restricted Portal. Unauthorised access attempts are logged and monitored.</span>
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
            <label className="form-label">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="admin@taaskr.com"
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
              <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
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
              backgroundColor: '#ef4444', 
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
            <span>{loading ? 'Authenticating...' : 'Sign In to Admin Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', fontWeight: 500, textDecoration: 'underline' }}>
            Return to Customer Website
          </Link>
        </div>
      </div>
    </div>
  );
}
