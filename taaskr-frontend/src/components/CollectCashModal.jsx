import React from 'react';
import { DollarSign, CheckCircle2, X, AlertCircle, MapPin, User, Phone, Check } from 'lucide-react';

export default function CollectCashModal({
  isOpen,
  onClose,
  booking,
  onConfirm,
  loading = false
}) {
  if (!isOpen || !booking) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={loading ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'var(--bg-card, #121215)',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px'
          }}
        >
          <X size={18} />
        </button>

        {/* Header with Cash Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              flexShrink: 0
            }}
          >
            <DollarSign size={26} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Collect Cash Payment
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
              Cash on Delivery (After Service)
            </span>
          </div>
        </div>

        {/* Amount to collect highlight card */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block' }}>
            Total Cash Due From Customer
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', fontFeatureSettings: 'tnum', margin: '0.25rem 0' }}>
            ₹{booking.finalAmount}
          </div>
          <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>
            Job Completed • Ready for Payment
          </span>
        </div>

        {/* Booking & Customer Details */}
        <div
          style={{
            background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-light, rgba(255,255,255,0.08))',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Service:</span>
            <strong style={{ color: 'var(--text-main)' }}>{booking.serviceName} #{String(booking.id).slice(-6)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <strong style={{ color: 'var(--text-main)' }}>{booking.customerName || 'Customer'}</strong>
          </div>
          {booking.customerPhone && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Contact:</span>
              <span style={{ color: 'var(--text-main)' }}>{booking.customerPhone}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Location:</span>
            <span style={{ color: 'var(--text-main)', textAlign: 'right', maxWidth: '60%' }}>
              {booking.city} {booking.pincode ? `- ${booking.pincode}` : ''}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
          Please ensure you have received the exact cash amount from the customer before confirming. This will immediately mark the booking as paid.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(booking.id)}
            disabled={loading}
            className="btn btn-success"
            style={{
              padding: '0.55rem 1.2rem',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {loading ? (
              <span>Recording Payment...</span>
            ) : (
              <>
                <Check size={16} />
                <span>Confirm Cash Collected</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
