import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, CheckCircle2, ChevronRight, AlertCircle, Sparkles, ShieldCheck, Tag } from 'lucide-react';

export default function VehicleVariantModal({ isOpen, onClose, umbrellaService }) {
  const navigate = useNavigate();
  const [selectedOptionId, setSelectedOptionId] = useState(() => umbrellaService?.options?.[0]?.id || '');

  if (!isOpen || !umbrellaService) return null;

  const options = umbrellaService.options || [];
  const selectedOption = options.find(opt => opt.id === selectedOptionId) || options[0];

  const handleBookSelected = () => {
    if (!selectedOption) return;

    const fullServiceName = `${umbrellaService.name} (${selectedOption.name})`;
    
    onClose();
    navigate('/booking-flow', {
      state: {
        serviceId: null,
        serviceName: fullServiceName,
        price: selectedOption.price,
        duration: selectedOption.duration,
        categoryName: 'Vehicle & Auto Care',
        packageDescription: `Selected Variant: ${selectedOption.name} (${selectedOption.duration}). ${selectedOption.description}`,
        isVehicle: false
      }
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-light, rgba(226, 232, 240, 0.8))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  {umbrellaService.name}
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '12px'
                  }}
                >
                  {options.length} Options Available
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8125rem', color: '#e0f2fe' }}>
                Select a service package below to view exact price & duration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-header info */}
        <div style={{ padding: '0.85rem 1.5rem', backgroundColor: 'rgba(2, 132, 199, 0.06)', borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
          <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted, #475569)', lineHeight: 1.45 }}>
            {umbrellaService.description}
          </p>
        </div>

        {/* Options List */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {options.map((opt) => {
            const isSelected = selectedOptionId === opt.id || (selectedOptionId === '' && options[0].id === opt.id);
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedOptionId(opt.id)}
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid #0284c7' : '1px solid var(--border-light, #cbd5e1)',
                  backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.05)' : 'var(--bg-input, #ffffff)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  boxShadow: isSelected ? '0 4px 16px rgba(2, 132, 199, 0.12)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: isSelected ? '6px solid #0284c7' : '2px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '0.975rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                      {opt.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#64748b', backgroundColor: 'var(--bg-subtle, #f1f5f9)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                      <Clock size={13} color="#0284c7" />
                      <span>{opt.duration}</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0284c7' }}>
                        {opt.isStartingFrom ? `From ₹${opt.price}` : `₹${opt.price}`}
                      </span>
                    </div>
                  </div>
                </div>

                <p style={{ margin: '0.2rem 0 0 1.75rem', fontSize: '0.825rem', color: 'var(--text-muted, #475569)', lineHeight: 1.4 }}>
                  {opt.description}
                </p>

                {opt.note && (
                  <div style={{ margin: '0.25rem 0 0 1.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#d97706', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <AlertCircle size={13} />
                    <span>{opt.note}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '1.15rem 1.5rem', borderTop: '1px solid var(--border-light, #e2e8f0)', backgroundColor: 'var(--bg-card, #ffffff)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', display: 'block' }}>Selected Package Price</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284c7' }}>
              {selectedOption?.isStartingFrom ? `From ₹${selectedOption?.price}` : `₹${selectedOption?.price}`}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                ({selectedOption?.duration})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBookSelected}
            style={{
              padding: '0.85rem 1.6rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: '#ffffff',
              fontSize: '0.925rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>Proceed with {selectedOption?.name?.split(' ')[0]}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
