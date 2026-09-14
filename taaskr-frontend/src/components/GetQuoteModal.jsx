import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, PhoneCall, Home, ShieldCheck, Clock, Calendar, MapPin, 
  ChevronRight, Sparkles, CheckCircle2, AlertCircle, Tag, UserCheck, Star, Award, Phone
} from 'lucide-react';
import { getExpertsByCategory } from '../data/expertsData';
import ExpertCallBridgeModal from './ExpertCallBridgeModal';

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
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [isCallBridgeOpen, setIsCallBridgeOpen] = useState(false);
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

  const categoryExperts = getExpertsByCategory(selectedCatId);
  const activeExpert = categoryExperts.find(e => e.id === selectedExpertId) || categoryExperts[0];

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
    const expertNote = activeExpert ? `Assigned Expert: ${activeExpert.name} (${activeExpert.title})` : 'Auto-Assigned Senior Expert';

    const bookingState = {
      serviceId: null,
      serviceName: fullServiceName,
      price: 99,
      categoryName: catName,
      bookingDate: selectedDate,
      startTime: selectedTime,
      pickupAddress: address,
      pickupCity: city,
      pickupPincode: pincode,
      packageDescription: `[${typeLabel}] ${expertNote}. Requirement: ${description || 'Expert consultation & diagnostic quote request.'}`,
      quoteType: quoteType,
      expertInfo: activeExpert,
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
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
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
          maxWidth: '600px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          color: '#ffffff',
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
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Connect with Category Expert
                </h3>
                <span 
                  style={{
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  Flat ₹99
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8125rem', color: '#94a3b8' }}>
                Speak directly with a domain expert & get upfront diagnostic quote
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
              width: '34px',
              height: '34px',
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
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
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
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
              1. Select Service Category *
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => {
                setSelectedCatId(e.target.value);
                setSelectedExpertId('');
                setErrorMsg('');
              }}
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid #334155',
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

          {/* 2. Choose Consultation Type (₹99) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
              2. Select Consultation Option (Flat ₹99) *
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Option A: Consultation On Call */}
              <div
                onClick={() => setQuoteType('CALL')}
                style={{
                  border: quoteType === 'CALL' ? '2px solid #f59e0b' : '1px solid #334155',
                  backgroundColor: quoteType === 'CALL' ? 'rgba(245, 158, 11, 0.2)' : '#1e293b',
                  borderRadius: '14px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontWeight: 800, fontSize: '0.9rem' }}>
                    <PhoneCall size={18} />
                    <span>On-Call Advice</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24' }}>₹99</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                  Direct phone call consultation with verified domain expert for diagnostic advice & parts estimate.
                </p>
                {quoteType === 'CALL' && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#fbbf24' }}>
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>

              {/* Option B: In-House Inspection */}
              <div
                onClick={() => setQuoteType('IN_HOUSE')}
                style={{
                  border: quoteType === 'IN_HOUSE' ? '2px solid #38bdf8' : '1px solid #334155',
                  backgroundColor: quoteType === 'IN_HOUSE' ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
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
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                  Doorstep visit by certified technician to inspect location, diagnose issue & issue formal quote.
                </p>
                {quoteType === 'IN_HOUSE' && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', color: '#38bdf8' }}>
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Verified Domain Experts Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                3. Choose Available Domain Expert *
              </label>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Award size={14} /> Verified Senior Pros
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {categoryExperts.map((exp) => {
                const isSelected = (selectedExpertId === exp.id) || (!selectedExpertId && exp.id === categoryExperts[0].id);
                return (
                  <div
                    key={exp.id}
                    onClick={() => setSelectedExpertId(exp.id)}
                    style={{
                      border: isSelected ? '2px solid #f59e0b' : '1px solid #334155',
                      backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.12)' : '#1e293b',
                      borderRadius: '14px',
                      padding: '0.75rem 0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img 
                      src={exp.avatar} 
                      alt={exp.name} 
                      style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f59e0b' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>{exp.name}</h4>
                        <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '8px' }}>
                          {exp.experienceYears}+ yrs exp
                        </span>
                      </div>
                      <p style={{ margin: '0.15rem 0 0.3rem 0', fontSize: '0.78rem', color: '#cbd5e1' }}>{exp.title}</p>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {exp.specialties.slice(0, 2).map((s, idx) => (
                          <span key={idx} style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 800 }}>
                        <Star size={13} fill="#fbbf24" />
                        <span>{exp.rating}</span>
                      </div>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSelected ? '5px solid #f59e0b' : '2px solid #64748b', backgroundColor: '#0f172a' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Requirement Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
              4. Describe Your Issue / Requirement (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your specific requirement or issue details for the expert..."
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* 5. Date & Time Slot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
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
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  colorScheme: 'dark'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                Time Slot *
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  colorScheme: 'dark'
                }}
              >
                <option value="09:00" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>09:00 AM - 11:00 AM</option>
                <option value="10:00" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>10:00 AM - 12:00 PM</option>
                <option value="12:00" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>12:00 PM - 02:00 PM</option>
                <option value="14:00" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>02:00 PM - 04:00 PM</option>
                <option value="16:00" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>04:00 PM - 06:00 PM</option>
                <option value="18:00" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>06:00 PM - 08:00 PM</option>
              </select>
            </div>
          </div>

          {/* 6. Address Details */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
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
                border: '1px solid #334155',
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
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
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
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
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
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              fontSize: '0.78rem',
              color: '#ffffff',
              fontWeight: 600,
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserCheck size={15} color="#38bdf8" />
              <span>Assigned Domain Expert</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag size={15} color="#f59e0b" />
              <span>₹99 Consultation</span>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setIsCallBridgeOpen(true)}
              style={{
                padding: '0.85rem',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Phone size={17} />
              <span>Connect Call Now</span>
            </button>

            <button
              type="submit"
              style={{
                padding: '0.85rem',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 8px 20px rgba(217, 119, 6, 0.35)'
              }}
            >
              <span>Book Quote (₹99)</span>
              <ChevronRight size={17} />
            </button>
          </div>
        </form>

        <ExpertCallBridgeModal
          isOpen={isCallBridgeOpen}
          onClose={() => setIsCallBridgeOpen(false)}
          expert={activeExpert}
          categoryName={catName}
          onCallFinished={(res) => {
            if (res && res.report) {
              setDescription(`[Expert Consultation Logged]: ${res.report.diagnosedIssue} | ${res.report.recommendedAction} (Est: ${res.report.estimatedCost})`);
            }
          }}
        />
      </div>
    </div>
  );
}
