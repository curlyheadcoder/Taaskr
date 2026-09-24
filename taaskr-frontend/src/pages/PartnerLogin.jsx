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
      position: 'relative',
      background: 'radial-gradient(circle at 50% 20%, rgba(6, 30, 22, 0.95) 0%, #030d09 100%)'
    }}>
      {/* Emerald Ambient Mesh */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(52, 211, 153, 0.22) 0%, rgba(0,0,0,0) 70%)',
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
            <span>Field Technician & Driver Console</span>
          </div>

          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#F8FAFC',
            marginBottom: '0.3rem',
            letterSpacing: '-0.03em'
          }}>
            Service Partner Sign In
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            Access assigned job dispatches, turn-by-turn navigation, and proof of service.
          </p>
        </div>

        {/* Glassmorphic Panel */}
        <div style={{
          backgroundColor: 'rgba(6, 30, 22, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          boxShadow: '0 20px 40px -10px rgba(52, 211, 153, 0.22)',
          padding: '2.25rem'
        }}>
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
                Worker Login Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="worker@provider.com"
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
                <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>
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
                backgroundColor: '#34d399',
                color: '#030D09',
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
              <span>{loading ? 'Authenticating...' : 'Sign In as Worker'}</span>
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
            <div style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
              Field worker accounts are created by your business manager.
            </div>
            <div style={{ marginTop: '0.65rem', fontSize: '0.78rem' }}>
              <span style={{ color: '#64748B' }}>Not a worker? </span>
              <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                Customer Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
