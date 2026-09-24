import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Wrench, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Navigation 
} from 'lucide-react';
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
      setError(err.message || 'Worker authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      backgroundColor: 'var(--bg-page)',
      color: 'var(--text-main)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.85rem' }}>
            <TaaskrLogo size={52} variant="provider" />
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.85rem',
            borderRadius: '20px',
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            color: '#34d399',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            <Wrench size={14} />
            <span>Service Partner Console</span>
          </div>

          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            color: 'var(--text-main)',
            marginBottom: '0.3rem',
            letterSpacing: '-0.03em'
          }}>
            Technician Dispatch Login
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Access assigned daily tasks, live job routes, and proof of work.
          </p>
        </div>

        {/* Dynamic Theme Panel */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          padding: '2.25rem',
          transition: 'all 0.2s ease'
        }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '0.75rem 0.9rem',
              borderRadius: '10px',
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
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Technician Email or Phone
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="tech@taaskr.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem 0.75rem 42px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 44px 0.75rem 42px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
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
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                backgroundColor: '#34d399',
                color: '#064e3b',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px -4px rgba(52, 211, 153, 0.4)'
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dispatch Console'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            fontSize: '0.78rem'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Looking for consumer services? </span>
            <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
              Customer Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
