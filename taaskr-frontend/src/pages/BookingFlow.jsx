import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import confetti from 'canvas-confetti';
import LocationPicker from '../components/LocationPicker';
import { Truck, MapPin, Package, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
  const { 
    serviceId, serviceName, price, bookingDate, startTime,
    isVehicle, pickupAddress, pickupCity, pickupPincode, pickupLatitude, pickupLongitude,
    dropAddress, dropCity, dropPincode, dropLatitude, dropLongitude,
    packageWeightKg, packageDescription, distanceKm, vehicleType
  } = bookingState;

  const [address, setAddress] = useState(pickupAddress || '');
  const [city, setCity] = useState(pickupCity || 'Indore');
  const [pincode, setPincode] = useState(pickupPincode || '452001');
  const [notes, setNotes] = useState(packageDescription || '');
  const [coordinates, setCoordinates] = useState(
    pickupLatitude && pickupLongitude ? { latitude: pickupLatitude, longitude: pickupLongitude } : null
  );
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [newBooking, setNewBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');

  // Provider Selection State
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [isFetchingProviders, setIsFetchingProviders] = useState(false);

  useEffect(() => {
    const prefillUser = async () => {
      try {
        const user = await api.auth.me();
        if (user) {
          setCurrentUser(user);
          if (!pickupCity && user.city) setCity(user.city);
          if (!pickupPincode && user.pincode) setPincode(user.pincode);
        }
      } catch (e) {}
    };
    prefillUser();
  }, [pickupCity, pickupPincode]);

  // Fetch Providers whenever Location changes (for standard services)
  useEffect(() => {
    if (!isVehicle && serviceId && bookingDate && startTime && city && pincode) {
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
  }, [isVehicle, serviceId, bookingDate, startTime, city, pincode]);

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
      const payload = {
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
        notes: isVehicle && packageDescription ? `${notes ? notes + ' | ' : ''}Cargo: ${packageDescription}` : notes
      };

      if (isVehicle) {
        payload.dropAddress = dropAddress || address;
        payload.dropCity = dropCity || city;
        payload.dropPincode = dropPincode || pincode;
        payload.dropLatitude = dropLatitude || coordinates?.latitude;
        payload.dropLongitude = dropLongitude || coordinates?.longitude;
        payload.packageDescription = packageDescription;
        payload.packageWeightKg = packageWeightKg;
        payload.distanceKm = distanceKm;
      }

      const booking = await api.bookings.create(payload);
      
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
          color: '#2563EB'
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
            Your booking request has been placed successfully. {newBooking.status === 'PENDING' ? (isVehicle ? 'We are matching you with a verified driver shortly.' : 'We are matching you with a verified service expert shortly.') : (isVehicle ? 'A driver partner has been assigned.' : 'A service professional has been assigned.')}
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
              {isVehicle && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pickup:</span>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>{address}, {city}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Drop-off:</span>
                    <span style={{ color: '#F97316', fontWeight: 600 }}>{dropAddress || address}, {dropCity || city}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Est. Distance:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{distanceKm} KM</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Partner:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{newBooking.providerName || (isVehicle ? 'Assigning Nearby Driver...' : 'Assigning Service Expert...')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Date:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{bookingDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Time Slot:</span>
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

  return (
    <div className="app-container animate-fade-in">
      <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '2rem' }}>
        {isVehicle ? 'Confirm Vehicle Trip & Details' : 'Confirm Booking & Address'}
      </h1>
      
      <div className="grid-cols-2" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Side: Address Details Form */}
        <form onSubmit={handleSubmit} className="premium-card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isVehicle ? <Truck className="w-5 h-5" /> : null}
            {isVehicle ? 'Trip Addresses' : 'Service Address'}
          </h2>
          
          <div className="form-group">
            <label className="form-label">{isVehicle ? '📍 Pickup Street Address *' : 'Street Address *'}</label>
            <input
              type="text"
              placeholder="House/Flat No, Landmark, Street"
              className="form-control"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
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

            <div className="form-group" style={{ margin: 0 }}>
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

          {isVehicle && dropAddress && (
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#F97316', fontWeight: 700, textTransform: 'uppercase' }}>🏁 Destination Drop-off</span>
              <p style={{ margin: '0.25rem 0', fontWeight: 600, color: 'var(--text-main)' }}>{dropAddress}, {dropCity} ({dropPincode})</p>
              {packageWeightKg && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Cargo: {packageWeightKg} KG {packageDescription ? `• ${packageDescription}` : ''}
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Special Instructions / Cargo Notes (Optional)</label>
            <textarea
              rows="2"
              placeholder={isVehicle ? "e.g. Call sender before reaching, fragile items inside" : "e.g. Please call before arriving"}
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Payment Method Selection */}
          <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'online' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: paymentMethod === 'online' ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-card)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>💳 Online Payment</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>UPI, Cards, NetBanking (Razorpay)</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('after_service')}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'after_service' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: paymentMethod === 'after_service' ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-card)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>💵 {isVehicle ? 'Cash After Trip' : 'Cash After Service'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {isVehicle ? 'Pay driver directly after completion' : 'Pay service expert after job completion'}
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? 'Processing Booking...' : paymentMethod === 'online' ? `Pay & Confirm (₹${price})` : `Place Booking (₹${price})`}
          </button>
        </form>

        {/* Right Side: Order Summary */}
        <div className="premium-card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>Booking Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>{serviceName}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  {isVehicle ? `Intra-city transport (${distanceKm || '5.0'} KM)` : 'Home Service'}
                </p>
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>₹{price}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{bookingDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Time Slot:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formatLocalTime(startTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Dispatch Mode:</span>
                <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                  {isVehicle ? '⚡ Nearby Live Driver Matching' : '⚡ Verified Local Pro Matching'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform & Booking Fee:</span>
                <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-light)' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1.1rem' }}>Total Amount:</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.3rem' }}>₹{price}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
