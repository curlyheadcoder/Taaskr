import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Bot, X, ArrowRight, AlertTriangle, Sparkles, Truck, 
  Package, Snowflake, Droplets, Zap, CheckCircle2, Send,
  Calendar, Clock, Trash2, User, RefreshCw, ChevronRight, ShieldAlert, Check
} from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';

export default function AiAssistantModal() {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelStatus, setCancelStatus] = useState({});

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'taasky',
      text: "Hi! I'm Taasky, your AI assistant on Taaskr. How can I help you today? You can ask me to find services, check pricing, lookup real-time availability, or check your active bookings.",
      suggestedPrompts: [
        'I want to send my parcel across the city',
        'AC is not cooling properly',
        'Kitchen sink pipe is leaking',
        'Show my active bookings',
        'What vehicle options are available?'
      ]
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Listen to open_taasky_with_prompt global event
  useEffect(() => {
    const handleOpenWithPrompt = (e) => {
      const prompt = e.detail?.prompt;
      setIsOpen(true);
      if (prompt && prompt.trim()) {
        sendMessage(prompt);
      }
    };
    window.addEventListener('open_taasky_with_prompt', handleOpenWithPrompt);
    return () => window.removeEventListener('open_taasky_with_prompt', handleOpenWithPrompt);
  }, []);

  const sendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsgId = Date.now().toString();
    const newUserMsg = {
      id: userMsgId,
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Get user location context if present
      let locCity = 'Indore';
      try {
        const savedLoc = localStorage.getItem('taaskr_location');
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed.city) locCity = parsed.city;
        }
      } catch (e) {}

      // Prepare conversation history for backend context
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.ai.chat({
        message: text,
        history: historyPayload,
        contextLocation: locCity
      });

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'taasky',
        text: res.message || 'Here is what I found for you:',
        intent: res.intent,
        urgency: res.urgency,
        safetyNotice: res.safetyNotice,
        recommendedServices: res.recommendedServices || [],
        userBookings: res.userBookings || [],
        availableSlots: res.availableSlots || [],
        suggestedPrompts: res.suggestedPrompts || []
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'taasky',
          text: `I ran into an issue reaching our service catalog: ${err.message || 'Please try again in a moment.'}`,
          isError: true,
          suggestedPrompts: ['Show available vehicle services', 'Check AC repair services', 'Help me contact support']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (serviceId) => {
    setIsOpen(false);
    navigate(`/services/${serviceId}`);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel booking #${bookingId}?`)) return;
    setCancellingBookingId(bookingId);
    try {
      await api.bookings.cancel(bookingId, 'Cancelled via Taasky AI Assistant');
      setCancelStatus(prev => ({ ...prev, [bookingId]: 'CANCELLED' }));
      
      // Add notification to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'taasky',
          text: `Booking #${bookingId} has been successfully cancelled. Is there anything else I can help you with?`,
          suggestedPrompts: ['Show my active bookings', 'Book a replacement service']
        }
      ]);
    } catch (err) {
      alert(`Could not cancel booking: ${err.message}`);
    } finally {
      setCancellingBookingId(null);
    }
  };

  if (roleLoading || role === 'ADMIN' || role === 'PROVIDER') {
    return null;
  }

  return (
    <>
      {/* Floating Taasky Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Taasky AI Assistant"
        style={{
          position: 'fixed',
          bottom: '1.75rem',
          right: '1.75rem',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1.15rem',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 8px 24px rgba(22, 168, 255, 0.4)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.875rem',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
        }}
      >
        <Bot size={18} strokeWidth={2.3} />
        <span>Ask Taasky</span>
      </button>

      {/* Full Conversational Modal */}
      {isOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '1.5rem',
            zIndex: 100
          }}
        >
          <div
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              height: '620px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '0.9rem 1.25rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-header)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ 
                  backgroundColor: 'var(--primary-subtle)', 
                  color: 'var(--primary)',
                  padding: '0.45rem', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h2 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
                      Taasky AI
                    </h2>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--success-bg)',
                      color: 'var(--success)',
                      fontWeight: 700,
                      border: '1px solid var(--success-border)'
                    }}>
                      LIVE BACKEND
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>
                    Real-time catalog, bookings, and instant diagnostics
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: 'var(--bg-page)'
            }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* Sender Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginBottom: '0.25rem',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {msg.sender === 'taasky' ? (
                      <>
                        <Bot size={13} color="var(--primary)" />
                        <span>Taasky</span>
                      </>
                    ) : (
                      <>
                        <span>You</span>
                        <User size={13} />
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    maxWidth: '88%',
                    padding: '0.75rem 0.95rem',
                    borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border-light)',
                    fontSize: '0.85rem',
                    lineHeight: '1.45',
                    boxShadow: 'var(--shadow-xs)',
                    wordBreak: 'break-word'
                  }}>
                    {msg.text}

                    {/* Safety Alert if Emergency */}
                    {msg.safetyNotice && (
                      <div style={{
                        marginTop: '0.65rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--warning-bg)',
                        border: '1px solid var(--warning-border)',
                        color: 'var(--warning)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.4rem'
                      }}>
                        <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{msg.safetyNotice}</span>
                      </div>
                    )}

                    {/* Structured Real Services Cards */}
                    {msg.recommendedServices && msg.recommendedServices.length > 0 && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {msg.recommendedServices.map((srv) => (
                          <div
                            key={srv.id}
                            style={{
                              backgroundColor: 'var(--bg-subtle)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '8px',
                              padding: '0.65rem 0.75rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <span style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--icon-container)',
                                  color: 'var(--secondary-accent)',
                                  fontWeight: 600
                                }}>
                                  {srv.categoryName}
                                </span>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                                  {srv.name}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                                  ₹{srv.basePrice || srv.price}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  ~{srv.durationMinutes || 60} min
                                </div>
                              </div>
                            </div>

                            {srv.description && (
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                                {srv.description}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleBookService(srv.id)}
                              className="btn btn-primary btn-sm"
                              style={{
                                width: '100%',
                                marginTop: '0.25rem',
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem'
                              }}
                            >
                              <span>Book This Service</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Structured User Bookings Cards */}
                    {msg.userBookings && msg.userBookings.length > 0 && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Your Live Bookings ({msg.userBookings.length})
                        </span>
                        {msg.userBookings.map((b) => {
                          const isCancelled = (cancelStatus[b.id] || b.status) === 'CANCELLED';
                          return (
                            <div
                              key={b.id}
                              style={{
                                backgroundColor: 'var(--bg-subtle)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '8px',
                                padding: '0.65rem 0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                  Booking #{b.id}
                                </span>
                                <span className={`badge badge-${(isCancelled ? 'cancelled' : b.status).toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                                  {isCancelled ? 'CANCELLED' : b.status}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {b.serviceName || `Service #${b.serviceId}`} • ₹{b.price}
                              </div>

                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Calendar size={12} />
                                <span>{b.bookingDate} {b.bookingTime ? `at ${b.bookingTime}` : ''}</span>
                              </div>

                              {!isCancelled && b.status !== 'COMPLETED' && (
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsOpen(false);
                                      navigate('/bookings');
                                    }}
                                    className="btn btn-ghost btn-sm"
                                    style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}
                                  >
                                    View Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelBooking(b.id)}
                                    disabled={cancellingBookingId === b.id}
                                    className="btn btn-danger btn-sm"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                  >
                                    <Trash2 size={12} />
                                    <span>{cancellingBookingId === b.id ? 'Cancelling...' : 'Cancel'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Availability Slots Cards */}
                    {msg.availableSlots && msg.availableSlots.length > 0 && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Available Time Slots
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {msg.availableSlots.map((slot, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                padding: '0.3rem 0.55rem',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-subtle)',
                                border: '1px solid var(--border-light)',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: 'var(--text-main)'
                              }}
                            >
                              <Clock size={12} color="var(--primary)" />
                              <span>{slot.date} • {slot.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggested Follow-up Prompt Chips */}
                  {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                    <div style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.35rem',
                      maxWidth: '90%'
                    }}>
                      {msg.suggestedPrompts.map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => sendMessage(promptText)}
                          disabled={loading}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-full)',
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.72rem',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.color = 'var(--primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-light)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          <Sparkles size={11} color="var(--primary)" />
                          <span>{promptText}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator Bubble */}
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{
                    padding: '0.65rem 0.95rem',
                    borderRadius: '14px 14px 14px 2px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}>
                    <RefreshCw size={14} className="animate-spin" color="var(--primary)" />
                    <span>Taasky is checking catalog & bookings...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-header)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="form-control"
                placeholder="Ask Taasky anything (e.g. courier parcel, AC repair, my bookings)..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  fontSize: '0.825rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '8px'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={loading || !inputMessage.trim()}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

