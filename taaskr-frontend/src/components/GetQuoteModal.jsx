import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, PhoneCall, Home, ShieldCheck, Clock, Calendar, MapPin, 
  ChevronRight, Sparkles, CheckCircle2, AlertCircle, Tag
} from 'lucide-react';

export default function GetQuoteModal({ isOpen, onClose, initialCategoryId, categories = [] }) {
  const navigate = useNavigate();

  const DEFAULT_CATEGORIES = [
    { id: 'appliances_electrical', name: 'Appliances & Electrical' },
    { id: 'plumbing_cleaning', name: 'Plumbing & Cleaning' },
    { id: 'pest_control', name: 'Pest Control' },
    { id: 'salon_wellness', name: 'Salon & Massage / Wellness' },
    { id: 'civil_maintenance', name: 'Civil & Property Maintenance' },
    { id: 'tech_automation', name: 'Tech & Home Automation' },
    { id: 'vehicle_autocare', name: 'Vehicle & Auto Care' },
    { id: 'home_help', name: 'Home Help & Errand Services' },
    { id: 'security_services', name: 'Security Services' },
    { id: 'diagnostic_healthcare', name: 'Diagnostic & Healthcare Services' },
    { id: 'logistics', name: 'Logistics & Shifting' }
  ];

  const availableCategories = (categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES;

  const [selectedCatId, setSelectedCatId] = useState(initialCategoryId || availableCategories[0]?.id || 'appliances_electrical');
  const [quoteType, setQuoteType] = useState('CALL'); // 'CALL' or 'IN_HOUSE'
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [city, setCity] = useState('Indore');
  const [pincode, setPincode] = useState('452001');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCatId(initialCategoryId);
    }
  }, [initialCategoryId]);

  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem('taaskr_location');
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (parsed.city) setCity(parsed.city);
        if (parsed.pincode) setPincode(parsed.pincode);
      }
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj.city && !city) setCity(userObj.city);
        if (userObj.pincode && !pincode) setPincode(userObj.pincode);
      }
    } catch (e) {}
  }, []);

  if (!isOpen) return null;

  const currentCategory = availableCategories.find(c => String(c.id) === String(selectedCatId)) || availableCategories[0];
  const catName = currentCategory?.name || 'Selected Category';

  const handleProceed = (e) => {
    e.preventDefault();
    if (!selectedCatId) {
      setErrorMsg('Please select a service category');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Please enter your street address / location');
      return;
    }

    const typeLabel = quoteType === 'CALL' ? 'Consultation on Call' : 'In-House Inspection';
    const fullServiceName = `${catName} - ${typeLabel}`;

    const bookingState = {
      serviceId: null, // Dynamic Quote Service
      serviceName: fullServiceName,
      price: 99,
      categoryName: catName,
      bookingDate: selectedDate,
      startTime: selectedTime,
      pickupAddress: address,
      pickupCity: city,
      pickupPincode: pincode,
      packageDescription: description ? `[Quote Requirement - ${typeLabel}]: ${description}` : `Quote & Inspection Request (${typeLabel})`,
      quoteType: quoteType,
      isQuoteBooking: true
    };

    onClose();
    navigate('/book', { state: bookingState });
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
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border-light, rgba(226, 232, 240, 0.8))',
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
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
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
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}
            >
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Get Custom Quote & Inspection
                </h3>
                <span 
                  style={{
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  Flat ₹99
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8125rem', color: '#94a3b8' }}>
                Expert guidance, diagnosis & upfront written quotation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
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

        {/* Body Form */}
        <form onSubmit={handleProceed} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div 
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Category Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', marginBottom: '0.4rem' }}>
              1. Select Service Category *
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => {
                setSelectedCatId(e.target.value);
                setErrorMsg('');
              }}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid var(--border-light, #cbd5e1)',
                backgroundColor: 'var(--bg-input, #ffffff)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Consultation Type (₹99) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', marginBottom: '0.5rem' }}>
              2. Select Consultation Option (Flat ₹99) *
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Option A: Consultation On Call */}
              <div
                onClick={() => setQuoteType('CALL')}
                style={{
                  border: quoteType === 'CALL' ? '2px solid #d97706' : '1px solid var(--border-light, #cbd5e1)',
                  backgroundColor: quoteType === 'CALL' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-input, #f8fafc)',
                  borderRadius: '14px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontWeight: 800, fontSize: '0.9rem' }}>
                    <PhoneCall size={18} />
                    <span>On-Call Advice</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d97706' }}>₹99</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
                  Speak directly with an expert technician over phone for recommendations & parts estimate.
                </p>
                {quoteType === 'CALL' && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#d97706' }}>
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>

              {/* Option B: In-House Inspection */}
              <div
                onClick={() => setQuoteType('IN_HOUSE')}
                style={{
                  border: quoteType === 'IN_HOUSE' ? '2px solid #0284c7' : '1px solid var(--border-light, #cbd5e1)',
                  backgroundColor: quoteType === 'IN_HOUSE' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-input, #f8fafc)',
                  borderRadius: '14px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontWeight: 800, fontSize: '0.9rem' }}>
                    <Home size={18} />
                    <span>In-House Visit</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7' }}>₹99</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
                  Certified technician visits your location to inspect, perform diagnostics & issue quote.
                </p>
                {quoteType === 'IN_HOUSE' && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#0284c7' }}>
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Requirement / Notes Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', marginBottom: '0.4rem' }}>
              3. Describe Your Issue / Requirement (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe details for ${catName} (e.g. AC not cooling, bathroom tile seepage inspection, custom electrical fitting quote)...`}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid var(--border-light, #cbd5e1)',
                backgroundColor: 'var(--bg-input, #ffffff)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* 4. Preferred Date & Time Slot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', marginBottom: '0.4rem' }}>
                Preferred Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light, #cbd5e1)',
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', marginBottom: '0.4rem' }}>
                Time Slot *
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light, #cbd5e1)',
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="09:00">09:00 AM - 11:00 AM</option>
                <option value="10:00">10:00 AM - 12:00 PM</option>
                <option value="12:00">12:00 PM - 02:00 PM</option>
                <option value="14:00">02:00 PM - 04:00 PM</option>
                <option value="16:00">04:00 PM - 06:00 PM</option>
                <option value="18:00">06:00 PM - 08:00 PM</option>
              </select>
            </div>
          </div>

          {/* 5. Address Details */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', marginBottom: '0.4rem' }}>
              Address / Location *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setErrorMsg('');
              }}
              placeholder="House/Flat No., Street, Landmark"
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                borderRadius: '12px',
                border: '1px solid var(--border-light, #cbd5e1)',
                backgroundColor: 'var(--bg-input, #ffffff)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.85rem',
                outline: 'none',
                marginBottom: '0.5rem'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light, #cbd5e1)',
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  fontSize: '0.82rem'
                }}
              />
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Pincode"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light, #cbd5e1)',
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  fontSize: '0.82rem'
                }}
              />
            </div>
          </div>

          {/* Trust Guarantees */}
          <div 
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              fontSize: '0.78rem',
              color: 'var(--text-main, #1e293b)',
              fontWeight: 600,
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={15} color="#0284c7" />
              <span>Aadhaar Verified Pros</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag size={15} color="#d97706" />
              <span>₹99 Flat Fee</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(217, 119, 6, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>Book Quote Request for ₹99</span>
            <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
