import React from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function RejectTaskModal({
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
          border: '1px solid rgba(239, 68, 68, 0.3)',
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

        {/* Warning Icon Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Reject Task Assignment
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 600 }}>
              Partner Dispatch Confirmation
            </span>
          </div>
        </div>

        {/* Explanation Message */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            padding: '0.9rem 1rem',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            lineHeight: 1.45,
            color: 'var(--text-main)'
          }}
        >
          Are you sure you want to reject this assigned task? It will be unassigned and returned to the active dispatch pool for other partners.
        </div>

        {/* Task Details Preview */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Task:</span>
            <strong style={{ color: 'var(--text-main)' }}>{booking.serviceName} #{String(booking.id).slice(-6)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <span style={{ color: 'var(--text-main)' }}>{booking.customerName || 'Customer'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payout:</span>
            <strong style={{ color: 'var(--text-main)' }}>₹{booking.finalAmount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Address:</span>
            <span style={{ color: 'var(--text-main)', textAlign: 'right', maxWidth: '65%' }}>
              {booking.address}, {booking.city}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            Keep Task
          </button>
          <button
            type="button"
            onClick={() => onConfirm(booking.id)}
            disabled={loading}
            className="btn btn-danger"
            style={{
              padding: '0.55rem 1.2rem',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {loading ? <span>Rejecting...</span> : <span>Reject Task</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
