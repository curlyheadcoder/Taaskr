import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Theme states with localStorage fallbacks
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('taaskr_theme_mode') !== 'light';
  });
  const [activeAccent, setActiveAccent] = useState(() => {
    return localStorage.getItem('taaskr_theme_accent') || 'indigo';
  });

  // Watch Dark/Light theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('taaskr_theme_mode', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('taaskr_theme_mode', 'light');
    }
  }, [isDarkMode]);

  // Watch Accent Color changes
  useEffect(() => {
    const accents = ['theme-indigo', 'theme-emerald', 'theme-violet', 'theme-rose', 'theme-blue'];
    accents.forEach(acc => document.body.classList.remove(acc));
    document.body.classList.add(`theme-${activeAccent}`);
    localStorage.setItem('taaskr_theme_accent', activeAccent);
  }, [activeAccent]);

  // Poll or watch for authentication changes by listening to storage events & route changes
  const checkUser = async () => {
    try {
      const profile = await api.auth.me();
      setUser(profile);
    } catch (e) {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUser();
  }, [location.pathname]);

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      margin: '1rem',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Brand Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          padding: '0.4rem 0.6rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)'
        }}>⚡</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          fontWeight: 800,
          background: 'linear-gradient(to right, #ffffff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.03em'
        }}>Taaskr</span>
      </Link>

      {/* Navigation Links based on role */}
      <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {(!user || user.role === 'USER') && (
          <>
            <Link to="/" style={{
              color: location.pathname === '/' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 500,
              transition: 'var(--transition-fast)'
            }}>Browse Services</Link>
            {user && (
              <Link to="/bookings" style={{
                color: location.pathname === '/bookings' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 500,
                transition: 'var(--transition-fast)'
              }}>My Bookings</Link>
            )}
          </>
        )}

        {user && user.role === 'PROVIDER' && (
          <Link to="/provider" style={{
            color: 'var(--secondary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            💼 Provider Dashboard
          </Link>
        )}

        {user && user.role === 'ADMIN' && (
          <Link to="/admin" style={{
            color: 'var(--amber)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            🛠️ Admin Panel
          </Link>
        )}
      </nav>

      {/* Theme Switched & User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Accent and Mode switchers */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderRight: '1px solid var(--border-glass)',
          paddingRight: '1rem',
          marginRight: '0.5rem'
        }}>
          {/* Light/Dark Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-glass)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'var(--transition-fast)'
            }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          {/* Accent Selector Color Dots */}
          {['indigo', 'violet', 'emerald', 'rose', 'blue'].map((color) => {
            const hexColors = {
              indigo: '#6366f1',
              violet: '#a855f7',
              emerald: '#10b981',
              rose: '#f43f5e',
              blue: '#0ea5e9'
            };
            return (
              <button
                key={color}
                onClick={() => setActiveAccent(color)}
                style={{
                  background: hexColors[color],
                  border: activeAccent === color ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: activeAccent === color ? `0 0 8px ${hexColors[color]}` : 'none',
                  transition: 'var(--transition-fast)'
                }}
                title={`Accent ${color}`}
              />
            );
          })}
        </div>

        {user ? (
          <>
            <div style={{ textAlign: 'right', display: 'block' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {user.name}
              </div>
              <span className={`badge ${
                user.role === 'ADMIN' ? 'badge-pending' : user.role === 'PROVIDER' ? 'badge-assigned' : 'badge-completed'
              }`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', marginTop: '0.1rem' }}>
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
