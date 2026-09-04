import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import confetti from 'canvas-confetti';
import LocationPicker from '../components/LocationPicker';
import { 
  Truck, MapPin, Package, ArrowRight, ShieldCheck, CheckCircle2, 
  CreditCard, Banknote, Calendar, Clock, Navigation, Check, Lock, ChevronRight
} from 'lucide-react';

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
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setCompleted(true);
        setLoading(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway SDK. Please check your network connection.');
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
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
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
            alert('Payment window closed. You can complete the payment anytime from your Bookings dashboard.');
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
      <div className="app-container" style={{ padding: '4rem 1rem' }}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <Package size={22} />
          </div>
          <h2 className="empty-state-title">No Active Booking Session</h2>
          <p className="empty-state-description">Please choose a service from our catalog to start checkout.</p>
          <Link to="/" className="btn btn-primary btn-sm">Browse Catalog</Link>
        </div>
      </div>
    );
  }

  if (completed && newBooking) {
    return (
      <div className="app-container animate-fade-in" style={{ maxWidth: '580px', margin: '0 auto', padding: '3rem 1rem' }}>
        <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success)',
            border: '1px solid var(--success-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <CheckCircle2 size={26} />
          </div>
          
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Booking Confirmed
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.5rem', lineHeight: 1.45 }}>
            Your order #{String(newBooking.id).slice(-6)} has been registered. {newBooking.status === 'PENDING' ? (isVehicle ? 'Matching nearby available driver for dispatch.' : 'Dispatching verified service expert.') : (isVehicle ? 'Driver assigned to trip.' : 'Service expert assigned.')}
          </p>

          <div style={{
            padding: '1rem',
            textAlign: 'left',
            marginBottom: '1.5rem',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600, display: 'block' }}>
              Order Details
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{serviceName}</span>
              </div>
              {isVehicle && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pickup:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{address}, {city}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Drop-off:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{dropAddress || address}, {dropCity || city}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Distance:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{distanceKm} KM</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Partner:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                  {newBooking.providerName || (isVehicle ? 'Assigning nearby driver...' : 'Assigning service expert...')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Time:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{bookingDate} at {formatLocalTime(startTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment:</span>
                <span className={`badge ${newBooking.paymentStatus === 'PAID' ? 'badge-completed' : 'badge-pending'}`}>
                  {newBooking.paymentStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700, fontFeatureSettings: 'tnum' }}>₹{newBooking.finalAmount}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/bookings" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
              View in My Bookings
            </Link>
            <Link to="/" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Breadcrumb Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>Catalog</Link>
        <ChevronRight size={13} />
        <Link to={`/services/${serviceId}`} style={{ color: 'var(--text-muted)' }}>{serviceName}</Link>
        <ChevronRight size={13} />
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Checkout</span>
      </nav>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {isVehicle ? 'Confirm Trip Address & Checkout' : 'Confirm Service Location & Checkout'}
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Review your booking location, preferred payment method, and service summary.
        </p>
      </div>
      
      <div className="grid-cols-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Side: Address Details Form */}
        <form onSubmit={handleSubmit} className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <MapPin size={16} color="var(--primary)" />
              <span>{isVehicle ? 'Pickup & Trip Location' : 'Service Address'}</span>
            </h2>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <span>{isVehicle ? 'Pickup Street Address *' : 'Street Address *'}</span>
            </label>
            <input
              type="text"
              placeholder="Flat/House No, Building, Landmark, Street"
              className="form-control"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
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
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Drop-off Destination
              </span>
              <p style={{ margin: '0.2rem 0', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                {dropAddress}, {dropCity} ({dropPincode})
              </p>
              {packageWeightKg && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Cargo: {packageWeightKg} KG {packageDescription ? `• ${packageDescription}` : ''}
                </span>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Special Instructions (Optional)</label>
            <textarea
              rows="2"
              placeholder="Gate code, landmark notes, or special handling instructions..."
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Payment Method Selection */}
          <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: paymentMethod === 'online' ? 'var(--primary)' : 'var(--border-light)',
                  backgroundColor: paymentMethod === 'online' ? 'var(--primary-subtle)' : 'var(--bg-card)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8125rem' }}>
                  <CreditCard size={15} color="var(--primary)" />
                  <span>Online Payment</span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Instant UPI, Cards & NetBanking
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('after_service')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: paymentMethod === 'after_service' ? 'var(--primary)' : 'var(--border-light)',
                  backgroundColor: paymentMethod === 'after_service' ? 'var(--primary-subtle)' : 'var(--bg-card)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8125rem' }}>
                  <Banknote size={15} color="var(--primary)" />
                  <span>{isVehicle ? 'Cash on Trip' : 'Cash on Service'}</span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Pay expert directly upon completion
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            disabled={loading}
          >
            {loading ? 'Confirming Booking...' : paymentMethod === 'online' ? `Confirm Booking & Pay ₹${price}` : `Confirm Booking (₹${price})`}
          </button>
        </form>

        {/* Right Side: Order Summary */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <Package size={16} color="var(--primary)" />
              <span>Order Summary</span>
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.875rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{serviceName}</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {isVehicle ? `Freight transit (${distanceKm || '5.0'} KM)` : 'Home Service'}
                </span>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                ₹{price}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Date:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{bookingDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Time Slot:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{formatLocalTime(startTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Dispatch Mode:</span>
                <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                  {isVehicle ? 'Live Driver Auto-Match' : 'Verified Partner Dispatch'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 500, fontFeatureSettings: 'tnum' }}>₹{price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform Fee:</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.9375rem' }}>Total Amount:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1.2rem', fontFeatureSettings: 'tnum' }}>₹{price}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              <Lock size={12} />
              <span>256-bit encrypted checkout with verified partner guarantee.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
