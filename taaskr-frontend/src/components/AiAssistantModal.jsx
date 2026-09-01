import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Sparkles, X, ArrowRight, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';

export default function AiAssistantModal() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const quickPrompts = [
    { label: '💧 Leaking Sink / Pipe', text: 'My kitchen sink pipe is leaking water continuously' },
    { label: '❄️ AC Not Cooling', text: 'AC is not cooling properly and blowing warm air' },
    { label: '⚡ Sparking Switchboard', text: 'Switchboard is sparking and smells like burning wire' },
    { label: '🧹 Deep House Cleaning', text: 'Need deep cleaning for 2BHK apartment' },
    { label: '🐜 Pest Control', text: 'Cockroaches and ants in kitchen cabinets' }
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
          gap: '0.5rem',
          padding: '0.75rem 1.25rem',
          background: 'var(--primary)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.9rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 14px 30px -5px rgba(37, 99, 235, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(15, 23, 42, 0.4)';
        }}
      >
        <Sparkles size={18} color="#F59E0B" />
        <span>Ask AI</span>
      </button>

      {/* Diagnosis Modal */}
      {isOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsOpen(false)} 
          style={{ 
            zIndex: 100,
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          <div
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '520px', 
              width: '92%', 
              maxHeight: '88vh', 
              overflowY: 'auto',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              border: '1px solid var(--border-light)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.12)', 
                  padding: '0.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <Sparkles size={22} color="#F59E0B" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
                    AI Service Assistant
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                    Tell us what's wrong, we'll find the right fix
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ 
                  background: 'var(--bg-page)', 
                  border: 'none', 
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
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
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleDiagnose(); }} style={{ marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe your issue (e.g., tap leaking, switch sparking, AC making weird noise)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ 
                    resize: 'none', 
                    fontSize: '0.92rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-page)'
                  }}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '0.5rem' 
                }}
                disabled={loading || !query.trim()}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: 'inline-block', width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                      borderRadius: '50%', animation: 'spin 1s linear infinite'
                    }} />
                    <span>Analyzing issue...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Get Instant Recommendation</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                background: '#FEF2F2', 
                border: '1px solid #FCA5A5', 
                color: 'var(--error)', 
                borderRadius: 'var(--radius-md)', 
                fontSize: '0.85rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
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
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      background: result.urgency === 'EMERGENCY' ? '#FEF2F2' : result.urgency === 'HIGH' ? '#FFFBEB' : '#ECFDF5',
                      color: result.urgency === 'EMERGENCY' ? '#DC2626' : result.urgency === 'HIGH' ? '#D97706' : '#059669',
                      border: `1px solid ${result.urgency === 'EMERGENCY' ? '#FCA5A5' : result.urgency === 'HIGH' ? '#FDE68A' : '#A7F3D0'}`
                    }}>
                      {result.urgency} Urgency
                    </span>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.15rem', marginTop: '0.35rem', fontWeight: 700 }}>
                      {result.serviceName}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.1rem 0 0' }}>
                      {result.categoryName} • ~{result.durationMinutes || 60} mins
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{result.price}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  color: 'var(--text-main)', 
                  fontSize: '0.86rem', 
                  background: 'var(--bg-card)', 
                  padding: '0.65rem 0.85rem', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-light)',
                  lineHeight: 1.5
                }}>
                  💡 {result.reason}
                </div>

                <button
                  type="button"
                  onClick={() => handleBookService(result.serviceId)}
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    padding: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>Book This Service</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
