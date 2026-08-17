import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import confetti from 'canvas-confetti';

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

  // If no state passed (e.g. refresh), send user back to catalog
  const bookingState = location.state || {};
  const { serviceId, serviceName, price, bookingDate, startTime } = bookingState;

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Indore'); // Pre-fill with backend seed location
  const [pincode, setPincode] = useState('452001'); // Pre-fill with backend seed pincode
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [newBooking, setNewBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Attempt to prefill user details if logged in
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
      // 1. Create booking in Spring Boot backend
      const booking = await api.bookings.create({
        serviceId: Number(serviceId),
        bookingDate,
        startTime,
        address,
        city,
        pincode,
        notes
      });
      
      setNewBooking(booking);

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      // 3. Create payment order (calls backend to generate Razorpay order using booking's finalAmount)
      const order = await api.payments.createOrder(booking.id);

      // 4. Open Razorpay Checkout modal
      const options = {
        key: order.razorpayKeyId,
        amount: Math.round(order.amount * 100), // in paise
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
            // 5. Send parameters to verify signature on the backend
            await api.payments.verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            // 6. Confetti and success state
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.5 }
            });
            
            // Get the updated booking details from backend after verification
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

  if (!serviceId) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
          <span style={{ fontSize: '3rem' }}>🛍️</span>
          <h2 style={{ color: '#fff', marginTop: '1rem' }}>No Active Booking Session</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Please select a service from our catalog to book.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Browse Catalog</Link>
        </div>
      </div>
    );
  }

  if (completed && newBooking) {
    return (
      <div className="app-container animate-fade-in" style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem 1.5rem' }}>
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', borderRadius: 'var(--radius-lg)' }}>
          <span style={{
            fontSize: '3rem',
            background: 'rgba(16, 185, 129, 0.15)',
            padding: '1.25rem',
            borderRadius: '50%',
            color: 'var(--emerald)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>🎉</span>
          
          <h1 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '0.5rem' }}>Booking Confirmed!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem' }}>
            Your booking request has been placed successfully. A professional will contact you shortly.
          </p>

          <div className="glass-panel" style={{
            padding: '1.5rem',
            textAlign: 'left',
            marginBottom: '2rem',
            background: 'rgba(15, 17, 26, 0.4)',
            border: '1px solid var(--border-glass)'
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Booking details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Service:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{serviceName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Scheduled Date:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{bookingDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Start Time:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{formatLocalTime(startTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Status:</span>
                <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>
                  {newBooking.paymentStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
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
      <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '2rem' }}>Confirm Booking & Address</h1>
      
      <div className="grid-cols-2" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Side: Address Details Form */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.5rem' }}>Service Address</h2>
          
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

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Additional Instructions / Notes</label>
            <textarea
              placeholder="Any specific instructions for the service provider (optional)..."
              className="form-control"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              style={{ resize: 'none' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? 'Processing Order...' : 'Pay & Confirm Booking'}
          </button>
        </form>

        {/* Right Side: Order Summary Checkout Card */}
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.5rem' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>{serviceName}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>On {bookingDate} at {formatLocalTime(startTime)}</p>
              </div>
              <span style={{ color: '#fff', fontWeight: 600 }}>₹{price}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span>₹{price}</span>
              </div>
              <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>GST (18%):</span>
                <span>₹{tax}</span>
              </div>
              <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Convenience Fee:</span>
                <span style={{ color: 'var(--emerald)' }}>Free</span>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-glass)',
              paddingTop: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '1.2rem',
              fontWeight: 800
            }}>
              <span style={{ color: '#fff' }}>Total Amount:</span>
              <span style={{ color: 'var(--primary)' }}>₹{total}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ color: 'var(--emerald)', fontSize: '1.2rem' }}>🛡️</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Secure payments. If rejected, money is refunded instantly.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
