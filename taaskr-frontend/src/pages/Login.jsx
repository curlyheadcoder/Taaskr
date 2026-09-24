import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { 
  User, Briefcase, Wrench, ShieldCheck, Mail, Lock, 
  AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2, Shield
} from 'lucide-react';
import TaaskrLogo from '../components/TaaskrLogo';

const ROLES = {
  customer: {
    id: 'customer',
    name: 'Customer',
    badge: 'Customer Account',
    title: 'Customer Sign In',
    subtitle: 'Access your home service bookings, estimates, and order history.',
    icon: User,
    accent: '#0284c7',
    accentBg: 'rgba(2, 132, 199, 0.12)',
    accentBorder: 'rgba(2, 132, 199, 0.3)',
    expectedRole: 'USER',
    registerLink: '/register',
    registerText: 'Create a Customer Account'
  },
  provider: {
    id: 'provider',
    name: 'Provider Pro',
    badge: 'Provider Business Console',
    title: 'Provider Portal Sign In',
    subtitle: 'Manage service offerings, worker dispatches, and business payouts.',
    icon: Briefcase,
    accent: '#8b5cf6',
    accentBg: 'rgba(139, 92, 246, 0.12)',
    accentBorder: 'rgba(139, 92, 246, 0.3)',
    expectedRole: 'PROVIDER',
    registerLink: '/register?role=PROVIDER',
    registerText: 'Register as Service Provider'
  },
  partner: {
    id: 'partner',
    name: 'Service Partner',
    badge: 'Field Technician Portal',
    title: 'Worker Console Sign In',
    subtitle: 'View assigned jobs, navigate to customer locations, and complete tasks.',
    icon: Wrench,
    accent: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    accentBorder: 'rgba(16, 185, 129, 0.3)',
    expectedRole: 'SERVICE_PARTNER',
    registerLink: null,
    registerText: null
  },
  admin: {
    id: 'admin',
    name: 'Admin Command',
    badge: 'Executive System Portal',
    title: 'Admin Command Center',
    subtitle: 'System auditing, user oversight, global payouts, and platform security.',
    icon: ShieldCheck,
    accent: '#ef4444',
    accentBg: 'rgba(239, 68, 68, 0.12)',
    accentBorder: 'rgba(239, 68, 68, 0.3)',
    expectedRole: 'ADMIN',
    registerLink: null,
    registerText: null
  }
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active role based on path
  const getRoleFromPath = (pathname) => {
    if (pathname.includes('/provider')) return 'provider';
    if (pathname.includes('/partner')) return 'partner';
    if (pathname.includes('/admin')) return 'admin';
    return 'customer';
  };

  const [activeRole, setActiveRole] = useState(getRoleFromPath(location.pathname));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveRole(getRoleFromPath(location.pathname));
  }, [location.pathname]);

  const currentRoleConfig = ROLES[activeRole] || ROLES.customer;
  const RoleIcon = currentRoleConfig.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.login(email.trim(), password.trim());
      window.dispatchEvent(new Event('auth_change'));
      window.dispatchEvent(new Event('storage'));

      // Validate role expectation if specific portal selected
      const userRole = res.role;
      
      if (activeRole === 'admin' && userRole !== 'ADMIN') {
        setError('Access Denied: Your account does not have Administrator privileges.');
        setLoading(false);
        return;
      }

      if (activeRole === 'provider' && userRole !== 'PROVIDER' && userRole !== 'ADMIN') {
        setError(`Access Mismatch: This account is registered as ${userRole}. Please switch to the ${userRole === 'USER' ? 'Customer' : userRole} login portal.`);
        setLoading(false);
        return;
      }

      if (activeRole === 'partner' && userRole !== 'SERVICE_PARTNER' && userRole !== 'ADMIN') {
        setError(`Access Mismatch: Account is registered as ${userRole}. Please use the corresponding login tab.`);
        setLoading(false);
        return;
      }

      // Navigate based on actual authenticated role
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
      setError(err.message || 'Authentication failed. Please check your credentials.');
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
        maxWidth: '460px',
        width: '100%',
        padding: '2.25rem',
        borderRadius: 'var(--radius-lg, 16px)',
        borderTop: `4px solid ${currentRoleConfig.accent}`,
        transition: 'all 0.3s ease'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.65rem' }}>
            <TaaskrLogo size={44} />
          </div>

          {/* Role Pill Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            backgroundColor: currentRoleConfig.accentBg,
            border: `1px solid ${currentRoleConfig.accentBorder}`,
            color: currentRoleConfig.accent,
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.75rem'
          }}>
            <RoleIcon size={14} />
            <span>{currentRoleConfig.badge}</span>
          </div>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
            {currentRoleConfig.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.45 }}>
            {currentRoleConfig.subtitle}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          backgroundColor: 'var(--bg-subtle, #1e293b)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-light, #334155)'
        }}>
          {Object.values(ROLES).map((role) => {
            const IconComponent = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setActiveRole(role.id);
                  setError('');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? role.accent : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.72rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconComponent size={16} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {role.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'var(--error-bg, rgba(239, 68, 68, 0.12))',
            border: '1px solid var(--error-border, rgba(239, 68, 68, 0.3))',
            color: 'var(--error, #ef4444)',
            padding: '0.75rem 0.85rem',
            borderRadius: 'var(--radius-xs, 8px)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder={activeRole === 'admin' ? 'admin@taaskr.com' : activeRole === 'provider' ? 'partner@company.com' : 'user@example.com'}
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
              <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: currentRoleConfig.accent, fontWeight: 600 }}>
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
              backgroundColor: currentRoleConfig.accent, 
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
            <span>{loading ? 'Authenticating...' : `Sign In as ${currentRoleConfig.name}`}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Actions */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {currentRoleConfig.registerLink ? (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
              <Link to={currentRoleConfig.registerLink} style={{ color: currentRoleConfig.accent, fontWeight: 600 }}>
                {currentRoleConfig.registerText}
              </Link>
            </div>
          ) : (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Worker & Admin accounts are created by system administrators.</span>
            </div>
          )}

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Need account verification? </span>
            <Link to="/verify-email" style={{ color: 'var(--text-main)', textDecoration: 'underline' }}>Verify email</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
