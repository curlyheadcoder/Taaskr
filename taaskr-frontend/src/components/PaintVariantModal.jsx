import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, CheckCircle2, ChevronRight, AlertCircle, ShieldCheck, Paintbrush, Home, Ruler, Sparkles, Layers } from 'lucide-react';
import { PROPERTY_TYPE_OPTIONS, SURFACE_CONDITION_OPTIONS, PAINT_MATERIAL_OPTIONS } from '../data/paintServicesData';

export default function PaintVariantModal({ isOpen, onClose, paintService }) {
  const navigate = useNavigate();

  const options = paintService?.options || [];
  const [selectedOptionId, setSelectedOptionId] = useState(() => options[0]?.id || '');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [areaSqFt, setAreaSqFt] = useState(500);
  const [surfaceCondition, setSurfaceCondition] = useState('Good Existing Paint');
  const [materialChoice, setMaterialChoice] = useState('Taaskr/Provider Provides Material');

  if (!isOpen || !paintService) return null;

  const selectedOption = options.find(opt => opt.id === selectedOptionId) || options[0] || {};
  const isAreaBased = paintService.pricingType === 'AREA_BASED' || selectedOption.unit === 'sq ft';

  const baseRate = selectedOption.price || paintService.startingPrice || 12;
  const estimatedPrice = isAreaBased
    ? Math.max(baseRate * areaSqFt, 499)
    : selectedOption.price || 499;

  const handleProceedToBooking = () => {
    const fullServiceName = `${paintService.name} - ${selectedOption.name || paintService.name}`;
    const formattedArea = isAreaBased ? `${areaSqFt} Sq. Ft.` : 'Standard Unit';
    const metadataString = `Property: ${propertyType} | Area: ${formattedArea} | Surface: ${surfaceCondition} | Material: ${materialChoice} | Estimate: Doorstep Inspection & Measurement Required`;

    onClose();
    navigate('/booking-flow', {
      state: {
        serviceId: null,
        serviceName: fullServiceName,
        price: estimatedPrice,
        duration: selectedOption.duration || 'Based on area',
        categoryName: 'Civil & Property Maintenance',
        packageDescription: metadataString,
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
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
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
          maxWidth: '680px',
          maxHeight: '94vh',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--border-light, #2A2D3C)',
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
            backgroundColor: 'var(--bg-header, #161822)',
            color: 'var(--text-main, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-light, #2A2D3C)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                backgroundColor: 'rgba(245, 158, 11, 0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                fontWeight: 800
              }}
            >
              <Paintbrush size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {paintService.name}
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.16)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '12px'
                  }}
                >
                  Inspection & Quote Required
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted, #a1a1aa)' }}>
                Configure property measurement & surface preferences below
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-subtle, rgba(255, 255, 255, 0.1))',
              border: '1px solid var(--border-light, rgba(255, 255, 255, 0.15))',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main, #ffffff)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: 'var(--bg-card, #1A1C26)' }}>
          {/* Sub-Service Variant Cards */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'block' }}>
              1. Select Paint Service Package
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {options.map((opt) => {
                const isSelected = selectedOptionId === opt.id || (selectedOptionId === '' && options[0].id === opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedOptionId(opt.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid #f59e0b' : '1px solid var(--border-light, #2A2D3C)',
                      backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-card, #1A1C26)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '5px solid #f59e0b' : '2px solid var(--border-light, #71717a)',
                          boxSizing: 'border-box',
                          flexShrink: 0
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {opt.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                          {opt.description}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: isSelected ? '#f59e0b' : 'var(--text-main)' }}>
                        {opt.unit === 'sq ft' ? `₹${opt.price} / sq ft` : `₹${opt.price}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Property Type Selection */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Home size={15} color="#f59e0b" />
              <span>2. Property Type</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {PROPERTY_TYPE_OPTIONS.map((pt) => {
                const active = propertyType === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setPropertyType(pt)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      border: active ? '1px solid #f59e0b' : '1px solid var(--border-light, #2A2D3C)',
                      backgroundColor: active ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-subtle, #161822)',
                      color: active ? '#f59e0b' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {pt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area / Measurement input (if area based) */}
          {isAreaBased && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Ruler size={15} color="#f59e0b" />
                  <span>3. Approximate Painting Area (Sq. Ft.)</span>
                </label>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>
                  {areaSqFt} Sq. Ft.
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={areaSqFt}
                onChange={(e) => setAreaSqFt(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer', marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[250, 500, 1000, 1500, 2000, 3000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAreaSqFt(val)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: areaSqFt === val ? '1px solid #f59e0b' : '1px solid var(--border-light)',
                      backgroundColor: areaSqFt === val ? 'rgba(245, 158, 11, 0.16)' : 'transparent',
                      color: areaSqFt === val ? '#f59e0b' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {val} sq ft
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Surface Condition */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={15} color="#f59e0b" />
              <span>4. Existing Surface Condition</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {SURFACE_CONDITION_OPTIONS.map((sc) => {
                const active = surfaceCondition === sc;
                return (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setSurfaceCondition(sc)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      border: active ? '1px solid #f59e0b' : '1px solid var(--border-light, #2A2D3C)',
                      backgroundColor: active ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-subtle, #161822)',
                      color: active ? '#f59e0b' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {sc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Material Arrangement */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={15} color="#f59e0b" />
              <span>5. Paint & Material Arrangement</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {PAINT_MATERIAL_OPTIONS.map((mat) => {
                const active = materialChoice === mat;
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => setMaterialChoice(mat)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      border: active ? '1px solid #f59e0b' : '1px solid var(--border-light, #2A2D3C)',
                      backgroundColor: active ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-subtle, #161822)',
                      color: active ? '#f59e0b' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {mat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doorstep Inspection Disclaimer Banner */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.85rem 1rem', borderRadius: '14px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
              <strong style={{ color: '#f59e0b' }}>Doorstep Measurement & Inspection: </strong>
              The final price is confirmed after doorstep Laser Area Measurement, moisture test, and surface inspection by our verified Taaskr Paint Partner.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.15rem 1.5rem', borderTop: '1px solid var(--border-light, #2A2D3C)', backgroundColor: 'var(--bg-card, #1A1C26)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Estimated Price Quote</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f59e0b' }}>
              ₹{estimatedPrice.toLocaleString()}
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                ({isAreaBased ? `${areaSqFt} sq ft` : 'Estimated'})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleProceedToBooking}
            style={{
              padding: '0.85rem 1.6rem',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              fontSize: '0.925rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)'
            }}
          >
            <span>Proceed to Booking</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
