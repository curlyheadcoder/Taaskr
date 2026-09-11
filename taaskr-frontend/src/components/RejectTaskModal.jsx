import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function RejectTaskModal({
  isOpen,
  onClose,
  booking,
  onConfirm,
  loading = false
}) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  if (!isOpen || !booking) return null;

  const handleConfirm = () => {
    if (!reason || !reason.trim()) {
      setReasonError('Please state why you are rejecting this task.');
      return;
    }
    setReasonError('');
    onConfirm(booking.id, reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setReasonError('');
    onClose();
  };

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
      onClick={loading ? undefined : handleClose}
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
          onClick={handleClose}
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
              Partner Rejection Feedback
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
          Please provide feedback on why you are rejecting this assigned task. This helps our dispatch team reassign the order effectively.
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{booking.userName || booking.customerName || 'Customer'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payout:</span>
            <strong style={{ color: 'var(--text-main)' }}>₹{booking.finalAmount}</strong>
          </div>
        </div>

        {/* Reason Input Field */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Reason for Rejection <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setReasonError('');
            }}
            placeholder="e.g. Vehicle issue, required spare parts unavailable, emergency situation..."
            rows={3}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: reasonError ? '1px solid #ef4444' : '1px solid var(--border-light, rgba(255,255,255,0.15))',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              outline: 'none',
              resize: 'vertical'
            }}
          />
          {reasonError && (
            <span style={{ color: '#ef4444', fontSize: '0.775rem', marginTop: '0.3rem', display: 'block' }}>
              {reasonError}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            Keep Task
          </button>
          <button
            type="button"
            onClick={handleConfirm}
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
