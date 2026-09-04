import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { formatLocalTime } from '../utils/time';
import { sortBookingsByStatusPriority } from '../utils/sorting';
import confetti from 'canvas-confetti';
import Pagination from '../components/Pagination';
import PaymentRestrictionModal from '../components/PaymentRestrictionModal';
import { 
  Calendar, Clock, CreditCard, Star, Truck, MapPin, User, 
  ExternalLink, AlertCircle, CheckCircle2, ChevronRight, X, 
  RefreshCw, FileText, Settings, ShieldCheck, Mail, Phone, 
  Check, Save, Lock
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

export default function CustomerDashboard({ initialTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(initialTab || urlTab || 'bookings');

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Profile Editor state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profilePincode, setProfilePincode] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Pagination & Modal state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRestrictedBooking, setPaymentRestrictedBooking] = useState(null);

  const [ratingModalData, setRatingModalData] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (urlTab && (urlTab === 'bookings' || urlTab === 'profile')) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchMyBookings = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.bookings.getMyBookings();
      if (Array.isArray(res)) {
        setBookings(sortBookingsByStatusPriority(res));
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
      setErrorMessage(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    try {
      const updated = await api.auth.updateProfile({
        name: profileName.trim(),
        phone: profilePhone.trim(),
        city: profileCity.trim(),
        pincode: profilePincode.trim()
      });
      setCurrentUser(updated);
      setProfileSuccessMsg('Profile updated successfully! Your default booking details have been saved.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      setProfileErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
    
    const loadUser = async () => {
      try {
        const profile = await api.auth.me();
        if (profile) {
          setCurrentUser(profile);
          setProfileName(profile.name || '');
          setProfilePhone(profile.phone && !profile.phone.startsWith('NA-') ? profile.phone : '');
          setProfileCity(profile.city || '');
          setProfilePincode(profile.pincode || '');
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-pending"><span className="badge-dot" /> Pending Dispatch</span>;
      case 'ASSIGNED':
        return <span className="badge badge-assigned"><span className="badge-dot" /> Assigned</span>;
      case 'ACCEPTED':
        return <span className="badge badge-accepted"><span className="badge-dot" /> Accepted</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-inprogress"><span className="badge-dot" /> In Progress</span>;
      case 'COMPLETED':
        return <span className="badge badge-completed"><span className="badge-dot" /> Completed</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="badge badge-cancelled"><span className="badge-dot" /> {status}</span>;
      default:
        return <span className="badge badge-pending">{status}</span>;
    }
  };

  const handlePayNow = async (booking) => {
    if (booking.paymentMethod === 'AFTER_SERVICE' && booking.status !== 'COMPLETED') {
      setPaymentRestrictedBooking(booking);
      setShowPaymentModal(true);
      return;
    }

    setPayingBookingId(booking.id);
    try {
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
        description: `Payment for ${booking.serviceName}`,
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
            setPayingBookingId(booking.id);
            await api.payments.verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            confetti({
              particleCount: 100,
              spread: 60,
              origin: { y: 0.6 }
            });

            fetchMyBookings();
          } catch (err) {
            alert(`Payment verification failed: ${err.message}`);
          } finally {
            setPayingBookingId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingBookingId(null);
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
      if (err.message && (err.message.includes('completed') || err.message.includes('after the service is completed') || err.message.includes('done'))) {
        setPaymentRestrictedBooking(booking);
        setShowPaymentModal(true);
      } else {
        alert(err.message || 'Payment initiation failed.');
      }
      setPayingBookingId(null);
    }
  };

  const handleRateSubmit = async () => {
    if (!ratingModalData) return;
    setSubmittingRating(true);
    try {
      await api.bookings.rate(ratingModalData.id, {
        rating: ratingValue,
        review: reviewText
      });
      setRatingModalData(null);
      fetchMyBookings();
    } catch (err) {
      alert(`Failed to submit rating: ${err.message}`);
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="app-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {activeTab === 'profile' ? 'Profile Settings' : 'My Bookings'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            {activeTab === 'profile'
              ? 'Manage your personal details, verified contacts, and default service locations.'
              : 'Track and manage your scheduled services, trips, and payment receipts.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'bookings' && (
            <button onClick={fetchMyBookings} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          )}
          <Link to="/" className="btn btn-primary btn-sm">
            Book New Service
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => handleTabChange('bookings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'bookings' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'bookings' ? 600 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          <Calendar size={15} />
          <span>My Bookings</span>
          <span className="badge badge-assigned" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'profile' ? 600 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          <Settings size={15} />
          <span>Profile Settings</span>
        </button>
      </div>

      {currentUser && currentUser.emailVerified === false && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          color: '#92400E',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} color="#D97706" />
            <span style={{ fontSize: '0.8125rem' }}>
              Your email (<strong>{currentUser.email}</strong>) is not verified. Verify your email to receive invoices and booking updates.
            </span>
          </div>
          <Link 
            to={`/verify-email?type=email&email=${encodeURIComponent(currentUser.email || '')}`}
            className="btn btn-sm"
            style={{ backgroundColor: '#D97706', color: '#fff', padding: '0.25rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
          >
            Verify Email
          </Link>
        </div>
      )}

      {currentUser && currentUser.phoneVerified === false && (
        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          color: '#1E40AF',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} color="#2563EB" />
            <span style={{ fontSize: '0.8125rem' }}>
              Your mobile contact number {currentUser.phone && !currentUser.phone.startsWith('NA-') ? <strong>({currentUser.phone})</strong> : ''} is not verified. Verify your phone to enable live SMS job dispatches.
            </span>
          </div>
          <Link 
            to={`/verify-phone?type=phone&phone=${encodeURIComponent(currentUser.phone && !currentUser.phone.startsWith('NA-') ? currentUser.phone : '')}`}
            className="btn btn-sm"
            style={{ backgroundColor: '#2563EB', color: '#fff', padding: '0.25rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
          >
            Verify Phone
          </Link>
        </div>
      )}

      {/* TAB 1: PROFILE SETTINGS VIEW */}
      {activeTab === 'profile' ? (
        <div className="grid-cols-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left Column: User Summary Card */}
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.35rem',
                border: '1px solid var(--border-light)'
              }}>
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  {currentUser?.name || 'Account User'}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <span className="badge badge-assigned" style={{ textTransform: 'uppercase' }}>
                    {currentUser?.role || 'CUSTOMER'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {currentUser?.city ? `${currentUser.city} • ${currentUser.pincode || ''}` : 'Location Not Configured'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={14} /> Email Address:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{currentUser?.email}</span>
                  {currentUser?.emailVerified ? (
                    <span className="badge badge-completed" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                      <Check size={11} /> Verified
                    </span>
                  ) : (
                    <Link to={`/verify-email?email=${encodeURIComponent(currentUser?.email || '')}`} className="badge badge-pending" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', textDecoration: 'none' }}>
                      Verify
                    </Link>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={14} /> Phone Number:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {currentUser?.phone && !currentUser.phone.startsWith('NA-') ? currentUser.phone : 'Not set'}
                  </span>
                  {currentUser?.phoneVerified ? (
                    <span className="badge badge-completed" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                      <Check size={11} /> Verified
                    </span>
                  ) : currentUser?.phone && !currentUser.phone.startsWith('NA-') ? (
                    <Link to={`/verify-phone?type=phone&phone=${encodeURIComponent(currentUser?.phone || '')}`} className="badge badge-pending" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', textDecoration: 'none' }}>
                      Verify
                    </Link>
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} /> Account Status:
                </span>
                <span className="badge badge-completed" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                  Active Customer
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                <Lock size={13} color="var(--primary)" />
                <span>Security & Credentials</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                Need to change your account password or recovery credentials?
              </p>
              <Link to="/forgot-password" className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: '0.75rem' }}>
                Reset / Change Password
              </Link>
            </div>
          </div>

          {/* Right Column: Edit Profile Form */}
          <form onSubmit={handleUpdateProfile} className="panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <Settings size={16} color="var(--primary)" />
                <span>Personal Information & Defaults</span>
              </h3>
            </div>

            {profileSuccessMsg && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Doe"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Email Address (Account ID)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Email</span>
              </label>
              <input
                type="email"
                className="form-control"
                value={currentUser?.email || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'var(--bg-subtle)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Mobile Phone Number</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>For Live SMS Alerts</span>
              </label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Default City</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Indore"
                  value={profileCity}
                  onChange={(e) => setProfileCity(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Default Pincode</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 452001"
                  value={profilePincode}
                  onChange={(e) => setProfilePincode(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
              disabled={savingProfile || !profileName.trim()}
            >
              <Save size={15} />
              <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Settings'}</span>
            </button>
          </form>
        </div>
      ) : (
        /* TAB 2: MY BOOKINGS LIST VIEW */
        <div>
          {errorMessage && (
            <div style={{
              background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem'
            }}>
              <span>{errorMessage}</span>
              <button onClick={fetchMyBookings} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="panel" style={{ height: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: '200px', height: '16px' }} />
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar size={22} />
              </div>
              <h3 className="empty-state-title">No bookings yet</h3>
              <p className="empty-state-description">
                You haven't placed any bookings yet. Choose from our verified services catalog to get started.
              </p>
              <Link to="/" className="btn btn-primary btn-sm">Browse Services</Link>
            </div>
          ) : (
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Service Name</th>
                <th>Scheduled Date</th>
                <th>Time Window</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking) => (
                <tr key={booking.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>
                    #{String(booking.id).slice(-6)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {booking.dropAddress && <Truck size={14} color="var(--primary)" />}
                      <strong style={{ color: 'var(--text-main)' }}>{booking.serviceName || 'Service'}</strong>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-main)' }}>{booking.bookingDate || 'N/A'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatLocalTime(booking.startTime) || 'N/A'}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                      ₹{booking.finalAmount ?? booking.totalAmount ?? 0}
                    </span>
                  </td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>
                    {booking.paymentStatus === 'PAID' ? (
                      <span className="badge badge-completed">Paid</span>
                    ) : booking.paymentMethod === 'AFTER_SERVICE' ? (
                      <span className="badge badge-pending">Cash on Completion</span>
                    ) : (
                      <button
                        onClick={() => handlePayNow(booking)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        disabled={payingBookingId === booking.id}
                      >
                        {payingBookingId === booking.id ? 'Processing...' : `Pay ₹${booking.finalAmount}`}
                      </button>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        Details
                      </button>
                      
                      {booking.status === 'COMPLETED' && !booking.rating && (
                        <button
                          onClick={() => {
                            setRatingModalData(booking);
                            setRatingValue(5);
                            setReviewText('');
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#D97706', padding: '0.25rem 0.5rem' }}
                        >
                          <Star size={13} fill="#D97706" />
                          <span>Rate</span>
                        </button>
                      )}
                      {booking.status === 'COMPLETED' && booking.rating && (
                        <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Star size={12} fill="#D97706" /> {booking.rating}/5
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalItems={bookings.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                  Booking Summary
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Ref: #{String(selectedBooking.id).slice(-6)}
                </span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <div>{getStatusBadge(selectedBooking.status)}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedBooking.serviceName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Time:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{selectedBooking.bookingDate} at {formatLocalTime(selectedBooking.startTime)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{selectedBooking.dropAddress ? 'Pickup Location:' : 'Service Address:'}</span>
                <span style={{ color: 'var(--text-main)', textAlign: 'right', maxWidth: '240px' }}>
                  {selectedBooking.address}, {selectedBooking.city} - {selectedBooking.pincode}
                </span>
              </div>

              {selectedBooking.dropAddress && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Drop-off Destination:</span>
                    <span style={{ color: 'var(--text-main)', textAlign: 'right', maxWidth: '240px' }}>
                      {selectedBooking.dropAddress}, {selectedBooking.dropCity} - {selectedBooking.dropPincode}
                    </span>
                  </div>

                  {selectedBooking.distanceKm && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Transit Distance:</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{selectedBooking.distanceKm} KM</span>
                    </div>
                  )}
                </>
              )}

              {/* Provider Assignment Box */}
              <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  {selectedBooking.dropAddress ? 'Assigned Driver & Vehicle' : 'Assigned Service Expert'}
                </span>
                {selectedBooking.providerId ? (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedBooking.providerName}</div>
                    {selectedBooking.vehicleRegistrationNumber && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Vehicle: <strong>{selectedBooking.vehicleRegistrationNumber}</strong> {selectedBooking.vehicleModel ? `(${selectedBooking.vehicleModel})` : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--warning)', fontSize: '0.75rem' }}>
                    {selectedBooking.dropAddress
                      ? 'Matching nearby available driver in your city.'
                      : 'Matching verified service expert in your city.'}
                  </div>
                )}
              </div>

              {selectedBooking.notes && (
                <div style={{ marginTop: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Special Instructions:</span>
                  <p style={{ color: 'var(--text-main)', background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginTop: '0.2rem' }}>
                    "{selectedBooking.notes}"
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              {selectedBooking.paymentStatus === 'PENDING' && selectedBooking.paymentMethod !== 'AFTER_SERVICE' && (
                <button
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    handlePayNow(b);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  Pay ₹{selectedBooking.finalAmount} Now
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModalData && (
        <div className="modal-overlay" onClick={() => setRatingModalData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Rate Service Experience</h3>
              <button onClick={() => setRatingModalData(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              How was your experience with {ratingModalData.providerName || 'the provider'} for {ratingModalData.serviceName}?
            </p>

            <div className="form-group" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', margin: '0.5rem 0 1rem 0' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.5rem',
                      color: ratingValue >= star ? '#D97706' : 'var(--border-strong)',
                      padding: '0.2rem'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Review / Feedback (Optional)</label>
              <textarea
                className="form-control"
                placeholder="Describe the quality of work, punctuality, and professionalism..."
                rows="3"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                onClick={handleRateSubmit}
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                disabled={submittingRating}
              >
                {submittingRating ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button
                onClick={() => setRatingModalData(null)}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Modal for Payment Collection Restriction */}
      <PaymentRestrictionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        booking={paymentRestrictedBooking}
      />
    </div>
  );
}


