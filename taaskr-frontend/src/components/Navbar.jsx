import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Sun, Moon } from 'lucide-react';

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

  // Poll or watch for authentication changes by listening to storage events & route changes
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
    <header className="premium-card" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderRadius: '0',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Brand Logo - Routes to role home */}
      <Link 
        to={user?.role === 'ADMIN' ? '/admin' : user?.role === 'PROVIDER' ? '/provider' : '/'} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
      >
        <img
          src="/taaskr-logo.png"
          alt="Taaskr logo"
          width="36"
          height="36"
          style={{ display: 'block', objectFit: 'contain' }}
        />
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.5rem',
          fontWeight: 800,
          color: isDark ? '#60A5FA' : '#2563EB',
          letterSpacing: '-0.03em'
        }}>Taaskr</span>
      </Link>

      {/* Navigation Links based on role */}
      <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {(!user || user.role === 'USER') && (
          <>
            <Link to="/" style={{
              color: location.pathname === '/' ? 'var(--secondary)' : 'var(--text-muted)',
              fontWeight: 600,
              transition: 'var(--transition-fast)'
            }}>Browse Services</Link>
            {user && (
              <Link to="/bookings" style={{
                color: location.pathname === '/bookings' ? 'var(--secondary)' : 'var(--text-muted)',
                fontWeight: 600,
                transition: 'var(--transition-fast)'
              }}>My Bookings</Link>
            )}
          </>
        )}

        {user && user.role === 'PROVIDER' && (
          <Link to="/provider" style={{
            color: isDark ? '#60A5FA' : '#1D4ED8',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
            border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #BFDBFE'
          }}>
            💼 Provider Partner Portal
          </Link>
        )}

        {user && user.role === 'ADMIN' && (
          <Link to="/admin" style={{
            color: 'var(--primary)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F4F4F5',
            border: isDark ? '1px solid #3F3F46' : '1px solid #E4E4E7'
          }}>
            🛡️ Admin Center
          </Link>
        )}
      </nav>

      {/* User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => setIsDark(!isDark)} 
          style={{ 
            background: 'var(--bg-hover)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '9999px',
            cursor: 'pointer', 
            padding: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-fast)'
          }}
          title="Toggle Theme"
        >
          {isDark ? <Sun size={18} color="var(--secondary)" /> : <Moon size={18} color="var(--primary)" />}
        </button>
        {user ? (
          <>
            <div style={{ textAlign: 'right', display: 'block' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {user.name}
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                marginTop: '0.15rem',
                display: 'inline-block',
                textTransform: 'uppercase',
                background: user.role === 'ADMIN'
                  ? (isDark ? '#27272A' : '#18181B')
                  : (isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF'),
                color: user.role === 'ADMIN'
                  ? (isDark ? '#FAFAFA' : '#FFFFFF')
                  : (isDark ? '#60A5FA' : '#1D4ED8'),
                border: user.role === 'ADMIN'
                  ? (isDark ? '1px solid #3F3F46' : '1px solid #27272A')
                  : (isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE')
              }}>
                {user.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary btn-small">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-small" style={{ border: 'none', background: 'transparent' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-small">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
