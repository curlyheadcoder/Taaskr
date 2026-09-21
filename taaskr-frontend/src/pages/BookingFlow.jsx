import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatLocalTime, generateTimeOptions } from '../utils/time';
import confetti from 'canvas-confetti';
import LocationPicker from '../components/LocationPicker';
import { 
  Truck, MapPin, Package, ArrowRight, ShieldCheck, CheckCircle2, 
  CreditCard, Banknote, Calendar, Clock, Navigation, Check, Lock, ChevronRight, AlertCircle
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
    serviceId,
    serviceName,
    price,
    bookingDate,
    startTime,
    pickupAddress,
    dropAddress,
    pickupCity,
    dropCity,
    pickupPincode,
    dropPincode,
    pickupLatitude,
    pickupLongitude,
    dropLatitude,
    dropLongitude,
    packageDescription,
    packageWeightKg,
    distanceKm,
    categoryName,
    isVehicle: rawIsVehicle
  } = bookingState;

  const isVehicle = Boolean(
    rawIsVehicle && 
    ((categoryName || '').toLowerCase().includes('logistics') || 
     (categoryName || '').toLowerCase().includes('transport') || 
     (categoryName || '').toLowerCase().includes('shifting'))
  );

  const isFreeService = Number(price) === 0 || 
                        Boolean(serviceName && (
                          serviceName.toLowerCase().includes('advice') || 
                          serviceName.toLowerCase().includes('consultation') || 
                          serviceName.toLowerCase().includes('quote') || 
                          serviceName.toLowerCase().includes('inspection')
                        ));


  const getTodayIST = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  };

  const getCurrentTimeIST = () => {
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
    return formatter.format(new Date());
  };

  const getISTCurrentMinutes = () => {
    const [currH, currM] = getCurrentTimeIST().split(':').map(Number);
    return (currH || 0) * 60 + (currM || 0);
  };


  const isTimeInPastForToday = (dateStr, timeStr) => {
    const today = getTodayIST();
    if (dateStr < today) return true;
    if (dateStr > today) return false;
    if (!timeStr) return false;

    const [currH, currM] = getCurrentTimeIST().split(':').map(Number);
    const currMins = currH * 60 + currM;

    const [startH, startM] = timeStr.split(':').map(Number);
    const startMins = (startH || 0) * 60 + (startM || 0);

    return startMins <= currMins + 2;
  };

  const getQuickDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(d);
      const dayDate = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }).format(d);
      options.push({ dateStr, dayName, dayDate });
    }
    return options;
  };

  const PRESET_TIME_SLOTS = [
    { value: '09:00', label: '09:00 AM' },
    { value: '10:30', label: '10:30 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:30', label: '01:30 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '16:30', label: '04:30 PM' },
    { value: '18:00', label: '06:00 PM' },
    { value: '19:30', label: '07:30 PM' },
    { value: '20:30', label: '08:30 PM' }
  ];

  const [selectedDate, setSelectedDate] = useState(() => {
    const initialDate = bookingDate || getTodayIST();
    return initialDate < getTodayIST() ? getTodayIST() : initialDate;
  });

  const [selectedTime, setSelectedTime] = useState(() => {
    const initialDate = bookingDate || getTodayIST();
    const initialTime = startTime || '10:00';
    if (initialDate === getTodayIST() && isTimeInPastForToday(initialDate, initialTime)) {
      const firstValid = PRESET_TIME_SLOTS.find(s => !isTimeInPastForToday(initialDate, s.value));
      return firstValid ? firstValid.value : getCurrentTimeIST();
    }
    return initialTime;
  });

  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);
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
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Provider Selection State
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [isFetchingProviders, setIsFetchingProviders] = useState(false);
  const [quoteServiceId, setQuoteServiceId] = useState(serviceId || null);

  const handleDateChange = (newDate) => {
    const today = getTodayIST();
    if (newDate < today) {
      setSelectedDate(today);
      setModalAlert({
        title: 'Past Date Not Allowed',
        message: 'Booking date cannot be in the past. Date has been set to today.'
      });
      return;
    }
    setSelectedDate(newDate);
    if (newDate === today && isTimeInPastForToday(newDate, selectedTime)) {
      const currentTime = getCurrentTimeIST();
      setSelectedTime(currentTime);
      setModalAlert({
        title: 'Past Time Not Allowed',
        message: `The selected time slot (${formatLocalTime(selectedTime)}) has already passed for today. Time has been updated to current time (${formatLocalTime(currentTime)}).`
      });
    }
  };

  const handleTimeChange = (newTime) => {
    if (selectedDate === getTodayIST() && isTimeInPastForToday(selectedDate, newTime)) {
      const currentTime = getCurrentTimeIST();
      setSelectedTime(currentTime);
      setModalAlert({
        title: 'Past Time Not Allowed',
        message: `Selected time (${formatLocalTime(newTime)}) has already passed for today. Please choose an upcoming time window.`
      });
      return;
    }
    setSelectedTime(newTime);
  };

  useEffect(() => {
    if (!serviceId) {
      api.catalog.getServices().then(servs => {
        if (Array.isArray(servs) && servs.length > 0) {
          let match = null;
          if (serviceName) {
            const baseName = serviceName.split('(')[0].trim().toLowerCase();
            match = servs.find(s => s.name && (baseName.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(baseName)));
          }
          if (!match && bookingState.categoryName) {
            match = servs.find(s => (s.categoryName || '').toLowerCase().includes((bookingState.categoryName || '').toLowerCase()));
          }
          setQuoteServiceId(match ? match.id : servs[0].id);
        } else {
          setQuoteServiceId(1);
        }
      }).catch(() => setQuoteServiceId(1));
    }
  }, [serviceId, serviceName, bookingState.categoryName]);

  useEffect(() => {
    const prefillUser = async () => {
      try {
        const [user, addresses] = await Promise.all([
          api.auth.me(),
          api.addresses.getAll().catch(() => [])
        ]);
        if (user) {
          setCurrentUser(user);
          if (!pickupCity && user.city) setCity(user.city);
          if (!pickupPincode && user.pincode) setPincode(user.pincode);
        }
        if (Array.isArray(addresses)) {
          setSavedAddresses(addresses);
          const defaultAddr = addresses.find(a => a.isDefault);
          if (defaultAddr && !address) {
            setAddress(defaultAddr.streetAddress);
            if (defaultAddr.city) setCity(defaultAddr.city);
            if (defaultAddr.pincode) setPincode(defaultAddr.pincode);
            if (defaultAddr.latitude && defaultAddr.longitude) {
              setCoordinates({ latitude: defaultAddr.latitude, longitude: defaultAddr.longitude });
            }
          }
        }
      } catch (e) {}
    };
    prefillUser();
  }, [pickupCity, pickupPincode]);

  // Fetch Providers whenever Location or Custom Time changes
  useEffect(() => {
    if (!isVehicle && serviceId && selectedDate && selectedTime && city && pincode) {
      const fetchProviders = async () => {
        setIsFetchingProviders(true);
        try {
          const providers = await api.bookings.getAvailableProviders(serviceId, city, pincode, selectedDate, selectedTime);
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
  }, [isVehicle, serviceId, selectedDate, selectedTime, city, pincode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeServiceId = serviceId || quoteServiceId || 1;

    if (!activeServiceId && !serviceName && !bookingState.isQuoteBooking) {
      setModalAlert({
        title: 'Invalid Session',
        message: 'Please start booking from the service page.',
        navigateOnClose: '/'
      });
      return;
    }

    if (currentUser && (!currentUser.emailVerified || !currentUser.phoneVerified)) {
      setModalAlert({
        title: 'Verification Required',
        message: 'Your email address and mobile phone number must both be verified before booking a service. Please verify them first.'
      });
      return;
    }

    if (!address || !city || !pincode) {
      setModalAlert({
        title: 'Missing Address',
        message: 'Please fill in all address fields.'
      });
      return;
    }

    setLoading(true);
    try {
      // Ensure selectedTime is not in the past if booking for today
      let safeStartTime = selectedTime;
      const todayIST = getTodayIST();

      if (selectedDate < todayIST) {
        setModalAlert({
          title: 'Invalid Date',
          message: 'Booking date cannot be in the past.'
        });
        setLoading(false);
        return;
      }

      if (selectedDate === todayIST && isTimeInPastForToday(selectedDate, selectedTime)) {
        setModalAlert({
          title: 'Past Time Not Allowed',
          message: `Selected time slot (${formatLocalTime(selectedTime)}) has already passed for today. Please choose an upcoming time window.`
        });
        setLoading(false);
        return;
      }

      const payload = {
        serviceId: Number(activeServiceId),
        providerId: selectedProviderId ? Number(selectedProviderId) : null,
        bookingDate: selectedDate,
        startTime: safeStartTime,
        paymentMethod: (Number(price) === 0 || paymentMethod === 'after_service') ? 'AFTER_SERVICE' : 'ONLINE',
        address,
        city,
        pincode,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        customPrice: price !== undefined && price !== null ? Number(price) : null,
        notes: bookingState.isQuoteBooking 
          ? `[Quote Request - ${Number(price) === 0 ? 'FREE' : '₹' + price}]: ${serviceName} | ${notes || ''}` 
          : (serviceName ? `[Option: ${serviceName}]${notes ? ' | ' + notes : ''}${isVehicle && packageDescription ? ' | Cargo: ' + packageDescription : ''}` : (isVehicle && packageDescription ? `${notes ? notes + ' | ' : ''}Cargo: ${packageDescription}` : notes))
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
            setModalAlert({
              title: 'Payment Verification Failed',
              message: err.message,
              navigateOnClose: '/bookings'
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setModalAlert({
              title: 'Payment Cancelled',
              message: 'Payment window closed. You can complete the payment anytime from your Bookings dashboard.',
              navigateOnClose: '/bookings'
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setModalAlert({
          title: 'Payment Failed',
          message: response.error?.description || 'Payment was unsuccessful.',
          navigateOnClose: '/bookings'
        });
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setModalAlert({
        title: 'Booking Failed',
        message: err.message || 'Failed to complete booking. Please try again.'
      });
      setLoading(false);
    }
  };

  if (!serviceId && !serviceName && !bookingState.isQuoteBooking) {
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
                <span style={{ color: 'var(--text-muted)' }}>
                  {isFreeService ? 'Assigned Service Expert:' : (isVehicle ? 'Assigned Driver:' : 'Assigned Partner:')}
                </span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                  {newBooking.providerName || (isVehicle ? 'Assigning nearby driver...' : (isFreeService ? 'Assigning category service expert...' : 'Assigning partner...'))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Time:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                  {(newBooking?.bookingDate || selectedDate || bookingDate) + ' at ' + formatLocalTime(newBooking?.startTime || selectedTime || startTime)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment:</span>
                <span className={`badge ${Number(newBooking.finalAmount) === 0 || isFreeService || newBooking.paymentStatus === 'PAID' || newBooking.paymentStatus === 'COMPLETED' ? 'badge-completed' : 'badge-pending'}`}>
                  {Number(newBooking.finalAmount) === 0 || isFreeService ? 'FREE / COMPLETED' : newBooking.paymentStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                <span style={{ color: Number(newBooking.finalAmount) === 0 || isFreeService ? '#10b981' : 'var(--text-main)', fontWeight: 700, fontFeatureSettings: 'tnum' }}>
                  {Number(newBooking.finalAmount) === 0 || isFreeService ? 'FREE (₹0)' : `₹${newBooking.finalAmount}`}
                </span>
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
        {serviceId ? (
          <Link to={`/services/${serviceId}`} style={{ color: 'var(--text-muted)' }}>{serviceName}</Link>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>{serviceName}</span>
        )}
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

          {currentUser && (!currentUser.emailVerified || !currentUser.phoneVerified) && (
            <div style={{
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              color: 'var(--error)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.875rem' }}>
                <AlertCircle size={17} color="var(--error)" />
                <span>Verification Required Before Booking</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                Your email address and phone number must both be verified before placing a booking.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                {!currentUser.emailVerified && (
                  <Link
                    to={`/verify-email?type=email&email=${encodeURIComponent(currentUser.email || '')}`}
                    className="btn btn-sm"
                    style={{ backgroundColor: '#EF4444', color: '#fff', fontSize: '0.75rem', textDecoration: 'none' }}
                  >
                    Verify Email
                  </Link>
                )}
                {!currentUser.phoneVerified && (
                  <Link
                    to={`/verify-phone?type=phone&phone=${encodeURIComponent(currentUser.phone && !currentUser.phone.startsWith('NA-') ? currentUser.phone : '')}`}
                    className="btn btn-sm"
                    style={{ backgroundColor: '#EF4444', color: '#fff', fontSize: '0.75rem', textDecoration: 'none' }}
                  >
                    Verify Phone
                  </Link>
                )}
              </div>
            </div>
          )}
          
          {savedAddresses.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Saved Addresses</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 500 }}>Click to auto-fill</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setAddress(addr.streetAddress);
                      if (addr.city) setCity(addr.city);
                      if (addr.pincode) setPincode(addr.pincode);
                      if (addr.latitude && addr.longitude) {
                        setCoordinates({ latitude: addr.latitude, longitude: addr.longitude });
                      }
                    }}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      border: '1px solid var(--border-light)',
                      backgroundColor: address === addr.streetAddress ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                      color: address === addr.streetAddress ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: address === addr.streetAddress ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{addr.label?.toLowerCase() || 'Address'}:</span>
                    <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {addr.streetAddress}
                    </span>
                    {addr.isDefault && <span className="badge badge-completed" style={{ fontSize: '0.625rem', padding: '0.05rem 0.3rem' }}>Default</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <span>{isVehicle ? 'Pickup Street Address *' : 'Street Address *'}</span>
            </label>
            <input
              type="text"
              id="booking_street_address"
              name="street-address"
              autoComplete="street-address"
              placeholder="Flat/House No, Building, Landmark, Street"
              className="form-control"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              required
              style={{
                backgroundColor: 'var(--bg-card)',
                color: '#111827',
                borderColor: '#D1D5DB',
                fontWeight: 600,
                fontSize: '0.9375rem'
              }}
            />
          </div>

          {/* Visual Date & Time Selection Component */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Quick Date Selector */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem' }}>
                  <Calendar size={14} color="var(--primary)" />
                  <span>Service Date *</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {selectedDate === getTodayIST() ? 'Today' : selectedDate}
                </span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {getQuickDateOptions().map((opt) => {
                  const isSelected = selectedDate === opt.dateStr;
                  return (
                    <button
                      key={opt.dateStr}
                      type="button"
                      disabled={loading}
                      onClick={() => handleDateChange(opt.dateStr)}
                      style={{
                        padding: '0.55rem 0.4rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.15rem',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px var(--primary-subtle)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.85 }}>
                        {opt.dayName}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                        {opt.dayDate}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Selection Grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>
                  <Clock size={14} color="var(--primary)" />
                  <span>Select Time Slot *</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowCustomPicker(!showCustomPicker)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  {showCustomPicker ? 'Hide Custom Picker' : 'Custom Specific Time...'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {PRESET_TIME_SLOTS.map((slot) => {
                  const isPast = selectedDate === getTodayIST() && isTimeInPastForToday(selectedDate, slot.value);
                  const isSelected = selectedTime === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      disabled={isPast || loading}
                      onClick={() => handleTimeChange(slot.value)}
                      style={{
                        padding: '0.6rem 0.4rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        backgroundColor: isPast ? 'var(--bg-subtle)' : isSelected ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                        color: isPast ? 'var(--text-muted)' : isSelected ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.8125rem',
                        cursor: isPast ? 'not-allowed' : 'pointer',
                        opacity: isPast ? 0.45 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px var(--primary-subtle)' : 'none',
                        position: 'relative'
                      }}
                    >
                      {isSelected && <CheckCircle2 size={13} color="var(--primary)" />}
                      <span>{slot.label}</span>
                      {isPast && (
                        <span style={{ fontSize: '0.58rem', color: 'var(--error)', position: 'absolute', top: '2px', right: '4px', textTransform: 'uppercase', fontWeight: 800 }}>
                          Passed
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Expandable Custom Date/Time Inputs if user needs further dates or specific minute */}
              {showCustomPicker && (
                <div style={{ marginTop: '0.75rem', padding: '0.85rem', borderRadius: '14px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', animation: 'fadeIn 0.2s ease' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Specific Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={selectedDate}
                      min={getTodayIST()}
                      onChange={(e) => handleDateChange(e.target.value)}
                      disabled={loading}
                      style={{ fontSize: '0.8125rem', height: '38px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Exact Custom Time
                    </label>
                    <select
                      className="form-control"
                      value={selectedTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      disabled={loading}
                      style={{ fontSize: '0.8125rem', height: '38px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderColor: 'var(--border-light)' }}
                    >
                      {generateTimeOptions(selectedDate, getTodayIST(), getISTCurrentMinutes()).map(opt => (
                        <option 
                          key={opt.value} 
                          value={opt.value} 
                          disabled={opt.disabled}
                          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
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
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: '#111827',
                  borderColor: '#D1D5DB',
                  fontWeight: 600,
                  fontSize: '0.9375rem'
                }}
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
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: '#111827',
                  borderColor: '#D1D5DB',
                  fontWeight: 600,
                  fontSize: '0.9375rem'
                }}
              />
            </div>
          </div>

          {/* Universal Map Location Pin Picker */}
          <div style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="btn btn-secondary btn-sm"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.55rem',
                fontSize: '0.8125rem',
                borderColor: coordinates ? 'var(--primary)' : 'var(--border-light)',
                backgroundColor: coordinates ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                color: coordinates ? 'var(--primary)' : 'var(--text-main)'
              }}
            >
              <Navigation size={14} />
              <span>{coordinates ? `Exact Map Pin Set (${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)})` : 'Set Location Pin on Interactive Map'}</span>
            </button>
          </div>

          {/* Location Picker Modal */}
          {showMap && (
            <LocationPicker
              isOpen={showMap}
              onClose={() => setShowMap(false)}
              initialLat={coordinates?.latitude || 22.7196}
              initialLng={coordinates?.longitude || 75.8577}
              onSelectLocation={(loc) => {
                if (loc.address) setAddress(loc.address);
                if (loc.city) setCity(loc.city);
                if (loc.pincode) setPincode(loc.pincode);
                setCoordinates({ latitude: loc.lat, longitude: loc.lng });
                setShowMap(false);
              }}
            />
          )}

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
            {isFreeService ? (
              <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontWeight: 700, fontSize: '0.875rem' }}>
                  <ShieldCheck size={18} />
                  <span>Free On-Call Expert Advice & Inspection — No Payment Required</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  This service consultation is 100% FREE. An assigned Category Service Expert will call or visit as scheduled.
                </span>
              </div>
            ) : (
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
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            disabled={loading || (currentUser && (!currentUser.emailVerified || !currentUser.phoneVerified))}
          >
            {loading 
              ? 'Confirming Booking...' 
              : (currentUser && (!currentUser.emailVerified || !currentUser.phoneVerified)) 
              ? 'Verify Email & Phone to Book' 
              : Number(price) === 0 
              ? 'Confirm Free On-Call Advice Request' 
              : paymentMethod === 'online' 
              ? `Confirm Booking & Pay ₹${price}` 
              : `Confirm Booking (₹${price})`}
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
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: Number(price) === 0 ? '#10b981' : 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                {Number(price) === 0 ? 'FREE' : `₹${price}`}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Scheduled Date:</span>
                <span style={{ color: '#111827', fontWeight: 700 }}>{selectedDate || bookingDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Time Slot:</span>
                <span style={{ color: '#111827', fontWeight: 700 }}>{formatLocalTime(selectedTime || startTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Dispatch Mode:</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>
                  {isVehicle ? 'Live Driver Auto-Match' : 'Verified Partner Dispatch'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Subtotal:</span>
                <span style={{ color: '#111827', fontWeight: 700, fontFeatureSettings: 'tnum' }}>
                  {Number(price) === 0 ? 'FREE' : `₹${price}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Platform Fee:</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)' }}>
                <span style={{ color: '#111827', fontWeight: 800, fontSize: '0.9375rem' }}>Total Amount:</span>
                <span style={{ color: Number(price) === 0 ? '#059669' : '#111827', fontWeight: 800, fontSize: '1.25rem', fontFeatureSettings: 'tnum' }}>
                  {Number(price) === 0 ? 'FREE (₹0)' : `₹${price}`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4B5563', fontSize: '0.78rem', marginTop: '0.25rem' }}>
              <Lock size={13} color="#4B5563" />
              <span>256-bit encrypted checkout with verified partner guarantee.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Alert Modal (Replaces Native Browser Alerts) */}
      {modalAlert && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => {
            const navTarget = modalAlert.navigateOnClose;
            setModalAlert(null);
            if (navTarget) navigate(navTarget);
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'var(--bg-card, #1A1C26)',
              color: 'var(--text-main, #F4F4F5)',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-light, #2A2D3C)',
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              animation: 'scaleUp 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                backgroundColor: modalAlert.type === 'error' ? 'var(--error-bg, rgba(239, 68, 68, 0.15))' : 'var(--warning-bg, rgba(245, 158, 11, 0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: modalAlert.type === 'error' ? 'var(--error, #EF4444)' : 'var(--warning, #F59E0B)',
                border: modalAlert.type === 'error' ? '1px solid var(--error-border, rgba(239, 68, 68, 0.3))' : '1px solid var(--warning-border, rgba(245, 158, 11, 0.3))'
              }}
            >
              <AlertCircle size={28} />
            </div>

            <div>
              <h3 style={{ margin: '0 0 0.45rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {modalAlert.title || 'Attention'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #A1A1AA)', lineHeight: 1.5 }}>
                {modalAlert.message}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const navTarget = modalAlert.navigateOnClose;
                setModalAlert(null);
                if (navTarget) navigate(navTarget);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '12px',
                fontWeight: 700,
                marginTop: '0.5rem'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
