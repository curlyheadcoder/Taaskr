import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Wrench, Truck, AlertCircle, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'USER',
    isLogisticsProvider: false,
    city: '',
    pincode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.city || !formData.pincode) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        city: formData.city,
        pincode: formData.pincode,
        isLogisticsProvider: formData.role === 'PROVIDER' ? Boolean(formData.isLogisticsProvider) : false
      };

      const res = await api.auth.register(payload);
      if (res.role === 'PROVIDER') {
        alert('Registration successful! Please verify your email with the 6-digit OTP code.');
        navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`);
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        maxWidth: '480px',
        width: '100%',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--primary-subtle)',
            color: 'var(--primary)',
            marginBottom: '0.75rem'
          }}>
            <img src="/taaskr-logo.png" alt="Taaskr" width="28" height="28" style={{ objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            Get started with Taaskr as a customer or service partner
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            color: 'var(--error)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="john@company.com"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Password * (Min 6)</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="9876543210"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Role *</label>
            <select
              name="role"
              className="form-control"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="USER">Customer (Book on-demand services)</option>
              <option value="PROVIDER">Service Provider / Partner (Earn & execute jobs)</option>
            </select>
          </div>

          {/* Conditional Partner Specialization Selector */}
          {formData.role === 'PROVIDER' && (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.875rem',
              marginBottom: '1rem'
            }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                Partner Specialization *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid',
                  borderColor: !formData.isLogisticsProvider ? 'var(--primary)' : 'var(--border-light)',
                  background: !formData.isLogisticsProvider ? 'var(--primary-subtle)' : 'var(--bg-card)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="partnerType"
                    checked={!formData.isLogisticsProvider}
                    onChange={() => setFormData(prev => ({ ...prev, isLogisticsProvider: false }))}
                    style={{ marginTop: '0.15rem' }}
                  />
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                      <Wrench size={14} color="var(--primary)" />
                      <span>Home Services Specialist</span>
                    </strong>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Plumbing, electrical, appliances, cleaning, repair, and carpentry.
                    </p>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid',
                  borderColor: formData.isLogisticsProvider ? 'var(--primary)' : 'var(--border-light)',
                  background: formData.isLogisticsProvider ? 'var(--primary-subtle)' : 'var(--bg-card)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="partnerType"
                    checked={formData.isLogisticsProvider}
                    onChange={() => setFormData(prev => ({ ...prev, isLogisticsProvider: true }))}
                    style={{ marginTop: '0.15rem' }}
                  />
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                      <Truck size={14} color="var(--primary)" />
                      <span>Logistics & Freight Partner</span>
                    </strong>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Commercial vehicles, mini trucks, loading tempos, parcel courier, and freight transport.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">City *</label>
              <input
                type="text"
                name="city"
                placeholder="Indore"
                className="form-control"
                value={formData.city}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Pincode *</label>
              <input
                type="text"
                name="pincode"
                placeholder="452001"
                className="form-control"
                value={formData.pincode}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already registered? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
