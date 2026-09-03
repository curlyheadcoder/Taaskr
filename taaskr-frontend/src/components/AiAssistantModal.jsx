import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Bot, X, ArrowRight, AlertTriangle, Sparkles, Truck, 
  Package, Snowflake, Droplets, Zap, CheckCircle2 
} from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';

export default function AiAssistantModal() {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const quickPrompts = [
    { label: 'Freight & Courier', icon: <Package size={13} />, text: 'I want to send my parcel across the city' },
    { label: 'Moving & Shifting', icon: <Truck size={13} />, text: 'Need mini truck for furniture moving and home shifting' },
    { label: 'AC Cooling Issue', icon: <Snowflake size={13} />, text: 'AC is not working and blowing warm air' },
    { label: 'Pipe Leakage', icon: <Droplets size={13} />, text: 'Kitchen sink pipe is leaking water continuously' },
    { label: 'Electrical Spark', icon: <Zap size={13} />, text: 'Switchboard is sparking and smells like burning wire' },
    { label: 'Deep Cleaning', icon: <Sparkles size={13} />, text: 'Need full deep cleaning for 2BHK home' }
  ];

  const handleDiagnose = async (textToDiagnose) => {
    const text = textToDiagnose || query;
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.ai.diagnose(text);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Could not complete diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (serviceId) => {
    setIsOpen(false);
    navigate(`/services/${serviceId}`);
  };

  if (roleLoading || role !== 'USER') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Taasky Assistant"
        style={{
          position: 'fixed',
          bottom: '1.75rem',
          right: '1.75rem',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.6rem 1.15rem',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-lg)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
          transition: 'var(--transition-fast)'
        }}
      >
        <Sparkles size={16} />
        <span>Taasky</span>
      </button>

      {/* Assistant Modal */}
      {isOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsOpen(false)} 
        >
          <div
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ 
                  backgroundColor: 'var(--primary-subtle)', 
                  color: 'var(--primary)',
                  padding: '0.45rem', 
                  borderRadius: 'var(--radius-sm)', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <Bot size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
                    Taasky
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.1rem 0 0' }}>
                    Describe your problem and Taasky will find the right service for you
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Suggestions */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Common Problem Templates
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(p.text);
                      handleDiagnose(p.text);
                    }}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    {p.icon}
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleDiagnose(); }} style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="e.g. I want to send my parcel across the city, AC not cooling, sink leaking..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ resize: 'none' }}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
                disabled={loading || !query.trim()}
              >
                {loading ? (
                  <span>Taasky is analyzing...</span>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Ask Taasky</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div style={{ 
                padding: '0.65rem 0.85rem', 
                background: 'var(--error-bg)', 
                border: '1px solid var(--error-border)', 
                color: 'var(--error)', 
                borderRadius: 'var(--radius-xs)', 
                fontSize: '0.8125rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Diagnosis Result Card */}
            {result && result.serviceId && (
              <div style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className={`badge ${result.urgency === 'EMERGENCY' ? 'badge-cancelled' : result.urgency === 'HIGH' ? 'badge-pending' : 'badge-completed'}`}>
                      {result.urgency} Urgency
                    </span>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '0.9375rem', marginTop: '0.35rem', fontWeight: 600 }}>
                      {result.serviceName}
                    </h3>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {result.categoryName} • ~{result.durationMinutes || 60} mins
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                      ₹{result.price}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '0.78rem', 
                  background: 'var(--bg-card)', 
                  padding: '0.65rem 0.75rem', 
                  borderRadius: 'var(--radius-xs)', 
                  border: '1px solid var(--border-light)',
                  lineHeight: 1.45
                }}>
                  {result.reason}
                </div>

                <button
                  type="button"
                  onClick={() => handleBookService(result.serviceId)}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: '0.25rem' }}
                >
                  <span>Book This Service</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
