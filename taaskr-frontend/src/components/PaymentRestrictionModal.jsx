import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function PaymentRestrictionModal({
  isOpen,
  onClose,
  booking,
  onCompleteJob
}) {
  if (!isOpen) return null;

  const currentStatus = booking?.status || 'IN_PROGRESS';
  const canMarkCompleted = currentStatus === 'IN_PROGRESS';

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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          background: 'var(--bg-card, #121215)',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
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
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Work Not Completed
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>
              Payment Collection Restricted
            </span>
          </div>
        </div>

        {/* Explanation Message */}
        <div
          style={{
            background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-light, rgba(255,255,255,0.08))',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: 'var(--text-main)'
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>Payment cannot be received before the work is done.</strong>
          </p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            In accordance with Taaskr service security policy, payment can only be collected after the service has reached <strong>COMPLETED</strong> status.
          </p>
        </div>

        {/* Booking Details Preview */}
        {booking && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-page)',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{booking.serviceName || 'Service'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Customer: {booking.customerName || 'Customer'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${currentStatus === 'COMPLETED' ? 'badge-completed' : 'badge-inprogress'}`}>
                {currentStatus}
              </span>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '0.2rem' }}>
                ₹{booking.finalAmount}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            Dismiss
          </button>
          {canMarkCompleted && onCompleteJob && (
            <button
              onClick={() => {
                onClose();
                onCompleteJob(booking);
              }}
              className="btn btn-success"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Mark Work Completed</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
