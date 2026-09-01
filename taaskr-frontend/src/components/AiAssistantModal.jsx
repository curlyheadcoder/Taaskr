import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function AiAssistantModal() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const quickPrompts = [
    { label: '💧 Water leak in sink/tap', text: 'My kitchen sink tap is leaking water continuously' },
    { label: '❄️ AC blowing warm air', text: 'AC is not cooling properly and blowing warm air' },
    { label: '⚡ Spark in switchboard', text: 'Switchboard is sparking and smells like burning wire' },
    { label: '🧹 Full house deep clean', text: 'Need deep cleaning for 2BHK apartment' },
    { label: '🐜 Pest & termite control', text: 'Cockroaches and ants in kitchen cabinets' }
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

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Home Diagnostic Assistant"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.4rem',
          background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.95rem',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(37, 99, 235, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.35)';
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>✨</span>
        <span>AI Diagnostic</span>
      </button>

      {/* Diagnosis Modal */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)} style={{ zIndex: 100 }}>
          <div
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>✨</span>
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
                    AI Home Diagnostic
                  </h2>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                  Describe your problem in plain English — AI will match the exact service you need.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.6rem', cursor: 'pointer', lineHeight: 1 }}
                title="Close"
              >
                &times;
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                Popular Issues
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(p.text);
                      handleDiagnose(p.text);
                    }}
                    style={{
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.35rem 0.8rem',
                      fontSize: '0.82rem',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleDiagnose(); }} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="E.g., My kitchen tap is making a whistling sound and water pressure is very low..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ resize: 'none', fontSize: '0.95rem' }}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                disabled={loading || !query.trim()}
              >
                {loading ? 'Diagnosing with AI...' : '🔍 Diagnose & Find Service'}
              </button>
            </form>

            {error && (
              <div style={{ padding: '0.9rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Diagnosis Result Card */}
            {result && result.serviceId && (
              <div style={{
                background: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase',
                      background: result.urgency === 'EMERGENCY' ? '#FEF2F2' : result.urgency === 'HIGH' ? '#FFFBEB' : '#ECFDF5',
                      color: result.urgency === 'EMERGENCY' ? '#DC2626' : result.urgency === 'HIGH' ? '#D97706' : '#059669',
                      border: `1px solid ${result.urgency === 'EMERGENCY' ? '#FCA5A5' : result.urgency === 'HIGH' ? '#FDE68A' : '#A7F3D0'}`
                    }}>
                      {result.urgency} URGENCY
                    </span>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginTop: '0.5rem', fontWeight: 700 }}>
                      {result.serviceName}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Category: {result.categoryName} • {result.durationMinutes || 60} mins
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{result.price}
                    </span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontStyle: 'italic', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  💡 {result.reason}
                </p>

                <button
                  type="button"
                  onClick={() => handleBookService(result.serviceId)}
                  className="btn btn-primary"
                  style={{ width: '100%', fontWeight: 700 }}
                >
                  Book This Service ➔
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
