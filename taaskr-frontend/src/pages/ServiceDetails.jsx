import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ServiceDetails() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date and Time picker states
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [selectedTime, setSelectedTime] = useState('');
  
  // Static/Standard slots for demo availability
  const timeSlots = [
    { label: 'Morning (09:00 AM - 11:00 AM)', value: '09:00' },
    { label: 'Midday (11:30 AM - 01:30 PM)', value: '11:30' },
    { label: 'Afternoon (03:00 PM - 06:00 PM)', value: '15:00' },
    { label: 'Evening (06:30 PM - 08:30 PM)', value: '18:30' }
  ];

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.catalog.getServiceById(serviceId);
        setService(res);
      } catch (err) {
        setError(err.message || 'Failed to load service details');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const handleProceed = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both a date and a time slot');
      return;
    }
    // Navigate to booking checkout flow, passing selected state
    navigate('/booking-flow', {
      state: {
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        bookingDate: selectedDate,
        startTime: selectedTime
      }
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <div style={{
          display: 'inline-block',
          width: '30px',
          height: '30px',
          border: '2.5px solid var(--border-glass)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '1rem' }}>Loading service details...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2 style={{ color: 'var(--text-main)', marginTop: '1rem' }}>Error Loading Service</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{error || 'Service not found.'}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Back to Services</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', hover: { color: 'var(--primary)' } }}>
          ← Back to Catalog
        </Link>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Side: Service Details */}
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
          <span className="badge badge-assigned" style={{ marginBottom: '1rem' }}>Active Service</span>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>{service.name}</h1>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Service Charge</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>₹{service.price}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Duration</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{service.durationMinutes} min</p>
            </div>
          </div>

          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Service Description</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '2rem' }}>
            {service.description} Includes all standard tools and inspection fees. Our certified technician will examine the issues, provide an expert fix, and offer tips to prevent recurrence.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-glass)' }}>
            <h4 style={{ color: 'var(--emerald)', fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ✓ Taaskr Guarantee Included
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              We cover damages up to ₹10,000. All professionals are fully verified and approved.
            </p>
          </div>
        </div>

        {/* Right Side: Appointment Scheduling */}
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>Select Date & Time</h2>

          <div className="form-group">
            <label className="form-label">Choose Service Date</label>
            <input
              type="date"
              className="form-control"
              min={tomorrowStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ background: 'var(--bg-slate-900)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label className="form-label">Available Time Slots</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {timeSlots.map((slot) => (
                <label
                  key={slot.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${selectedTime === slot.value ? 'var(--primary)' : 'var(--border-glass)'}`,
                    background: selectedTime === slot.value ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 17, 26, 0.4)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="radio"
                      name="timeslot"
                      value={slot.value}
                      checked={selectedTime === slot.value}
                      onChange={() => setSelectedTime(slot.value)}
                      style={{ accentColor: 'var(--primary)', transform: 'scale(1.15)' }}
                    />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: selectedTime === slot.value ? 600 : 400 }}>
                      {slot.label}
                    </span>
                  </div>
                  <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>Available</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleProceed}
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem' }}
          >
            Confirm & Book Service ➔
          </button>
        </div>
      </div>
    </div>
  );
}
