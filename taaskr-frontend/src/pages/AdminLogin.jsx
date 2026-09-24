import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ShieldAlert 
} from 'lucide-react';
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
        setError('Access Denied: Account does not have Administrator privileges.');
      }
    } catch (err) {
      setError(err.message || 'Admin authentication failed. Please verify your credentials.');
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
      position: 'relative',
      background: 'radial-gradient(circle at 50% 20%, rgba(38, 15, 15, 0.95) 0%, #140707 100%)'
    }}>
      {/* Crimson Ambient Mesh */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(248, 113, 113, 0.22) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.85rem' }}>
            <TaaskrLogo size={52} />
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.85rem',
            borderRadius: '20px',
            backgroundColor: 'rgba(248, 113, 113, 0.15)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            color: '#f87171',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={14} />
            <span>Executive Command Center</span>
          </div>

          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#F8FAFC',
            marginBottom: '0.3rem',
            letterSpacing: '-0.03em'
          }}>
            Admin Portal Sign In
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            System configuration, user compliance, and financial reconciliation.
          </p>
        </div>

        {/* Glassmorphic Panel */}
        <div style={{
          backgroundColor: 'rgba(38, 15, 15, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(248, 113, 113, 0.35)',
          boxShadow: '0 20px 40px -10px rgba(248, 113, 113, 0.22)',
          padding: '2.25rem'
        }}>
          {/* Security Notice */}
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
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
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
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
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.4rem' }}>
                Admin Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="admin@taaskr.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem 0.75rem 42px',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', margin: 0 }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={17} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 44px 0.75rem 42px',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
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
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                backgroundColor: '#f87171',
                color: '#140707',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px -4px rgba(248, 113, 113, 0.4)'
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Admin Portal'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.8125rem'
          }}>
            <Link to="/login" style={{ color: '#94A3B8', textDecoration: 'underline' }}>
              Return to Customer Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
