import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Sun, Moon, Briefcase, ShieldCheck, Calendar, Grid, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const checkUser = async () => {
    try {
      const profile = await api.auth.me();
      setUser(profile);
      document.body.classList.remove('theme-user', 'theme-provider', 'theme-admin');
      if (profile.role === 'PROVIDER') {
        document.body.classList.add('theme-provider');
      } else if (profile.role === 'ADMIN') {
        document.body.classList.add('theme-admin');
      } else {
        document.body.classList.add('theme-user');
      }
    } catch (e) {
      setUser(null);
      document.body.classList.remove('theme-user', 'theme-provider', 'theme-admin');
      document.body.classList.add('theme-user');
    }
  };

  useEffect(() => {
    checkUser();
  }, [location.pathname]);

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    document.body.classList.remove('theme-provider', 'theme-admin');
    document.body.classList.add('theme-user');
    navigate('/login');
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-light)',
      padding: '0.65rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '56px'
    }}>
      {/* Brand Logo & Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link 
          to={user?.role === 'ADMIN' ? '/admin' : user?.role === 'PROVIDER' ? '/provider' : '/'} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <img
            src="/taaskr-logo.png"
            alt="Taaskr"
            width="28"
            height="28"
            style={{ display: 'block', objectFit: 'contain' }}
          />
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '-0.03em'
          }}>Taaskr</span>
        </Link>

        {/* Workspace Navigation Links */}
        <nav style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {(!user || user.role === 'USER') && (
            <>
              <Link 
                to="/" 
                style={{
                  padding: '0.4rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: location.pathname === '/' ? 600 : 500,
                  color: location.pathname === '/' ? 'var(--primary)' : 'var(--text-muted)',
                  backgroundColor: location.pathname === '/' ? 'var(--primary-subtle)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <Grid size={15} />
                <span>Services</span>
              </Link>
              {user && (
                <Link 
                  to="/bookings" 
                  style={{
                    padding: '0.4rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    fontWeight: location.pathname === '/bookings' ? 600 : 500,
                    color: location.pathname === '/bookings' ? 'var(--primary)' : 'var(--text-muted)',
                    backgroundColor: location.pathname === '/bookings' ? 'var(--primary-subtle)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <Calendar size={15} />
                  <span>My Bookings</span>
                </Link>
              )}
            </>
          )}

          {user && user.role === 'PROVIDER' && (
            <Link 
              to="/provider" 
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--primary)',
                backgroundColor: 'var(--primary-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Briefcase size={15} />
              <span>Partner Console</span>
            </Link>
          )}

          {user && user.role === 'ADMIN' && (
            <Link 
              to="/admin" 
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ShieldCheck size={15} />
              <span>Admin Center</span>
            </Link>
          )}
        </nav>
      </div>

      {/* User Actions & Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          onClick={() => setIsDark(!isDark)} 
          style={{ 
            background: 'transparent', 
            border: '1px solid var(--border-light)', 
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', 
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            transition: 'var(--transition-fast)'
          }}
          title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    {user.name}
                  </span>
                  {user.emailVerified && user.phoneVerified ? (
                    <span title="Email & Phone Verified" style={{ display: 'inline-flex', alignItems: 'center', color: '#10B981' }}>
                      <ShieldCheck size={13} />
                    </span>
                  ) : (
                    <Link
                      to={!user.emailVerified ? `/verify-email?email=${encodeURIComponent(user.email || '')}` : `/verify-phone?type=phone&phone=${encodeURIComponent(user.phone || '')}`}
                      title={!user.emailVerified ? "Email Unverified - Click to Verify" : "Phone Unverified - Click to Verify"}
                      style={{
                        fontSize: '0.62rem',
                        background: '#FEF3C7',
                        color: '#D97706',
                        padding: '0.05rem 0.3rem',
                        borderRadius: '4px',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      {!user.emailVerified ? 'Verify Email' : 'Verify Phone'}
                    </Link>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}>
                    {user.role}
                  </span>
                  {user.emailVerified && !user.phoneVerified && (
                    <Link 
                      to={`/verify-phone?type=phone&phone=${encodeURIComponent(user.phone || '')}`}
                      style={{ fontSize: '0.62rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
                      title="Verify Phone Number"
                    >
                      • +Phone
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout} 
              className="btn btn-secondary btn-sm"
              title="Sign out of account"
              style={{ padding: '0.3rem 0.55rem' }}
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
