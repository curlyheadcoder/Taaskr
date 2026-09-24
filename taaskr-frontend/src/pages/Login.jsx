import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { 
  User, Briefcase, Wrench, ShieldCheck, Mail, Lock, 
  AlertCircle, ArrowRight, Eye, EyeOff, Sparkles, ChevronRight, CheckCircle2
} from 'lucide-react';
import TaaskrLogo from '../components/TaaskrLogo';

const PORTALS = [
  {
    id: 'customer',
    name: 'Customer',
    tagline: 'Book & Track Services',
    badge: 'On-Demand Consumer',
    title: 'Customer Sign In',
    description: 'Book doorstep services, track live technicians, and manage estimates.',
    icon: User,
    accent: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    borderGlow: 'rgba(56, 189, 248, 0.4)',
    expectedRole: 'USER',
    registerPath: '/register',
    registerText: 'Create a Customer Account'
  },
  {
    id: 'provider',
    name: 'Provider Pro',
    tagline: 'Business & Fleet Console',
    badge: 'Partner Company',
    title: 'Provider Portal Sign In',
    description: 'Manage service catalog, worker dispatches, and business earnings.',
    icon: Briefcase,
    accent: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    borderGlow: 'rgba(168, 85, 247, 0.4)',
    expectedRole: 'PROVIDER',
    registerPath: '/register?role=PROVIDER',
    registerText: 'Register as Service Provider'
  },
  {
    id: 'partner',
    name: 'Service Partner',
    tagline: 'Field Worker Console',
    badge: 'Dispatched Technician',
    title: 'Worker Console Sign In',
    description: 'Access assigned tasks, navigate to jobs, and submit proof of service.',
    icon: Wrench,
    accent: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.25)',
    borderGlow: 'rgba(52, 211, 153, 0.4)',
    expectedRole: 'SERVICE_PARTNER',
    registerPath: null,
    registerText: null
  },
  {
    id: 'admin',
    name: 'Admin Command',
    tagline: 'Platform Operations',
    badge: 'Internal Executive',
    title: 'Admin Command Center',
    description: 'Global system configuration, user auditing, and financial control.',
    icon: ShieldCheck,
    accent: '#f87171',
    glowColor: 'rgba(248, 113, 113, 0.25)',
    borderGlow: 'rgba(248, 113, 113, 0.4)',
    expectedRole: 'ADMIN',
    registerPath: null,
    registerText: null
  }
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const getPortalFromPath = (pathname) => {
    if (pathname.includes('provider')) return 'provider';
    if (pathname.includes('partner')) return 'partner';
    if (pathname.includes('admin')) return 'admin';
    return 'customer';
  };

  const [activePortalId, setActivePortalId] = useState(getPortalFromPath(location.pathname));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActivePortalId(getPortalFromPath(location.pathname));
  }, [location.pathname]);

  const activePortal = PORTALS.find(p => p.id === activePortalId) || PORTALS[0];
  const PortalIcon = activePortal.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your login credentials');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.login(email.trim(), password.trim(), activePortal.expectedRole);
      window.dispatchEvent(new Event('auth_change'));
      window.dispatchEvent(new Event('storage'));

      const userRole = res.role;
      if (userRole === 'ADMIN') {
        navigate('/admin');
      } else if (userRole === 'PROVIDER') {
        navigate('/provider');
      } else if (userRole === 'SERVICE_PARTNER') {
        navigate('/partner');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
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
      background: 'radial-gradient(circle at 50% 20%, rgba(15, 23, 42, 0.95) 0%, #090d16 100%)'
    }}>
      {/* Background Glow Mesh */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: `radial-gradient(circle, ${activePortal.glowColor} 0%, rgba(0,0,0,0) 70%)`,
        filter: 'blur(60px)',
        pointerEvents: 'none',
        transition: 'all 0.5s ease',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '960px' }}>
        {/* Gateway Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.85rem' }}>
            <TaaskrLogo size={52} />
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#F8FAFC',
            marginBottom: '0.4rem',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Taaskr Authentication Gateway
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.925rem', maxWidth: '520px', margin: '0 auto' }}>
            Select your specialized workspace portal below to access tailored tools, dispatches, and management controls.
          </p>
        </div>

        {/* TRENDY ROLE PORTAL CARDS GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isSelected = activePortalId === portal.id;
            return (
              <div
                key={portal.id}
                onClick={() => {
                  setActivePortalId(portal.id);
                  setError('');
                }}
                style={{
                  position: 'relative',
                  backgroundColor: isSelected ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(16px)',
                  border: isSelected ? `2px solid ${portal.accent}` : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isSelected ? `0 12px 28px -6px ${portal.glowColor}` : '0 4px 12px rgba(0,0,0,0.3)',
                  borderRadius: '16px',
                  padding: '1.25rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    color: portal.accent
                  }}>
                    <CheckCircle2 size={16} />
                  </div>
                )}

                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? portal.glowColor : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isSelected ? portal.borderGlow : 'rgba(255,255,255,0.1)'}`,
                  color: isSelected ? portal.accent : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.85rem',
                  transition: 'all 0.3s ease'
                }}>
                  <Icon size={22} />
                </div>

                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isSelected ? portal.accent : '#64748B',
                  marginBottom: '2px'
                }}>
                  {portal.badge}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '2px' }}>
                  {portal.name}
                </h3>
                
                <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, lineHeight: 1.35 }}>
                  {portal.tagline}
                </p>
              </div>
            );
          })}
        </div>

        {/* GLASSMORPHIC AUTH FORM PANEL */}
        <div style={{
          maxWidth: '480px',
          margin: '0 auto',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${activePortal.borderGlow}`,
          boxShadow: `0 20px 40px -10px ${activePortal.glowColor}`,
          padding: '2.25rem',
          transition: 'all 0.4s ease'
        }}>
          {/* Active Portal Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: activePortal.glowColor,
              border: `1px solid ${activePortal.borderGlow}`,
              color: activePortal.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <PortalIcon size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
                {activePortal.title}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0, marginTop: '2px' }}>
                {activePortal.description}
              </p>
            </div>
          </div>

          {/* Error Alert */}
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
              gap: '0.5rem',
              lineHeight: 1.4
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder={
                    activePortal.id === 'admin' ? 'admin@taaskr.com' :
                    activePortal.id === 'provider' ? 'partner@company.com' :
                    activePortal.id === 'partner' ? 'worker@provider.com' :
                    'user@example.com'
                  }
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
                <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: activePortal.accent, fontWeight: 600, textDecoration: 'none' }}>
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
                backgroundColor: activePortal.accent,
                color: '#090D16',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: `0 8px 20px -4px ${activePortal.glowColor}`,
                transition: 'all 0.25s ease'
              }}
            >
              <span>{loading ? 'Authenticating...' : `Sign In to ${activePortal.name}`}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Registration & Switcher Footer */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.8125rem'
          }}>
            {activePortal.registerPath ? (
              <div>
                <span style={{ color: '#94A3B8' }}>Don't have an account? </span>
                <Link to={activePortal.registerPath} style={{ color: activePortal.accent, fontWeight: 700, textDecoration: 'none' }}>
                  {activePortal.registerText}
                </Link>
              </div>
            ) : (
              <div style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                {activePortal.id === 'admin'
                  ? 'Administrator credentials are provided by system operations.'
                  : 'Service partner accounts are provisioned by your business manager.'}
              </div>
            )}

            <div style={{ marginTop: '0.65rem' }}>
              <span style={{ color: '#64748B' }}>Need account verification? </span>
              <Link to="/verify-email" style={{ color: '#CBD5E1', textDecoration: 'underline' }}>
                Verify Email Address
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
