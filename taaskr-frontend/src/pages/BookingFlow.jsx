import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import confetti from 'canvas-confetti';
import LocationPicker from '../components/LocationPicker';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BookingFlow() {
  const location = useLocation();
  const navigate = useNavigate();

  const bookingState = location.state || {};
  const { serviceId, serviceName, price, bookingDate, startTime } = bookingState;

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Indore');
  const [pincode, setPincode] = useState('452001');
  const [notes, setNotes] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [newBooking, setNewBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');

  // Provider Selection State
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(null); // null = "No preference"
  const [isFetchingProviders, setIsFetchingProviders] = useState(false);

  useEffect(() => {
    const prefillUser = async () => {
      try {
        const user = await api.auth.me();
        if (user) {
          setCurrentUser(user);
          if (user.city) setCity(user.city);
          if (user.pincode) setPincode(user.pincode);
        }
      } catch (e) {}
    };
    prefillUser();
  }, []);

  // Fetch Providers whenever Location changes
  useEffect(() => {
    if (serviceId && bookingDate && startTime && city && pincode) {
      const fetchProviders = async () => {
        setIsFetchingProviders(true);
        try {
          const providers = await api.bookings.getAvailableProviders(serviceId, city, pincode, bookingDate, startTime);
          setAvailableProviders(providers || []);
          setSelectedProviderId(null);
        } catch (err) {
          console.error("Failed to fetch providers", err);
        } finally {
          setIsFetchingProviders(false);
        }
      };
      
      const delayDebounceFn = setTimeout(() => {
        fetchProviders();
      }, 500);
      
      return () => clearTimeout(delayDebounceFn);
    }
  }, [serviceId, bookingDate, startTime, city, pincode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceId) {
      alert('Invalid session. Please start booking from the service page.');
      navigate('/');
      return;
    }
    if (!address || !city || !pincode) {
      alert('Please fill in all address fields');
      return;
    }

    setLoading(true);
    try {
      const booking = await api.bookings.create({
        serviceId: Number(serviceId),
        providerId: selectedProviderId ? Number(selectedProviderId) : null,
        bookingDate,
        startTime,
        paymentMethod: paymentMethod === 'after_service' ? 'AFTER_SERVICE' : 'ONLINE',
        address,
        city,
        pincode,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        notes
      });
      
      setNewBooking(booking);

      if (paymentMethod === 'after_service') {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 }
        });
        setCompleted(true);
        setLoading(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      const order = await api.payments.createOrder(booking.id);

      const options = {
        key: order.razorpayKeyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency || 'INR',
        name: 'Taaskr',
        description: `Payment for ${serviceName}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          contact: currentUser?.phone || ''
        },
        theme: {
          color: '#6366f1'
        },
        handler: async function (response) {
          try {
            setLoading(true);
            await api.payments.verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.5 }
            });
            
            const updatedBooking = await api.bookings.getById(booking.id);
            setNewBooking(updatedBooking);
            setCompleted(true);
          } catch (err) {
            alert(`Payment verification failed: ${err.message}`);
            navigate('/bookings');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            alert('Payment window closed. You can complete the payment later from your Dashboard.');
            navigate('/bookings');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}`);
        setLoading(false);
        navigate('/bookings');
      });
      rzp.open();

    } catch (err) {
      alert(err.message || 'Failed to complete booking. Please try again.');
      setLoading(false);
    }
  };

  const handleLocationConfirm = (loc) => {
    setCoordinates({ latitude: loc.lat, longitude: loc.lng });
    if (loc.address) {
      setAddress(loc.address);
    }
    setShowMap(false);
  };

  if (!serviceId) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div className="premium-card" style={{ padding: '3rem 2rem', display: 'inline-block' }}>
          <span style={{ fontSize: '3rem' }}>🛍️</span>
          <h2 style={{ color: 'var(--text-main)', marginTop: '1rem' }}>No Active Booking Session</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Please select a service from our catalog to book.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Browse Catalog</Link>
        </div>
      </div>
    );
  }

  if (completed && newBooking) {
    return (
      <div className="app-container animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 1.5rem' }}>
        <div className="premium-card" style={{ padding: '3.5rem 2rem' }}>
          <span style={{
            fontSize: '3rem',
            background: '#D1FAE5',
            padding: '1.25rem',
            borderRadius: '50%',
            color: '#10B981',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>🎉</span>
          
          <h1 style={{ color: 'var(--text-main)', fontSize: '2.2rem', marginBottom: '0.5rem' }}>Booking Confirmed!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem' }}>
            Your booking request has been placed successfully. {newBooking.status === 'PENDING' ? 'We will match you with a professional shortly.' : 'A professional has been assigned.'}
          </p>

          <div style={{
            padding: '1.5rem',
            textAlign: 'left',
            marginBottom: '2rem',
            background: 'var(--bg-page)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)'
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600 }}>Booking details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{serviceName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned To:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{newBooking.providerName || 'Pending Assignment'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Date:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{bookingDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Start Time:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formatLocalTime(startTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                <span className={`badge ${newBooking.paymentStatus === 'PAID' ? 'badge-completed' : 'badge-pending'}`} style={{ fontSize: '0.7rem' }}>
                  {newBooking.paymentStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {newBooking.paymentStatus === 'PAID' ? 'Amount Paid:' : 'Amount to Pay:'}
                </span>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>₹{newBooking.finalAmount}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/bookings" className="btn btn-primary" style={{ flex: 1 }}>Go to My Bookings</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1 }}>Back to Catalog</Link>
          </div>
        </div>
      </div>
    );
  }

  const tax = Math.round(price * 0.18);
  const total = price + tax;

  return (
    <div className="app-container animate-fade-in">
      <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '2rem' }}>Confirm Booking & Address</h1>
      
      <div className="grid-cols-2" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Side: Address Details Form */}
        <form onSubmit={handleSubmit} className="premium-card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.5rem' }}>Service Address</h2>
          
          <div className="form-group">
            <label className="form-label">Street Address *</label>
            <input
              type="text"
              placeholder="House/Flat No, Apartment Name, Street Name"
              className="form-control"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div style={{ marginBottom: '1.25rem', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-page)' }}>
            {!showMap ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>Precise map location</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>Required for better service delivery.</p>
                  </div>
                  <button type="button" onClick={() => setShowMap(true)} className="btn btn-secondary btn-small" disabled={loading}>
                    {coordinates ? '📍 Change Location' : '📍 Select on Map'}
                  </button>
                </div>
                {coordinates && (
                  <div style={{ padding: '0.75rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>📍 Service Location Confirmed</div>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{address}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Lat: {coordinates.latitude.toFixed(6)}, Lng: {coordinates.longitude.toFixed(6)}</div>
                  </div>
                )}
              </div>
            ) : (
              <LocationPicker onLocationConfirm={handleLocationConfirm} />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                placeholder="Indore"
                className="form-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pincode *</label>
              <input
                type="text"
                placeholder="452001"
                className="form-control"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Provider Selection */}
          <div className="form-group" style={{ marginBottom: '2rem', marginTop: '1rem' }}>
            <label className="form-label" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Select Service Professional (Optional)</label>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Choose a specific professional for your service, or let us assign the best match.
            </p>

            {isFetchingProviders ? (
              <div style={{ color: 'var(--primary)', fontSize: '0.9rem', padding: '1rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)' }}>
                ⏳ Finding available professionals matching your location...
              </div>
            ) : availableProviders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
                  background: selectedProviderId === null ? 'var(--bg-hover)' : 'var(--bg-card)',
                  border: selectedProviderId === null ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="providerSelection"
                    checked={selectedProviderId === null}
                    onChange={() => setSelectedProviderId(null)}
                    style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                  />
                  <div>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>No Preference (Let Taaskr Choose)</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>We will assign the nearest & highest-rated professional</div>
                  </div>
                </label>
                
                {availableProviders.map(p => (
                  <label key={p.providerId} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                    background: selectedProviderId === p.providerId ? 'var(--bg-hover)' : 'var(--bg-card)',
                    border: selectedProviderId === p.providerId ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <input
                      type="radio"
                      name="providerSelection"
                      checked={selectedProviderId === p.providerId}
                      onChange={() => setSelectedProviderId(p.providerId)}
                      style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                    />
                    <div>
                      <div style={{ color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {p.name} 
                        <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                          ⭐ {p.rating}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        {p.experienceYears} yrs experience • Serves {p.city} ({p.pincode})
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ color: '#DC2626', fontSize: '0.9rem', padding: '1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)' }}>
                <strong>No professionals available immediately.</strong><br/>
                If you continue, your booking will be placed in PENDING status until a professional becomes available for this time slot.
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Additional Instructions / Notes</label>
            <textarea
              placeholder="Any specific instructions for the service provider (optional)..."
              className="form-control"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Payment Option *</label>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                💳 Pay Online
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="after_service"
                  checked={paymentMethod === 'after_service'}
                  onChange={() => setPaymentMethod('after_service')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                💵 Pay After Service
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? 'Processing Order...' : paymentMethod === 'after_service' ? 'Confirm Booking' : 'Pay & Confirm Booking'}
          </button>
        </form>

        {/* Right Side: Order Summary Checkout Card */}
        <div className="premium-card" style={{ padding: '2.5rem', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.5rem' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 600 }}>{serviceName}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>On {bookingDate} at {formatLocalTime(startTime)}</p>
              </div>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{price}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>₹{price}</span>
              </div>
              <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>GST (18%):</span>
                <span>₹{tax}</span>
              </div>
              <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Convenience Fee:</span>
                <span style={{ color: 'var(--success)' }}>Free</span>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-light)',
              paddingTop: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '1.2rem',
              fontWeight: 800
            }}>
              <span style={{ color: 'var(--text-main)' }}>Total Amount:</span>
              <span style={{ color: 'var(--primary)' }}>₹{total}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ color: 'var(--success)', fontSize: '1.2rem' }}>🛡️</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>Secure payments. If rejected, money is refunded instantly.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
