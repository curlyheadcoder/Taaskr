import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, PhoneCall, Home, ShieldCheck, Clock, Calendar, MapPin, 
  ChevronRight, Sparkles, CheckCircle2, AlertCircle, Tag, UserCheck
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

  const getTodayIST = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  };

  const getTomorrowIST = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  };

  const getAvailableTimeSlots = (dateStr) => {
    const ALL_TIME_SLOTS = [
      { value: '09:00', label: '09:00 AM - 11:00 AM' },
      { value: '10:00', label: '10:00 AM - 12:00 PM' },
      { value: '12:00', label: '12:00 PM - 02:00 PM' },
      { value: '14:00', label: '02:00 PM - 04:00 PM' },
      { value: '16:00', label: '04:00 PM - 06:00 PM' },
      { value: '18:00', label: '06:00 PM - 08:00 PM' }
    ];

    if (dateStr !== getTodayIST()) {
      return ALL_TIME_SLOTS;
    }

    const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
    const [currH, currM] = timeFormatter.format(new Date()).split(':').map(Number);
    const currentMins = currH * 60 + currM;

    return ALL_TIME_SLOTS.filter(slot => {
      const [h, m] = slot.value.split(':').map(Number);
      return (h * 60 + m) > currentMins + 15;
    });
  };

  const [selectedCatId, setSelectedCatId] = useState(initialCategoryId || availableCategories[0]?.id || 'appliances_electrical');
  const [quoteType, setQuoteType] = useState('CALL'); // 'CALL' (FREE) or 'IN_HOUSE' (₹99)
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = getTodayIST();
    const available = getAvailableTimeSlots(today);
    return available.length > 0 ? today : getTomorrowIST();
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    const today = getTodayIST();
    const available = getAvailableTimeSlots(today);
    return available.length > 0 ? available[0].value : '10:00';
  });
  const [city, setCity] = useState('Indore');
  const [pincode, setPincode] = useState('452001');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const slots = getAvailableTimeSlots(selectedDate);
    if (slots.length === 0 && selectedDate === getTodayIST()) {
      const tomorrow = getTomorrowIST();
      setSelectedDate(tomorrow);
      setSelectedTime(getAvailableTimeSlots(tomorrow)[0]?.value || '10:00');
    } else if (slots.length > 0 && !slots.some(s => s.value === selectedTime)) {
      setSelectedTime(slots[0].value);
    }
  }, [selectedDate]);

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

    const isCall = quoteType === 'CALL';
    const typeLabel = isCall ? 'Free On-Call Advice' : 'In-House Inspection (₹99)';
    const fullServiceName = `${catName} - ${typeLabel}`;
    const price = isCall ? 0 : 99;

    const bookingState = {
      serviceId: null,
      serviceName: fullServiceName,
      price: price,
      categoryName: catName,
      bookingDate: selectedDate,
      startTime: selectedTime,
      pickupAddress: address,
      pickupCity: city,
      pickupPincode: pincode,
      packageDescription: `[${typeLabel} - ${isCall ? 'FREE' : '₹99'}]: ${description || 'Custom expert consultation & diagnostic quote request.'}`,
      quoteType: quoteType,
      isQuoteBooking: true
    };

    onClose();
    navigate('/booking-flow', { state: bookingState });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15)',
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
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
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
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
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
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  FREE / ₹99
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#cbd5e1', fontWeight: 500 }}>
                Expert guidance, diagnosis & upfront written quotation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
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
        <form onSubmit={handleProceed} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, backgroundColor: '#0f172a' }}>
          {errorMsg && (
            <div 
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} color="#fca5a5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Category Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.45rem' }}>
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
                padding: '0.75rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid #475569',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none',
                colorScheme: 'dark'
              }}
            >
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Consultation Type */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.55rem' }}>
              2. Select Consultation Option *
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Option A: Consultation On Call (FREE) */}
              <div
                onClick={() => setQuoteType('CALL')}
                style={{
                  border: quoteType === 'CALL' ? '2px solid #10b981' : '1px solid #475569',
                  backgroundColor: quoteType === 'CALL' ? 'rgba(16, 185, 129, 0.18)' : '#1e293b',
                  borderRadius: '14px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontWeight: 800, fontSize: '0.9rem' }}>
                    <PhoneCall size={18} />
                    <span>On-Call Advice</span>
                  </div>
                  <span 
                    style={{ 
                      fontSize: '0.78rem', 
                      fontWeight: 900, 
                      color: '#ffffff', 
                      backgroundColor: '#10b981', 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: '8px',
                      letterSpacing: '0.03em'
                    }}
                  >
                    FREE
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.45, fontWeight: 500 }}>
                  Speak directly with an expert technician over phone for free advice & estimates.
                </p>
                {quoteType === 'CALL' && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#34d399' }}>
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>

              {/* Option B: In-House Inspection (₹99) */}
              <div
                onClick={() => setQuoteType('IN_HOUSE')}
                style={{
                  border: quoteType === 'IN_HOUSE' ? '2px solid #38bdf8' : '1px solid #475569',
                  backgroundColor: quoteType === 'IN_HOUSE' ? 'rgba(56, 189, 248, 0.18)' : '#1e293b',
                  borderRadius: '14px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem' }}>
                    <Home size={18} />
                    <span>In-House Visit</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>₹99</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.45, fontWeight: 500 }}>
                  Certified technician visits your location to inspect, diagnose & issue written quote.
                </p>
                {quoteType === 'IN_HOUSE' && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#38bdf8' }}>
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Requirement Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.45rem' }}>
              3. Describe Your Issue / Requirement (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your specific issue or custom service requirement details..."
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid #475569',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* 4. Preferred Date & Time Slot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.45rem' }}>
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
                  border: '1px solid #475569',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  colorScheme: 'dark'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.45rem' }}>
                Time Slot *
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '12px',
                  border: '1px solid #475569',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  colorScheme: 'dark'
                }}
              >
                {getAvailableTimeSlots(selectedDate).map(slot => (
                  <option key={slot.value} value={slot.value} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Address Details */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.45rem' }}>
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
                border: '1px solid #475569',
                backgroundColor: '#1e293b',
                color: '#ffffff',
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
                  border: '1px solid #475569',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 500
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
                  border: '1px solid #475569',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 500
                }}
              />
            </div>
          </div>

          {/* Trust Guarantees */}
          <div 
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              fontSize: '0.8rem',
              color: '#f8fafc',
              fontWeight: 600,
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={15} color="#38bdf8" />
              <span>Aadhaar Verified Pros</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag size={15} color="#34d399" />
              <span>{quoteType === 'CALL' ? 'FREE On-Call Advice' : 'Flat ₹99 Inspection'}</span>
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
              background: quoteType === 'CALL' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: quoteType === 'CALL' ? '0 8px 20px rgba(16, 185, 129, 0.35)' : '0 8px 20px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{quoteType === 'CALL' ? 'Book Free On-Call Advice' : 'Book In-House Inspection for ₹99'}</span>
            <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

