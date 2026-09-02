import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Wrench, Truck } from 'lucide-react';

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
        alert('Registration successful! Partner profile created and awaiting Admin approval.');
        navigate('/provider');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '2rem 1rem'
    }}>
      <div className="glass-panel animate-slide-up" style={{
        maxWidth: '550px',
        width: '100%',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Join Taaskr</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Create an account to start booking or providing services</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            color: 'var(--rose)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
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

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="john@example.com"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Password * (Min 6 chars)</label>
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

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="9999999999"
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
              style={{ background: 'var(--bg-slate-900)' }}
            >
              <option value="USER" style={{ color: '#0F172A', background: '#FFFFFF' }}>Customer (Book services)</option>
              <option value="PROVIDER" style={{ color: '#0F172A', background: '#FFFFFF' }}>Service Provider / Partner</option>
            </select>
          </div>

          {/* Conditional Partner Specialization Selector */}
          {formData.role === 'PROVIDER' && (
            <div style={{
              background: 'rgba(37, 99, 235, 0.06)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '0.75rem' }}>
                Select Your Partner Specialization *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: !formData.isLogisticsProvider ? '1.5px solid var(--primary)' : '1px solid var(--border-glass)',
                  background: !formData.isLogisticsProvider ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="partnerType"
                    checked={!formData.isLogisticsProvider}
                    onChange={() => setFormData(prev => ({ ...prev, isLogisticsProvider: false }))}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                      <Wrench className="w-4 h-4 text-blue-500" /> Home Services Provider
                    </strong>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Plumbing, Electrical, Cleaning, Appliance Repair, Security, Civil maintenance, etc.
                    </p>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: formData.isLogisticsProvider ? '1.5px solid var(--primary)' : '1px solid var(--border-glass)',
                  background: formData.isLogisticsProvider ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="partnerType"
                    checked={formData.isLogisticsProvider}
                    onChange={() => setFormData(prev => ({ ...prev, isLogisticsProvider: true }))}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <strong style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                      <Truck className="w-4 h-4 text-blue-500" /> Logistics & Vehicle Transport Partner
                    </strong>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Commercial vehicle driver, loading tempo, mini truck, goods transport & delivery.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group">
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

            <div className="form-group">
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
            {loading ? 'Registering Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
