import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { 
  User, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff 
} from 'lucide-react';
import TaaskrLogo from '../components/TaaskrLogo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.login(email.trim(), password.trim(), 'USER');
      window.dispatchEvent(new Event('auth_change'));
      window.dispatchEvent(new Event('storage'));

      const userRole = res.role;
      const targetFrom = location.state?.from;

      if (userRole === 'ADMIN') {
        navigate('/admin');
      } else if (userRole === 'PROVIDER') {
        navigate('/provider');
      } else if (userRole === 'SERVICE_PARTNER') {
        navigate('/partner');
      } else if (targetFrom) {
        if (typeof targetFrom === 'string') {
          navigate(targetFrom);
        } else {
          navigate(targetFrom.pathname + (targetFrom.search || ''), { state: targetFrom.state });
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
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
        {/* Customer Portal Header */}
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
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--border-light)',
            color: 'var(--primary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            <User size={14} />
            <span>On-Demand Customer Portal</span>
          </div>

          <h1 style={{
            fontSize: '1.9rem',
            fontWeight: 900,
            color: 'var(--text-main)',
            marginBottom: '0.4rem',
            letterSpacing: '-0.025em'
          }}>
            Welcome Back to Taaskr
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', margin: 0, lineHeight: 1.5 }}>
            Sign in to track your service dispatches, bookings, and saved locations.
          </p>
        </div>

        {/* DYNAMIC THEME FORM PANEL */}
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
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              lineHeight: 1.4
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.45rem'
              }}>
                Email or Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="text"
                  required
                  placeholder="name@example.com or 9876543210"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.75rem',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    color: 'var(--text-main)',
                    fontSize: '0.925rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Forgot Password?
                </Link>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 2.75rem 0.8rem 2.75rem',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    color: 'var(--text-main)',
                    fontSize: '0.925rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
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
                padding: '0.9rem',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px var(--primary-subtle)',
                marginTop: '0.5rem'
              }}
            >
              {loading ? 'Authenticating...' : (
                <>
                  <span>Sign In to Customer Portal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-muted)'
          }}>
            Don't have an account yet?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        </div>

        {/* Dedicated Partner & Provider Navigation Links */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          fontSize: '0.825rem',
          color: 'var(--text-muted)'
        }}>
          <span>
            Service Provider?{' '}
            <Link to="/login/provider" style={{ color: '#14B8A6', textDecoration: 'none', fontWeight: 600 }}>
              Provider Portal
            </Link>
          </span>
          <span>•</span>
          <span>
            Fleet Partner?{' '}
            <Link to="/login/partner" style={{ color: '#2DD4BF', textDecoration: 'none', fontWeight: 600 }}>
              Partner Console
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
