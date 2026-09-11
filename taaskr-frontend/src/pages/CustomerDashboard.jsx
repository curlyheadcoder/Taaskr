import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { formatLocalTime } from '../utils/time';
import { sortBookingsByStatusPriority } from '../utils/sorting';
import confetti from 'canvas-confetti';
import Pagination from '../components/Pagination';
import PaymentRestrictionModal from '../components/PaymentRestrictionModal';
import LiveTrackingModal from '../components/LiveTrackingModal';
import { 
  Calendar, Clock, CreditCard, Star, Truck, MapPin, User, 
  ExternalLink, AlertCircle, CheckCircle2, ChevronRight, X, 
  RefreshCw, FileText, Settings, ShieldCheck, Mail, Phone, 
  Check, Save, Lock, Navigation, Compass, MessageSquare, Send, Headphones, Heart
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
  const [trackingBookingId, setTrackingBookingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Profile Editor state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profilePincode, setProfilePincode] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Favorites state
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Address Book state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrLabel, setAddrLabel] = useState('HOME');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('Indore');
  const [addrPincode, setAddrPincode] = useState('452001');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Dispute state
  const [disputeModalBooking, setDisputeModalBooking] = useState(null);
  const [disputeReason, setDisputeReason] = useState('SERVICE_QUALITY');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState('');
  const [myDisputes, setMyDisputes] = useState([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState(null);
  const [disputeFilter, setDisputeFilter] = useState('ALL');
  const [disputeReplyText, setDisputeReplyText] = useState('');
  const [submittingDisputeReply, setSubmittingDisputeReply] = useState(false);
  const disputeChatContainerRef = useRef(null);

  const scrollDisputeChatToBottom = () => {
    if (disputeChatContainerRef.current) {
      disputeChatContainerRef.current.scrollTop = disputeChatContainerRef.current.scrollHeight;
    }
  };

  // Pagination & Modal state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRestrictedBooking, setPaymentRestrictedBooking] = useState(null);

  const [ratingModalData, setRatingModalData] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchMyDisputes = async () => {
    setLoadingDisputes(true);
    try {
      const res = await api.disputes.getMyDisputes();
      const list = Array.isArray(res) ? res : [];
      setMyDisputes(list);
      if (list.length > 0) {
        setSelectedDisputeId((prev) => prev || list[0].id);
      }
    } catch (err) {
      console.error('Failed to load user disputes:', err);
    } finally {
      setLoadingDisputes(false);
    }
  };

  const handleSendDisputeReply = async (e, dispute) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!dispute || !disputeReplyText.trim() || submittingDisputeReply) return;
    const textToSend = disputeReplyText.trim();
    setSubmittingDisputeReply(true);
    setDisputeReplyText('');
    try {
      const updated = await api.disputes.reply(dispute.id, textToSend);
      setMyDisputes(prev => prev.map(d => d.id === updated.id ? updated : d));
      setTimeout(scrollDisputeChatToBottom, 60);
    } catch (err) {
      alert(err.message || 'Failed to send message to support');
    } finally {
      setSubmittingDisputeReply(false);
    }
  };

  // Live Auto-Poll Disputes every 3.5 seconds when viewing disputes tab
  useEffect(() => {
    if (activeTab !== 'disputes') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.disputes.getMyDisputes();
        if (Array.isArray(res)) {
          setMyDisputes(res);
        }
      } catch (err) {
        // silent background poll
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Scroll chat to bottom on dispute selection
  useEffect(() => {
    if (activeTab === 'disputes' && selectedDisputeId) {
      const timer = setTimeout(scrollDisputeChatToBottom, 60);
      return () => clearTimeout(timer);
    }
  }, [activeTab, selectedDisputeId]);


  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.addresses.getAll();
      setAddresses(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to load addresses:', e);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const payload = {
        label: addrLabel,
        streetAddress: addrStreet.trim(),
        city: addrCity.trim(),
        pincode: addrPincode.trim(),
        isDefault: addrIsDefault
      };
      if (editingAddressId) {
        await api.addresses.update(editingAddressId, payload);
      } else {
        await api.addresses.create(payload);
      }
      setShowAddressModal(false);
      setEditingAddressId(null);
      setAddrStreet('');
      fetchAddresses();
    } catch (err) {
      alert(`Failed to save address: ${err.message}`);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to remove this saved address?')) return;
    try {
      await api.addresses.delete(id);
      fetchAddresses();
    } catch (err) {
      alert(`Failed to delete address: ${err.message}`);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.addresses.setDefault(id);
      fetchAddresses();
    } catch (err) {
      alert(`Failed to set default: ${err.message}`);
    }
  };

  const handleCreateDispute = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!disputeModalBooking || !disputeDescription.trim()) return;
    setSubmittingDispute(true);
    try {
      const created = await api.disputes.create(disputeModalBooking.id, disputeReason, disputeDescription.trim());
      setDisputeSuccessMsg('Dispute report submitted. Our support team will investigate and follow up.');
      setTimeout(() => {
        setDisputeSuccessMsg('');
        setDisputeModalBooking(null);
        setDisputeDescription('');
        handleTabChange('disputes');
        if (created && created.id) {
          setSelectedDisputeId(created.id);
        }
      }, 1500);
      fetchMyDisputes();
      fetchMyBookings();
    } catch (err) {
      alert(`Failed to submit dispute: ${err.message}`);
    } finally {
      setSubmittingDispute(false);
    }
  };

  const fetchFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const res = await api.favorites.getAll();
      if (Array.isArray(res)) setFavorites(res);
    } catch (e) {
      console.warn('Failed to load favorites:', e);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleRemoveFavorite = async (serviceId) => {
    try {
      await api.favorites.remove(serviceId);
      setFavorites(prev => prev.filter(s => s.id !== serviceId));
    } catch (e) {
      alert(`Failed to remove favorite: ${e.message}`);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setPasswordSuccessMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 4000);
    } catch (err) {
      setPasswordErrorMsg(err.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const disputeIdParam = searchParams.get('disputeId');
    const bookingIdParam = searchParams.get('bookingId');

    if (tabParam) {
      const normalized = tabParam === 'orders' ? 'bookings' : tabParam;
      if (['bookings', 'disputes', 'profile', 'addresses', 'favorites'].includes(normalized)) {
        setActiveTab(normalized);
        if (normalized === 'disputes') {
          fetchMyDisputes();
        } else if (normalized === 'addresses') {
          fetchAddresses();
        } else if (normalized === 'favorites') {
          fetchFavorites();
        } else if (normalized === 'bookings') {
          fetchMyBookings();
        }
      }
    }

    if (disputeIdParam) {
      const dId = Number(disputeIdParam);
      if (!isNaN(dId)) {
        setSelectedDisputeId(dId);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const bookingIdParam = searchParams.get('bookingId');
    if (bookingIdParam && bookings.length > 0) {
      const bId = Number(bookingIdParam);
      const found = bookings.find(b => b.id === bId);
      if (found) {
        setSelectedBooking(found);
      }
    }
  }, [bookings, searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    if (tab === 'addresses') {
      fetchAddresses();
    }
    if (tab === 'disputes') {
      fetchMyDisputes();
    }
    if (tab === 'favorites') {
      fetchFavorites();
    }
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
    fetchMyDisputes();
    
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
      case 'IN_TRANSIT':
        return <span className="badge badge-inprogress"><span className="badge-dot" /> In-Transit</span>;
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
      await api.reviews.create({
        bookingId: Number(ratingModalData.id),
        rating: Number(ratingValue),
        comment: reviewText.trim()
      });
      setRatingModalData(null);
      fetchMyBookings();
    } catch (err) {
      try {
        await api.bookings.rate(ratingModalData.id, {
          rating: ratingValue,
          review: reviewText
        });
        setRatingModalData(null);
        fetchMyBookings();
      } catch (legacyErr) {
        alert(`Failed to submit review: ${err.message}`);
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="app-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {activeTab === 'profile'
                ? 'Profile Settings'
                : activeTab === 'addresses'
                ? 'Saved Address Book'
                : activeTab === 'disputes'
                ? 'Disputes & Support Tickets'
                : 'My Bookings'}
            </h1>
            <span className="glow-pill" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
              <span className="status-pulse-dot" style={{ backgroundColor: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />
              CONSUMER PORTAL
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
            {activeTab === 'profile'
              ? 'Manage your personal details, verified contacts, and default service locations.'
              : activeTab === 'addresses'
              ? 'Manage your saved delivery, home, and office addresses for fast one-click bookings.'
              : activeTab === 'disputes'
              ? 'Track resolution status, refunds, and support escalations on your booked services.'
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
          {activeTab === 'disputes' && (
            <button onClick={fetchMyDisputes} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          )}
          {activeTab === 'addresses' && (
            <button
              onClick={() => {
                setEditingAddressId(null);
                setAddrLabel('HOME');
                setAddrStreet('');
                setAddrCity(currentUser?.city || 'Indore');
                setAddrPincode(currentUser?.pincode || '452001');
                setAddrIsDefault(addresses.length === 0);
                setShowAddressModal(true);
              }}
              className="btn btn-primary btn-sm"
            >
              Add New Address
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
          onClick={() => handleTabChange('disputes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'disputes' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'disputes' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'disputes' ? 600 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          <AlertCircle size={15} color={myDisputes.length > 0 ? '#EF4444' : undefined} />
          <span>Disputes & Issues</span>
          {myDisputes.length > 0 && (
            <span className="badge badge-cancelled" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
              {myDisputes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('addresses')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'addresses' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'addresses' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'addresses' ? 600 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          <MapPin size={15} />
          <span>Address Book</span>
          <span className="badge badge-completed" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
            {addresses.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('favorites')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'favorites' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'favorites' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'favorites' ? 600 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          <Heart size={15} color="#EF4444" />
          <span>Favorites</span>
          {favorites.length > 0 && (
            <span className="badge badge-assigned" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
              {favorites.length}
            </span>
          )}
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
          background: 'var(--error-bg)',
          border: '1px solid var(--error-border)',
          color: 'var(--error)',
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
            <AlertCircle size={16} color="var(--error)" />
            <span style={{ fontSize: '0.8125rem' }}>
              Your account email (<strong>{currentUser.email}</strong>) is not verified. Both email and mobile phone must be verified to book services.
            </span>
          </div>
          <Link 
            to={`/verify-email?type=email&email=${encodeURIComponent(currentUser.email || '')}`}
            className="btn btn-sm"
            style={{ backgroundColor: '#EF4444', color: '#fff', padding: '0.25rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
          >
            Verify Email
          </Link>
        </div>
      )}

      {currentUser && currentUser.phoneVerified === false && (
        <div style={{
          background: 'var(--error-bg)',
          border: '1px solid var(--error-border)',
          color: 'var(--error)',
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
            <AlertCircle size={16} color="var(--error)" />
            <span style={{ fontSize: '0.8125rem' }}>
              Your contact phone number {currentUser.phone && !currentUser.phone.startsWith('NA-') ? <strong>({currentUser.phone})</strong> : ''} is not verified. Both email and mobile phone must be verified to book services.
            </span>
          </div>
          <Link 
            to={`/verify-phone?type=phone&phone=${encodeURIComponent(currentUser.phone && !currentUser.phone.startsWith('NA-') ? currentUser.phone : '')}`}
            className="btn btn-sm"
            style={{ backgroundColor: '#EF4444', color: '#fff', padding: '0.25rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
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

          {/* Account Password Change Panel */}
          <div className="panel" style={{ marginTop: '1.5rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.25rem' }}>
              <h3 className="panel-title">
                <Lock size={16} color="var(--primary)" />
                <span>Change Account Password</span>
              </h3>
            </div>

            {passwordSuccessMsg && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">New Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.65rem' }}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                <Lock size={15} />
                <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      ) : activeTab === 'favorites' ? (
        /* TAB 5: BOOKMARKED FAVORITES */
        <div className="panel">
          <div className="panel-header" style={{ marginBottom: '1.25rem' }}>
            <h3 className="panel-title">
              <Heart size={18} color="#EF4444" fill="#EF4444" />
              <span>Bookmarked & Favorite Services</span>
            </h3>
            <span className="badge badge-completed">{favorites.length} Saved Services</span>
          </div>

          {loadingFavorites ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
              <div>Loading your bookmarked services...</div>
            </div>
          ) : favorites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Heart size={22} color="#EF4444" />
              </div>
              <h3 className="empty-state-title">No favorite services saved</h3>
              <p className="empty-state-description">Explore our catalog and click the heart icon on any service to bookmark it here for fast 1-click repeat bookings.</p>
              <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>Browse Service Catalog</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {favorites.map(service => (
                <div key={service.id} className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>{service.categoryName || 'Home Service'}</span>
                      <button onClick={() => handleRemoveFavorite(service.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.2rem' }} title="Remove favorite">
                        <Heart size={18} fill="#EF4444" color="#EF4444" />
                      </button>
                    </div>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>{service.name}</h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{service.description}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>₹{service.price}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>({service.estimatedMinutes} mins)</span>
                    </div>
                    <Link to={`/booking?serviceId=${service.id}`} className="btn btn-primary btn-sm">Book Now</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'addresses' ? (
        /* TAB 2: SAVED ADDRESS BOOK */
        <div>
          {loadingAddresses ? (
            <div className="panel" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Loading saved addresses...</span>
            </div>
          ) : addresses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <MapPin size={22} />
              </div>
              <h3 className="empty-state-title">No saved addresses</h3>
              <p className="empty-state-description">Save your home, office, and regular service locations for faster checkout.</p>
              <button
                onClick={() => {
                  setEditingAddressId(null);
                  setAddrLabel('HOME');
                  setAddrStreet('');
                  setAddrCity(currentUser?.city || 'Indore');
                  setAddrPincode(currentUser?.pincode || '452001');
                  setAddrIsDefault(true);
                  setShowAddressModal(true);
                }}
                className="btn btn-primary btn-sm"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {addresses.map((addr) => (
                <div key={addr.id} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-assigned" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                        {addr.label || 'ADDRESS'}
                      </span>
                      {addr.isDefault && (
                        <span className="badge badge-completed" style={{ fontSize: '0.6875rem' }}>
                          Default Address
                        </span>
                      )}
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem', marginBottom: '0.25rem', lineHeight: 1.4 }}>
                      {addr.streetAddress}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {addr.city} {addr.state ? `, ${addr.state}` : ''} - {addr.pincode}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {!addr.isDefault ? (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Default</span>
                    )}

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => {
                          setEditingAddressId(addr.id);
                          setAddrLabel(addr.label || 'HOME');
                          setAddrStreet(addr.streetAddress || '');
                          setAddrCity(addr.city || 'Indore');
                          setAddrPincode(addr.pincode || '452001');
                          setAddrIsDefault(addr.isDefault || false);
                          setShowAddressModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'disputes' ? (
        /* TAB 3: CUSTOMER DISPUTES & ISSUES VIEW */
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Strip with Metrics */}
          <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} color="#EF4444" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Dispute & Escalation Tracker
                </h2>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Track the investigation progress, resolution decisions, and refund settlements for your raised service complaints.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-assigned">
                {myDisputes.length} Total Raised
              </span>
              <span className="badge badge-completed">
                {myDisputes.filter(d => d.status === 'RESOLVED').length} Resolved
              </span>
            </div>
          </div>

          {/* Main 2-Column Split View */}
          {loadingDisputes ? (
            <div className="panel" style={{ height: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: '200px', height: '16px' }} />
            </div>
          ) : myDisputes.length === 0 ? (
            <div className="panel empty-state" style={{ padding: '3.5rem 1.5rem' }}>
              <div className="empty-state-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <CheckCircle2 size={32} color="var(--success)" />
              </div>
              <h3 className="empty-state-title">No disputes or open issues</h3>
              <p className="empty-state-description" style={{ maxWidth: '460px', margin: '0.35rem auto 1.25rem auto' }}>
                You have not reported any issues with your bookings. If you ever experience quality concerns or billing discrepancies, you can raise a dispute directly from your booking details.
              </p>
              <button onClick={() => handleTabChange('bookings')} className="btn btn-primary btn-sm">
                View My Bookings
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.25rem', alignItems: 'flex-start' }}>
              {/* Left Pane: Dispute Ticket Cards */}
              <div className="panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '720px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                    Your Tickets ({myDisputes.length})
                  </span>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {['ALL', 'OPEN', 'RESOLVED'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setDisputeFilter(f)}
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: disputeFilter === f ? 'var(--primary)' : 'var(--border-light)',
                          background: disputeFilter === f ? 'var(--primary-subtle)' : 'transparent',
                          color: disputeFilter === f ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dispute Cards Scrollable List */}
                <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', overflowY: 'auto', maxHeight: '600px', paddingRight: '0.35rem' }}>
                  {myDisputes
                    .filter((d) => {
                      if (disputeFilter === 'OPEN') return d.status === 'OPEN' || d.status === 'UNDER_REVIEW';
                      if (disputeFilter === 'RESOLVED') return d.status === 'RESOLVED' || d.status === 'DISMISSED';
                      return true;
                    })
                    .map((disp) => {
                      const isSelected = (selectedDisputeId || myDisputes[0]?.id) === disp.id;
                      let statusBadgeClass = 'badge-pending';
                      if (disp.status === 'RESOLVED') statusBadgeClass = 'badge-completed';
                      else if (disp.status === 'UNDER_REVIEW') statusBadgeClass = 'badge-assigned';
                      else if (disp.status === 'DISMISSED') statusBadgeClass = 'badge-cancelled';

                      return (
                        <div
                          key={disp.id}
                          onClick={() => setSelectedDisputeId(disp.id)}
                          style={{
                            padding: '0.85rem',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)',
                            background: isSelected ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                            boxShadow: isSelected ? '0 0 12px rgba(37, 99, 235, 0.15)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.4rem' }}>
                            <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.25 }}>
                              Ticket #{String(disp.id).slice(-6)}
                            </strong>
                            <span className={`badge ${statusBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', flexShrink: 0 }}>
                              {disp.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                              {disp.reason?.replace(/_/g, ' ') || 'General Issue'}
                            </span>
                            {disp.bookingId && (
                              <span>• Booking #{disp.bookingCode || disp.bookingId}</span>
                            )}
                          </div>

                          <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            "{disp.description}"
                          </p>

                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            Raised on {disp.createdAt ? new Date(disp.createdAt).toLocaleDateString() : 'Recently'}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Pane: Selected Dispute Detail View */}
              {(() => {
                const activeDisp = myDisputes.find((d) => d.id === (selectedDisputeId || myDisputes[0]?.id));
                if (!activeDisp) {
                  return (
                    <div className="panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Select a dispute ticket from the left pane to view details.
                    </div>
                  );
                }

                let statusBadgeClass = 'badge-pending';
                if (activeDisp.status === 'RESOLVED') statusBadgeClass = 'badge-completed';
                else if (activeDisp.status === 'UNDER_REVIEW') statusBadgeClass = 'badge-assigned';
                else if (activeDisp.status === 'DISMISSED') statusBadgeClass = 'badge-cancelled';

                return (
                  <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                            Dispute Ticket #{String(activeDisp.id).slice(-6)}
                          </h3>
                          <span className={`badge ${statusBadgeClass}`}>
                            {activeDisp.status}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Submitted: {activeDisp.createdAt ? new Date(activeDisp.createdAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>

                      {activeDisp.refundAmount && Number(activeDisp.refundAmount) > 0 && (
                        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Settlement Refund</span>
                          <strong style={{ fontSize: '1rem', color: 'var(--success)' }}>₹{Number(activeDisp.refundAmount).toLocaleString('en-IN')}</strong>
                        </div>
                      )}
                    </div>

                    {/* Booking & Service Context Card */}
                    <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', fontSize: '0.8125rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>BOOKING REFERENCE</span>
                        <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                          #{activeDisp.bookingCode || activeDisp.bookingId}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>ISSUE CATEGORY</span>
                        <strong style={{ color: 'var(--text-main)' }}>
                          {activeDisp.reason?.replace(/_/g, ' ') || 'General Issue'}
                        </strong>
                      </div>
                      {activeDisp.providerName && (
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>SERVICE PROVIDER</span>
                          <strong style={{ color: 'var(--text-main)' }}>{activeDisp.providerName}</strong>
                        </div>
                      )}
                    </div>

                    {/* Live Support Chat & Discussion Thread */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MessageSquare size={16} color="var(--primary)" />
                          <span>Support Conversation & Live Discussion</span>
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Ticket status: <strong>{activeDisp.status}</strong>
                        </span>
                      </div>

                      {/* Chat Messages Timeline */}
                      {(() => {
                        const rawDesc = activeDisp.description || '';
                        const conversationList = [];
                        const parts = rawDesc.split(/\n\n(?=\[(?:Customer|Admin Support)[^\]]*\]:)/);
                        
                        parts.forEach((p, index) => {
                          const trimmed = p.trim();
                          if (!trimmed) return;
                          const match = trimmed.match(/^\[(Customer|Admin Support)(?:\s*-\s*([^\]]+))?\]:\s*([\s\S]*)$/);
                          if (match) {
                            const role = match[1] === 'Admin Support' ? 'ADMIN' : 'USER';
                            const timeStr = match[2] || (activeDisp.createdAt ? new Date(activeDisp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent');
                            conversationList.push({
                              id: `desc-${index}`,
                              senderRole: role,
                              senderName: role === 'ADMIN' ? '🛡️ Support Team' : '👤 You',
                              message: match[3],
                              timestamp: timeStr
                            });
                          } else {
                            conversationList.push({
                              id: `initial-${index}`,
                              senderRole: 'USER',
                              senderName: '👤 You (Initial Filed Complaint)',
                              message: trimmed,
                              timestamp: activeDisp.createdAt ? new Date(activeDisp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'
                            });
                          }
                        });

                        if (activeDisp.resolution) {
                          conversationList.push({
                            id: 'resolution-ruling',
                            senderRole: 'ADMIN',
                            senderName: `🛡️ ${activeDisp.resolvedBy || 'Support Team'} (Official Ruling)`,
                            message: activeDisp.resolution,
                            timestamp: activeDisp.updatedAt ? new Date(activeDisp.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
                            isRuling: true
                          });
                        }

                        return (
                          <div
                            ref={disputeChatContainerRef}
                            className="custom-scrollbar"
                            style={{
                              maxHeight: '340px',
                              overflowY: 'auto',
                              padding: '1rem',
                              backgroundColor: 'var(--bg-subtle)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-light)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.85rem'
                            }}
                          >
                            {conversationList.map((msg, idx) => {
                              const isUser = msg.senderRole === 'USER';
                              const isRuling = msg.isRuling;

                              return (
                                <div
                                  key={msg.id || idx}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isUser ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    <strong style={{ color: isUser ? 'var(--primary)' : (isRuling ? '#10B981' : '#818CF8') }}>
                                      {msg.senderName}
                                    </strong>
                                    <span>• {msg.timestamp}</span>
                                  </div>
                                  <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                    background: isUser 
                                      ? 'linear-gradient(135deg, var(--primary) 0%, #1D4ED8 100%)' 
                                      : (isRuling ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)'),
                                    color: isUser ? '#ffffff' : 'var(--text-main)',
                                    border: isUser ? 'none' : `1px solid ${isRuling ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-light)'}`,
                                    fontSize: '0.84rem',
                                    lineHeight: 1.45,
                                    whiteSpace: 'pre-wrap',
                                    boxShadow: isUser ? '0 2px 8px rgba(37, 99, 235, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)'
                                  }}>
                                    {msg.message}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Customer Reply Input Box */}
                    {activeDisp.status !== 'DISMISSED' && activeDisp.status !== 'RESOLVED' ? (
                      <form onSubmit={(e) => handleSendDisputeReply(e, activeDisp)} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ margin: 0, flex: 1 }}>
                          <textarea
                            className="form-control"
                            rows={2}
                            placeholder="Type a message or response to support team..."
                            value={disputeReplyText}
                            onChange={(e) => setDisputeReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!submittingDisputeReply && disputeReplyText.trim()) {
                                  handleSendDisputeReply(e, activeDisp);
                                }
                              }
                            }}
                            required
                            style={{ resize: 'none' }}
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submittingDisputeReply || !disputeReplyText.trim()}
                          style={{ padding: '0.6rem 1.25rem', height: '100%', minHeight: '52px', fontWeight: 600 }}
                        >
                          <Send size={14} style={{ marginRight: '0.35rem' }} />
                          <span>{submittingDisputeReply ? 'Sending...' : 'Send'}</span>
                        </button>
                      </form>
                    ) : (
                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                          ✓ This ticket has been finalized and closed with official resolution.
                        </span>
                        {activeDisp.refundAmount && Number(activeDisp.refundAmount) > 0 && (
                          <strong style={{ color: 'var(--success)' }}>₹{Number(activeDisp.refundAmount).toLocaleString('en-IN')} Refunded</strong>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        /* TAB 3: MY BOOKINGS LIST VIEW */
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
                      {['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'IN_TRANSIT'].includes(booking.status) && (
                        <button
                          onClick={() => setTrackingBookingId(booking.id)}
                          className="btn btn-primary btn-sm"
                          style={{
                            padding: '0.2rem 0.55rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            backgroundColor: '#10b981',
                            borderColor: '#059669',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                          title="Track Provider Real-time Location on Live Map"
                        >
                          <Navigation size={12} />
                          <span>Track Live</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        Details
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            await api.bookings.downloadInvoice(booking.id, booking.bookingCode);
                          } catch (err) {
                            alert(`Failed to download invoice: ${err.message}`);
                          }
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.25rem 0.45rem', color: 'var(--primary)' }}
                        title="Download PDF Invoice / Receipt"
                      >
                        <FileText size={13} />
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

                      <button
                        onClick={() => {
                          setDisputeModalBooking(booking);
                          setDisputeReason('SERVICE_QUALITY');
                          setDisputeDescription('');
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#EF4444', padding: '0.25rem 0.45rem' }}
                        title="Raise Dispute / Report Issue"
                      >
                        <AlertCircle size={13} />
                      </button>
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

              {['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'IN_TRANSIT'].includes(selectedBooking.status) && (
                <button
                  onClick={() => {
                    const id = selectedBooking.id;
                    setSelectedBooking(null);
                    setTrackingBookingId(id);
                  }}
                  className="btn btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    color: '#ffffff',
                    padding: '0.45rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <Navigation size={13} />
                  <span>Open Live Map & Provider GPS Route</span>
                </button>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedBooking.serviceName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Schedule:</span>
                <span style={{ color: 'var(--text-main)' }}>
                  {selectedBooking.bookingDate} at {formatLocalTime(selectedBooking.startTime)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount & Payment:</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                    ₹{selectedBooking.finalAmount}
                  </div>
                  <span className={`badge ${selectedBooking.paymentStatus === 'PAID' ? 'badge-completed' : 'badge-pending'}`}>
                    {selectedBooking.paymentStatus} ({selectedBooking.paymentMethod === 'AFTER_SERVICE' ? 'Cash on Completion' : 'Online'})
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service Location:</span>
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
                onClick={async () => {
                  try {
                    await api.bookings.downloadInvoice(selectedBooking.id, selectedBooking.bookingCode);
                  } catch (err) {
                    alert(`Failed to download invoice: ${err.message}`);
                  }
                }}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                title="Download Official PDF Invoice"
              >
                <FileText size={13} />
                <span>Invoice PDF</span>
              </button>
              <button
                onClick={() => {
                  const b = selectedBooking;
                  setSelectedBooking(null);
                  setDisputeModalBooking(b);
                  setDisputeReason('SERVICE_QUALITY');
                  setDisputeDescription('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ color: '#EF4444' }}
              >
                Raise Dispute
              </button>
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

      {/* Address Create / Edit Modal */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                {editingAddressId ? 'Edit Address' : 'Add New Saved Address'}
              </h3>
              <button onClick={() => setShowAddressModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress}>
              <div className="form-group">
                <label className="form-label">Address Tag / Label</label>
                <select className="form-control" value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)}>
                  <option value="HOME">Home</option>
                  <option value="WORK">Work / Office</option>
                  <option value="OTHER">Other / Family</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Street Address *</label>
                <input
                  type="text"
                  placeholder="Flat/House No, Building, Landmark, Street"
                  className="form-control"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
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
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Pincode *</label>
                  <input
                    type="text"
                    placeholder="452001"
                    className="form-control"
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                  />
                  <span>Set as default booking address</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={savingAddress || !addrStreet.trim()}>
                  {savingAddress ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
                <button type="button" onClick={() => setShowAddressModal(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModalBooking && (
        <div className="modal-overlay" onClick={() => setDisputeModalBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Raise Dispute / Report Issue
              </h3>
              <button onClick={() => setDisputeModalBooking(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {disputeSuccessMsg ? (
              <div style={{ padding: '1rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                {disputeSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleCreateDispute}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                  Reporting issue for booking #{String(disputeModalBooking.id).slice(-6)} ({disputeModalBooking.serviceName}).
                </p>

                <div className="form-group">
                  <label className="form-label">Dispute Reason *</label>
                  <select className="form-control" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}>
                    <option value="SERVICE_QUALITY">Service Quality Issue</option>
                    <option value="PROVIDER_NO_SHOW">Provider Did Not Show Up</option>
                    <option value="BILLING_ISSUE">Incorrect Billing / Overcharged</option>
                    <option value="DAMAGE_OR_LOSS">Damage or Loss of Goods</option>
                    <option value="UNPROFESSIONAL_BEHAVIOR">Unprofessional Behavior</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Explanation *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Describe what went wrong in detail..."
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!submittingDispute && disputeDescription.trim()) {
                          handleCreateDispute(e);
                        }
                      }
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-danger btn-sm" style={{ flex: 1 }} disabled={submittingDispute || !disputeDescription.trim()}>
                    {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                  <button type="button" onClick={() => setDisputeModalBooking(null)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
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
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!submittingRating) {
                      handleRateSubmit();
                    }
                  }
                }}
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

      {/* Live Provider Tracking Modal */}
      {trackingBookingId && (
        <LiveTrackingModal
          bookingId={trackingBookingId}
          onClose={() => setTrackingBookingId(null)}
        />
      )}
    </div>
  );
}
