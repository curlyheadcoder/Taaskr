import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
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

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchMyBookings = async () => {
    try {
      const res = await api.bookings.getMyBookings();
      // Sort: Newest bookings first
      setBookings(res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
    
    // Load current user profile for prefill
    const loadUser = async () => {
      try {
        const profile = await api.auth.me();
        setCurrentUser(profile);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'ASSIGNED': return 'badge-assigned';
      case 'ACCEPTED': return 'badge-accepted';
      case 'IN_PROGRESS': return 'badge-inprogress';
      case 'COMPLETED': return 'badge-completed';
      case 'CANCELLED':
      case 'REJECTED': return 'badge-cancelled';
      default: return '';
    }
  };

  // Pay Now handler for pending payments
  const handlePayNow = async (booking) => {
    setPayingBookingId(booking.id);
    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      // 2. Call backend orders API
      const order = await api.payments.createOrder(booking.id);

      // 3. Open Razorpay Checkout options
      const options = {
        key: order.razorpayKeyId,
        amount: Math.round(order.amount * 100), // in paise
        currency: order.currency || 'INR',
        name: 'Taaskr',
        description: `Payment for ${booking.serviceName}`,
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
            setPayingBookingId(booking.id);
            // 4. Verify payment via backend
            await api.payments.verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            // Confetti effect
            confetti({
              particleCount: 120,
              spread: 60,
              origin: { y: 0.5 }
            });

            alert('Payment successful!');
            fetchMyBookings(); // Refresh bookings
          } catch (err) {
            alert(`Payment verification failed: ${err.message}`);
          } finally {
            setPayingBookingId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingBookingId(null);
            alert('Payment window closed.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}`);
        setPayingBookingId(null);
      });
      rzp.open();

    } catch (err) {
      alert(err.message || 'Payment initiation failed.');
      setPayingBookingId(null);
    }
  };

  return (
    <div className="app-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: '#fff' }}>My Bookings Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track the real-time execution status of your service requests</p>
        </div>
        <Link to="/" className="btn btn-primary">Book New Service</Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <div style={{
            display: 'inline-block',
            width: '30px',
            height: '30px',
            border: '2.5px solid var(--border-glass)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '1rem' }}>Loading your booking history...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '3rem' }}>🛒</span>
          <h3 style={{ color: '#fff', marginTop: '1rem', fontSize: '1.4rem' }}>No Bookings Yet</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            You haven't made any bookings yet. Choose a service from our catalog to get started.
          </p>
          <Link to="/" className="btn btn-primary">Browse Services</Link>
        </div>
      ) : (
        <div className="table-container glass-panel">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Service Name</th>
                <th>Scheduled Date</th>
                <th>Time Slot</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{String(booking.id).slice(-6)}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{booking.serviceName}</td>
                  <td>{booking.bookingDate}</td>
                  <td>{formatLocalTime(booking.startTime)}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>₹{booking.finalAmount}</td>
                  <td>
                    <span className={`badge ${getStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    {booking.paymentStatus === 'PAID' ? (
                      <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>
                        PAID
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePayNow(booking)}
                        className="btn btn-primary btn-small"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                        disabled={payingBookingId === booking.id}
                      >
                        {payingBookingId === booking.id ? 'Loading...' : `Pay ₹${booking.finalAmount}`}
                      </button>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="btn btn-secondary btn-small"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal Overlay */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem' }}>Booking Summary</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span className={`badge ${getStatusClass(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Status:</span>
                <span className={`badge ${selectedBooking.paymentStatus === 'PAID' ? 'badge-completed' : 'badge-pending'}`}>
                  {selectedBooking.paymentStatus}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Service:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{selectedBooking.serviceName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                <span style={{ color: '#fff' }}>{selectedBooking.categoryName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Scheduled Date & Time:</span>
                <span style={{ color: '#fff' }}>{selectedBooking.bookingDate} at {formatLocalTime(selectedBooking.startTime)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Service Address:</span>
                <span style={{ color: '#fff', textAlign: 'right', maxWidth: '250px' }}>
                  {selectedBooking.address}, {selectedBooking.city} - {selectedBooking.pincode}
                </span>
              </div>

              {selectedBooking.providerId ? (
                <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.15)', marginTop: '0.5rem' }}>
                  <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Assigned Provider Details</h4>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{selectedBooking.providerName}</p>
                </div>
              ) : (
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.15)', marginTop: '0.5rem' }}>
                  <h4 style={{ color: 'var(--amber)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Awaiting Assignment</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Admin is matching you with a professional in your area.</p>
                </div>
              )}

              {selectedBooking.notes && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Your Notes:</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                    "{selectedBooking.notes}"
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              {selectedBooking.paymentStatus === 'PENDING' && (
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    handlePayNow(selectedBooking);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Pay ₹{selectedBooking.finalAmount}
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
