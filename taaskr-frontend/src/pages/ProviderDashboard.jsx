import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import { sortBookingsByStatusPriority } from '../utils/sorting';
import Pagination from '../components/Pagination';
import PaymentRestrictionModal from '../components/PaymentRestrictionModal';
import CollectCashModal from '../components/CollectCashModal';
import RejectTaskModal from '../components/RejectTaskModal';
import { 
  Truck, MapPin, Package, Navigation, CheckCircle2, ShieldCheck, 
  Clock, Check, X, AlertCircle, Plus, Trash2, Edit2, Phone, Mail, 
  Star, Briefcase, Calendar, CheckSquare, Settings, User, RefreshCw,
  DollarSign, ExternalLink, Power, TrendingUp, BarChart3, PieChart,
  PanelLeftClose, PanelLeftOpen, Wallet, Award, ArrowUpRight
} from 'lucide-react';

export default function ProviderDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [assignedBookings, setAssignedBookings] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState(null);

  // Pagination states (10 items per page)
  const [tasksPage, setTasksPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [inTransitPage, setInTransitPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [earningsPage, setEarningsPage] = useState(1);
  const itemsPerPage = 10;

  // Sidebar Expand / Collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('taaskr_provider_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('taaskr_provider_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Modals state
  const [paymentRestrictedBooking, setPaymentRestrictedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [collectCashBooking, setCollectCashBooking] = useState(null);
  const [showCollectCashModal, setShowCollectCashModal] = useState(false);

  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Active Tab state for desktop/mobile views
  const [activeTab, setActiveTab] = useState('tasks');

  // Categories state
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [savingCategories, setSavingCategories] = useState(false);

  // Profile Editor state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editExp, setEditExp] = useState(0);
  const [editCity, setEditCity] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Vehicle Management state
  const [myVehicles, setMyVehicles] = useState([]);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleType, setVehicleType] = useState('MINI_TRUCK');
  const [fuelType, setFuelType] = useState('DIESEL');
  const [vehicleModel, setVehicleModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleCapacityKg, setVehicleCapacityKg] = useState('1000');
  const [vehicleAvailable, setVehicleAvailable] = useState(true);
  const [savingVehicle, setSavingVehicle] = useState(false);

  // New availability form state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [availDate, setAvailDate] = useState(tomorrowStr);
  const [availStart, setAvailStart] = useState('09:00');
  const [availEnd, setAvailEnd] = useState('11:00');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadProviderDashboard = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setErrorMessage('');
    try {
      const user = await api.provider.getProfile();
      setUserProfile(user);
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditExp(user.experienceYears || 0);
      setEditCity(user.city || '');
      setEditPincode(user.pincode || '');
      setEditBio(user.bio || '');

      const slots = await api.provider.getAvailability();
      setAvailability(slots || []);

      const bookingsList = await api.provider.getBookings();
      setAssignedBookings(sortBookingsByStatusPriority(bookingsList || []));

      const tasksList = await api.provider.getAvailableTasks();
      setAvailableTasks((tasksList || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

      const myCats = await api.provider.getCategories();
      setSelectedCategoryIds((myCats || []).map(c => c.id));

      const allCats = await api.catalog.getCategories();
      setAvailableCategories((allCats || []).filter(c => c.active !== false));

      try {
        const vehicles = await api.vehicle.getMyVehicles();
        if (Array.isArray(vehicles)) {
          setMyVehicles(vehicles);
        }
      } catch (e) {
        try {
          const single = await api.vehicle.getMyVehicle();
          if (single) setMyVehicles([single]);
        } catch (err2) {
          setMyVehicles([]);
        }
      }

    } catch (err) {
      console.error('Failed to load provider dashboard:', err);
      setErrorMessage(err.message || 'Error loading dashboard data from backend.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderDashboard(true);
  }, []);

  const isProviderVerified = Boolean(userProfile?.emailVerified && userProfile?.phoneVerified);

  // Filtered booking collections for tabs
  const inTransitBookings = assignedBookings.filter(b => 
    b.status === 'ACCEPTED' || 
    b.status === 'IN_TRANSIT' || 
    b.status === 'IN_PROGRESS' || 
    (b.status === 'COMPLETED' && b.paymentMethod === 'AFTER_SERVICE' && b.paymentStatus !== 'PAID')
  );
  const completedBookings = assignedBookings.filter(b => 
    b.status === 'COMPLETED' && (b.paymentStatus === 'PAID' || b.paymentMethod !== 'AFTER_SERVICE')
  );

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!isProviderVerified) {
      showNotification('Please verify both your email and phone number before adding availability slots.', 'error');
      return;
    }
    try {
      await api.provider.createAvailability({
        availableDate: availDate,
        startTime: availStart,
        endTime: availEnd
      });
      showNotification('Availability slot added successfully.');
      const slots = await api.provider.getAvailability();
      setAvailability(slots || []);
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteAvailability = async (slotId) => {
    try {
      await api.provider.deleteAvailability(slotId);
      setAvailability(prev => prev.filter(s => s.id !== slotId));
      showNotification('Slot deleted.');
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleAcceptJob = async (bookingId) => {
    if (!isProviderVerified) {
      showNotification('Please verify both your email and phone number before accepting jobs.', 'error');
      return;
    }
    setActionLoadingId(bookingId);
    try {
      await api.provider.acceptBooking(bookingId);
      showNotification('Job accepted and moved to In-Transit.');
      setActiveTab('in-transit');
      await loadProviderDashboard(false);
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClaimTask = async (bookingId) => {
    if (!isProviderVerified) {
      showNotification('Please verify both your email and phone number before claiming tasks.', 'error');
      return;
    }
    setActionLoadingId(bookingId);
    try {
      await api.provider.claimTask(bookingId);
      showNotification('Task claimed successfully. It is now listed under My Bookings.');
      await loadProviderDashboard(false);
    } catch (err) {
      showNotification(`Claim failed: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open custom modal instead of browser confirm
  const handleRejectClick = (job) => {
    setRejectingBooking(job);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (bookingId) => {
    setModalSubmitting(true);
    try {
      await api.provider.rejectBooking(bookingId);
      showNotification('Job rejected and returned to dispatch pool.');
      setShowRejectModal(false);
      setRejectingBooking(null);
      await loadProviderDashboard(false);
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleStartInTransit = async (bookingId) => {
    if (!isProviderVerified) {
      showNotification('Please verify both your email and phone number before updating task status.', 'error');
      return;
    }
    setActionLoadingId(bookingId);
    try {
      await api.provider.updateStatus(bookingId, 'IN_TRANSIT');
      showNotification('Task status updated to In-Transit.');
      await loadProviderDashboard(false);
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkCompleted = async (bookingId) => {
    if (!isProviderVerified) {
      showNotification('Please verify both your email and phone number before updating task status.', 'error');
      return;
    }
    setActionLoadingId(bookingId);
    try {
      await api.provider.updateStatus(bookingId, 'COMPLETED');
      showNotification('Task marked as Completed. You can now collect cash if payment is pending.');
      await loadProviderDashboard(false);
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCollectCashClick = (job) => {
    // If work is not completed, show the payment restriction modal
    if (job && job.status !== 'COMPLETED') {
      setPaymentRestrictedBooking(job);
      setShowPaymentModal(true);
      return;
    }

    // Otherwise open the proper Collect Cash modal
    setCollectCashBooking(job);
    setShowCollectCashModal(true);
  };

  const handleConfirmCollectCash = async (bookingId) => {
    setModalSubmitting(true);
    try {
      await api.provider.markAfterServicePaymentReceived(bookingId);
      showNotification('Cash payment recorded successfully.');
      setShowCollectCashModal(false);
      setCollectCashBooking(null);
      await loadProviderDashboard(false);
    } catch (err) {
      if (err.message && (err.message.includes('completed') || err.message.includes('done') || err.message.includes('status'))) {
        setShowCollectCashModal(false);
        setPaymentRestrictedBooking(collectCashBooking || { id: bookingId, status: 'IN_PROGRESS' });
        setShowPaymentModal(true);
      } else {
        showNotification(`Failed to record payment: ${err.message}`, 'error');
      }
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCompleteJobFromModal = async (booking) => {
    if (!booking) return;
    try {
      await api.provider.updateStatus(booking.id, 'COMPLETED');
      showNotification(`Job #${String(booking.id).slice(-6)} marked as COMPLETED.`);
      await loadProviderDashboard(false);
      
      // Auto open collect cash modal if it is after service cash
      if (booking.paymentMethod === 'AFTER_SERVICE' && booking.paymentStatus !== 'PAID') {
        setCollectCashBooking({ ...booking, status: 'COMPLETED' });
        setShowCollectCashModal(true);
      }
    } catch (err) {
      showNotification(`Failed to complete job: ${err.message}`, 'error');
    }
  };

  const handleToggleCategory = (catId) => {
    setSelectedCategoryIds(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSaveCategories = async (e) => {
    e.preventDefault();
    setSavingCategories(true);
    try {
      await api.provider.updateCategories(selectedCategoryIds);
      showNotification('Service trade categories updated.');
    } catch (err) {
      showNotification(`Failed to update categories: ${err.message}`, 'error');
    } finally {
      setSavingCategories(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.provider.updateProfile({
        name: editName,
        phone: editPhone,
        experienceYears: Number(editExp),
        city: editCity,
        pincode: editPincode,
        bio: editBio
      });
      showNotification('Profile updated successfully.');
      loadProviderDashboard(false);
    } catch (err) {
      showNotification(`Failed to update profile: ${err.message}`, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddNewVehicle = () => {
    setEditingVehicleId(null);
    setVehicleType('MINI_TRUCK');
    setFuelType('DIESEL');
    setVehicleModel('');
    setRegistrationNumber('');
    setVehicleCapacityKg('1000');
    setVehicleAvailable(true);
    setShowVehicleForm(true);
  };

  const handleEditVehicle = (veh) => {
    setEditingVehicleId(veh.id);
    setVehicleType(veh.vehicleType || 'MINI_TRUCK');
    setFuelType(veh.fuelType || 'DIESEL');
    setVehicleModel(veh.modelName || '');
    setRegistrationNumber(veh.registrationNumber || '');
    setVehicleCapacityKg(String(veh.capacityKg || '1000'));
    setVehicleAvailable(veh.available !== false);
    setShowVehicleForm(true);
  };

  const handleToggleVehicleAvailability = async (vehicleId) => {
    try {
      const updated = await api.vehicle.toggleVehicleAvailability(vehicleId);
      setMyVehicles(prev => prev.map(v => v.id === vehicleId ? updated : v));
      showNotification(`Vehicle availability set to ${updated.available ? 'Online' : 'Offline'}.`);
    } catch (err) {
      showNotification(`Failed to toggle vehicle status: ${err.message}`, 'error');
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      await api.vehicle.deleteVehicle(vehicleId);
      setMyVehicles(prev => prev.filter(v => v.id !== vehicleId));
      showNotification('Vehicle removed successfully.');
    } catch (err) {
      showNotification(`Failed to delete vehicle: ${err.message}`, 'error');
    }
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!registrationNumber || !vehicleModel) {
      showNotification('Please fill in vehicle model and registration number', 'error');
      return;
    }
    setSavingVehicle(true);
    try {
      const saved = await api.vehicle.registerVehicle({
        id: editingVehicleId,
        vehicleType,
        fuelType,
        modelName: vehicleModel,
        registrationNumber: registrationNumber.toUpperCase(),
        capacityKg: parseFloat(vehicleCapacityKg) || 1000,
        available: vehicleAvailable
      });
      if (editingVehicleId) {
        setMyVehicles(prev => prev.map(v => v.id === editingVehicleId ? saved : v));
        showNotification('Vehicle details updated successfully.');
      } else {
        setMyVehicles(prev => [...prev, saved]);
        showNotification('New vehicle registered to fleet.');
      }
      setShowVehicleForm(false);
      setEditingVehicleId(null);
    } catch (err) {
      showNotification(`Vehicle registration failed: ${err.message}`, 'error');
    } finally {
      setSavingVehicle(false);
    }
  };

  const openCustomerDirections = (job) => {
    const dest = job.latitude && job.longitude
      ? `${job.latitude},${job.longitude}`
      : encodeURIComponent(`${job.address}, ${job.city} ${job.pincode || ''}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  };

  const openDropDirections = (job) => {
    const dest = job.dropLatitude && job.dropLongitude
      ? `${job.dropLatitude},${job.dropLongitude}`
      : encodeURIComponent(`${job.dropAddress}, ${job.dropCity} ${job.dropPincode || ''}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-completed"><span className="badge-dot" /> COMPLETED</span>;
      case 'IN_TRANSIT':
        return <span className="badge badge-inprogress"><span className="badge-dot" /> IN-TRANSIT</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-inprogress"><span className="badge-dot" /> IN PROGRESS</span>;
      case 'ACCEPTED':
        return <span className="badge badge-accepted"><span className="badge-dot" /> ACCEPTED</span>;
      case 'ASSIGNED':
        return <span className="badge badge-assigned"><span className="badge-dot" /> ASSIGNED</span>;
      case 'CANCELLED':
      case 'REJECTED':
        return <span className="badge badge-cancelled"><span className="badge-dot" /> {status}</span>;
      default:
        return <span className="badge badge-pending">{status}</span>;
    }
  };

  // Reusable booking card component
  const renderJobCard = (job) => {
    const isActionLoading = actionLoadingId === job.id;

    return (
      <div key={job.id} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {job.dropAddress && <Truck size={15} color="var(--primary)" />}
                <h3 style={{ color: 'var(--text-main)', fontSize: '0.975rem', fontWeight: 600, margin: 0 }}>
                  {job.serviceName}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  #{String(job.id).slice(-6)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                {getStatusBadge(job.status)}
                <span className={`badge ${job.paymentStatus === 'PAID' ? 'badge-completed' : 'badge-pending'}`}>
                  {job.paymentStatus === 'PAID' ? 'Payment Completed' : 'Payment Pending'}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1.15rem', fontFeatureSettings: 'tnum' }}>
                ₹{job.finalAmount}
              </span>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {job.paymentMethod === 'AFTER_SERVICE' ? 'Cash on Delivery' : 'Online Gateway'}
              </div>
            </div>
          </div>

          {/* Customer & Location details */}
          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', margin: '0.75rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                Customer: <strong>{job.customerName || 'Customer'}</strong> • <span>{job.customerPhone || 'No Phone'}</span>
              </div>
              <button
                onClick={() => openCustomerDirections(job)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem' }}
              >
                <Navigation size={12} />
                <span>Get Directions</span>
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Address: <span style={{ color: 'var(--text-main)' }}>{job.address}, {job.city} - {job.pincode}</span>
            </div>

            {job.dropAddress && (
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Drop-off: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{job.dropAddress}, {job.dropCity}</strong>
                </div>
                <button
                  onClick={() => openDropDirections(job)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}
                >
                  <Navigation size={12} />
                  <span>Drop Route</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Date: <strong>{job.bookingDate} at {formatLocalTime(job.startTime)}</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* ASSIGNED status actions: Accept or Reject */}
              {job.status === 'ASSIGNED' && (
                <>
                  <button 
                    onClick={() => handleAcceptJob(job.id)} 
                    className="btn btn-primary btn-sm"
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? 'Accepting...' : 'Accept Job'}
                  </button>
                  <button 
                    onClick={() => handleRejectClick(job)} 
                    className="btn btn-danger btn-sm"
                    disabled={isActionLoading}
                  >
                    Reject
                  </button>
                </>
              )}

              {/* ACCEPTED status actions: Start work or Mark Completed */}
              {job.status === 'ACCEPTED' && (
                <>
                  <button 
                    onClick={() => handleStartInTransit(job.id)} 
                    className="btn btn-primary btn-sm"
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? 'Starting...' : 'Start work'}
                  </button>
                  <button 
                    onClick={() => handleMarkCompleted(job.id)} 
                    className="btn btn-success btn-sm"
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? 'Completing...' : 'Mark as Completed'}
                  </button>
                </>
              )}

              {/* IN_TRANSIT or IN_PROGRESS status actions: Mark as Completed */}
              {(job.status === 'IN_TRANSIT' || job.status === 'IN_PROGRESS') && (
                <button 
                  onClick={() => handleMarkCompleted(job.id)} 
                  className="btn btn-success btn-sm"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Completing...' : 'Mark as Completed'}
                </button>
              )}

              {/* COMPLETED status actions: Collect Cash if Cash on Delivery & Pending */}
              {job.status === 'COMPLETED' && job.paymentMethod === 'AFTER_SERVICE' && job.paymentStatus !== 'PAID' && (
                <button 
                  onClick={() => handleCollectCashClick(job)} 
                  className="btn btn-success btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  Collect Cash
                </button>
              )}

              {/* COMPLETED with Paid */}
              {job.status === 'COMPLETED' && job.paymentStatus === 'PAID' && (
                <span className="badge badge-completed" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Check size={12} />
                  <span>Paid</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="enterprise-layout">
        <aside className="enterprise-sidebar">
          <div className="skeleton" style={{ width: '100%', height: '40px', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ width: '100%', height: '30px' }} />
        </aside>
        <main className="enterprise-main">
          <div className="panel" style={{ height: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: '180px', height: '16px' }} />
          </div>
        </main>
      </div>
    );
  }

  const isLogisticsPartner = selectedCategoryIds.some(catId => {
    const cat = availableCategories.find(c => c.id === catId);
    const name = (cat?.name || '').toLowerCase();
    return name.includes('vehicle') || name.includes('transport') || name.includes('logistic') || name.includes('cargo');
  }) || (myVehicles && myVehicles.length > 0);

  const totalEarnings = completedBookings.reduce((sum, b) => sum + (Number(b.finalAmount) || 0), 0);
  const cashCollected = completedBookings.filter(b => b.paymentMethod === 'AFTER_SERVICE').reduce((sum, b) => sum + (Number(b.finalAmount) || 0), 0);
  const onlineSettled = completedBookings.filter(b => b.paymentMethod !== 'AFTER_SERVICE').reduce((sum, b) => sum + (Number(b.finalAmount) || 0), 0);
  const avgPerJob = completedBookings.length > 0 ? Math.round(totalEarnings / completedBookings.length) : 0;
  
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const currentMonthEarnings = completedBookings
    .filter(b => (b.bookingDate || '').startsWith(currentYearMonth) || (b.updatedAt || '').startsWith(currentYearMonth))
    .reduce((sum, b) => sum + (Number(b.finalAmount) || 0), 0);

  const completionRate = assignedBookings.length > 0 ? Math.round((completedBookings.length / assignedBookings.length) * 100) : 100;

  const serviceEarningsMap = {};
  completedBookings.forEach(b => {
    const name = b.serviceName || 'Service';
    if (!serviceEarningsMap[name]) {
      serviceEarningsMap[name] = { name, count: 0, amount: 0 };
    }
    serviceEarningsMap[name].count += 1;
    serviceEarningsMap[name].amount += (Number(b.finalAmount) || 0);
  });
  const serviceEarningsList = Object.values(serviceEarningsMap).sort((a, b) => b.amount - a.amount);

  const dateEarningsMap = {};
  completedBookings.forEach(b => {
    const d = b.bookingDate || (b.updatedAt ? b.updatedAt.slice(0, 10) : 'Recent');
    dateEarningsMap[d] = (dateEarningsMap[d] || 0) + (Number(b.finalAmount) || 0);
  });
  const chartData = Object.entries(dateEarningsMap)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
  const maxChartAmount = Math.max(1, ...chartData.map(c => c.amount));

  return (
    <div className="enterprise-layout animate-fade-in">
      {/* Sidebar Navigation */}
      <aside className={`enterprise-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div style={{
          padding: '0.25rem 0.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          gap: '0.5rem'
        }}>
          {!isSidebarCollapsed && (
            <div className="sidebar-user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem',
                flexShrink: 0
              }}>
                {userProfile?.name?.charAt(0) || 'P'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {userProfile?.name || 'Partner'}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                  <span className="badge-dot" style={{ backgroundColor: 'var(--success)' }} /> Active Partner
                </span>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="btn btn-ghost btn-sm"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              padding: '0.35rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              minWidth: '30px',
              height: '30px'
            }}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className="enterprise-sidebar-nav">
          <button 
            className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
            title="Task Feed"
          >
            <CheckSquare size={16} />
            <span>Task Feed ({availableTasks.length})</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
            title="My Bookings"
          >
            <Briefcase size={16} />
            <span>My Bookings ({assignedBookings.length})</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'in-transit' ? 'active' : ''}`}
            onClick={() => setActiveTab('in-transit')}
            title="In-Transit"
          >
            <Navigation size={16} />
            <span>In-Transit ({inTransitBookings.length})</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
            title="Completed"
          >
            <CheckCircle2 size={16} />
            <span>Completed ({completedBookings.length})</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'earnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('earnings')}
            title="Earnings & Analytics"
          >
            <TrendingUp size={16} />
            <span>Earnings & Analytics</span>
          </button>

          {isLogisticsPartner && (
            <button 
              className={`sidebar-item ${activeTab === 'fleet' ? 'active' : ''}`}
              onClick={() => setActiveTab('fleet')}
              title="Fleet Manager"
            >
              <Truck size={16} />
              <span>Fleet Manager ({myVehicles.length})</span>
            </button>
          )}

          <button 
            className={`sidebar-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
            title="Availability Slots"
          >
            <Calendar size={16} />
            <span>Availability Slots ({availability.length})</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            title="Profile & Services"
          >
            <Settings size={16} />
            <span>Profile & Services</span>
          </button>
        </nav>
      </aside>

      {/* Main Operations Work Area */}
      <main className="enterprise-main">
        {/* Toast Notification */}
        {notification && (
          <div style={{
            position: 'fixed', top: '4.5rem', right: '1.5rem', zIndex: 100,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)',
            backgroundColor: notification.type === 'error' ? 'var(--error-bg)' : 'var(--success-bg)',
            color: notification.type === 'error' ? 'var(--error)' : 'var(--success)',
            border: `1px solid ${notification.type === 'error' ? 'var(--error-border)' : 'var(--success-border)'}`,
            boxShadow: 'var(--shadow-md)',
            fontSize: '0.8125rem',
            fontWeight: 500
          }}>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div style={{
            backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.8125rem'
          }}>
            {errorMessage}
          </div>
        )}

        {userProfile && userProfile.emailVerified === false && (
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
                Your partner account email (<strong>{userProfile.email}</strong>) is not verified. Both email and mobile phone must be verified to claim and work on tasks.
              </span>
            </div>
            <Link 
              to={`/verify-email?type=email&email=${encodeURIComponent(userProfile.email || '')}`}
              className="btn btn-sm"
              style={{ backgroundColor: '#EF4444', color: '#fff', padding: '0.25rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
            >
              Verify Email
            </Link>
          </div>
        )}

        {userProfile && userProfile.phoneVerified === false && (
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
                Your partner contact phone (<strong>{userProfile.phone || 'Not configured'}</strong>) is not verified. Both email and mobile phone must be verified to claim and work on tasks.
              </span>
            </div>
            <Link 
              to={`/verify-phone?type=phone&phone=${encodeURIComponent(userProfile.phone || '')}`}
              className="btn btn-sm"
              style={{ backgroundColor: '#EF4444', color: '#fff', padding: '0.25rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
            >
              Verify Phone
            </Link>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="enterprise-header">
          <div>
            <h1>Partner Console</h1>
            <p>Live job dispatch, fleet status, and schedule management.</p>
          </div>
          <button onClick={() => loadProviderDashboard(false)} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card-modern">
            <div className="stat-icon-container">
              <Star size={18} color="#D97706" />
            </div>
            <div className="stat-details">
              <h3>Rating</h3>
              <p>{userProfile?.rating !== undefined ? userProfile.rating.toFixed(1) : '0.0'}</p>
            </div>
          </div>

          <div className="stat-card-modern">
            <div className="stat-icon-container">
              <Briefcase size={18} color="var(--primary)" />
            </div>
            <div className="stat-details">
              <h3>Total Jobs</h3>
              <p>{userProfile?.totalJobs || 0}</p>
            </div>
          </div>

          <div className="stat-card-modern">
            <div className="stat-icon-container">
              <Truck size={18} color="var(--primary)" />
            </div>
            <div className="stat-details">
              <h3>Fleet Units</h3>
              <p>{myVehicles.length}</p>
            </div>
          </div>

          <div className="stat-card-modern">
            <div className="stat-icon-container">
              <Calendar size={18} color="var(--success)" />
            </div>
            <div className="stat-details">
              <h3>Active Slots</h3>
              <p>{availability.length}</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: TASK FEED (Available Tasks)                                        */}
        {/* ========================================================================= */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Available Tasks in Your Area
              </h2>
              <span className="badge badge-pending">{availableTasks.length} Available</span>
            </div>

            {availableTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CheckSquare size={20} />
                </div>
                <h3 className="empty-state-title">No pending dispatch tasks</h3>
                <p className="empty-state-description">
                  There are no unassigned customer requests matching your service area right now.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
                  {availableTasks.slice((tasksPage - 1) * itemsPerPage, tasksPage * itemsPerPage).map((job) => (
                    <div key={job.id} className="panel" style={{ borderLeft: '3px solid var(--primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {job.dropAddress && <Truck size={15} color="var(--primary)" />}
                              <h3 style={{ color: 'var(--text-main)', fontSize: '0.975rem', fontWeight: 600, margin: 0 }}>
                                {job.serviceName}
                              </h3>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                              <MapPin size={12} /> {job.city} - {job.pincode}
                            </span>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1.15rem', fontFeatureSettings: 'tnum' }}>
                              ₹{job.finalAmount}
                            </span>
                            <div>
                              <button 
                                onClick={() => handleClaimTask(job.id)} 
                                className="btn btn-primary btn-sm" 
                                style={{ marginTop: '0.25rem' }}
                                disabled={actionLoadingId === job.id}
                              >
                                {actionLoadingId === job.id ? 'Claiming...' : 'Claim Job'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Freight specifications if vehicle job */}
                        {job.dropAddress && (
                          <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', margin: '0.5rem 0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                              <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', fontSize: '0.6875rem' }}>Pickup Point</span>
                                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{job.address}, {job.city}</span>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', fontSize: '0.6875rem' }}>Drop-off Point</span>
                                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{job.dropAddress}, {job.dropCity}</span>
                              </div>
                            </div>
                            {job.packageWeightKg && (
                              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                Payload: <strong>{job.packageWeightKg} KG</strong> {job.distanceKm ? `• Est. Distance: ${job.distanceKm} KM` : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Scheduled: <strong>{job.bookingDate} at {formatLocalTime(job.startTime)}</strong></span>
                        {job.notes && <span style={{ fontStyle: 'italic' }}>"{job.notes}"</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  currentPage={tasksPage}
                  totalItems={availableTasks.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setTasksPage}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY BOOKINGS (All Assigned Tasks)                                   */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Assigned Bookings & Active Trips
              </h2>
              <span className="badge badge-assigned">{assignedBookings.length} Total</span>
            </div>

            {assignedBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Briefcase size={20} />
                </div>
                <h3 className="empty-state-title">No assigned bookings</h3>
                <p className="empty-state-description">
                  You do not have any active jobs assigned yet. Claim available jobs from the Task Feed.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
                  {assignedBookings.slice((bookingsPage - 1) * itemsPerPage, bookingsPage * itemsPerPage).map(renderJobCard)}
                </div>
                <Pagination
                  currentPage={bookingsPage}
                  totalItems={assignedBookings.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setBookingsPage}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: IN-TRANSIT TASKS                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'in-transit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                  In-Transit & Ongoing Jobs
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Tasks currently in progress or on the road. Mark them as completed when work is finished.
                </p>
              </div>
              <span className="badge badge-inprogress">{inTransitBookings.length} Active</span>
            </div>

            {inTransitBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Navigation size={20} />
                </div>
                <h3 className="empty-state-title">No tasks in-transit</h3>
                <p className="empty-state-description">
                  You currently have no tasks marked as In-Transit. Accept an assigned task and click "In-Transit" to begin.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
                  {inTransitBookings.slice((inTransitPage - 1) * itemsPerPage, inTransitPage * itemsPerPage).map(renderJobCard)}
                </div>
                <Pagination
                  currentPage={inTransitPage}
                  totalItems={inTransitBookings.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setInTransitPage}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: COMPLETED TASKS                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                  Completed Bookings & Trip History
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Review your completed jobs and collect outstanding cash payments.
                </p>
              </div>
              <span className="badge badge-completed">{completedBookings.length} Completed</span>
            </div>

            {completedBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="empty-state-title">No completed bookings yet</h3>
                <p className="empty-state-description">
                  Tasks you complete will be archived here for record keeping and cash collection.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
                  {completedBookings.slice((completedPage - 1) * itemsPerPage, completedPage * itemsPerPage).map(renderJobCard)}
                </div>
                <Pagination
                  currentPage={completedPage}
                  totalItems={completedBookings.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCompletedPage}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: EARNINGS & ANALYTICS                                               */}
        {/* ========================================================================= */}
        {activeTab === 'earnings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} color="var(--primary)" />
                  <span>Partner Earnings & Performance Insights</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Track revenue generated from completed service bookings, payment collection methods, and payout settlements.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-completed" style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}>
                  <span className="badge-dot" style={{ backgroundColor: 'var(--success)' }} /> All Payouts Active & Settled
                </span>
              </div>
            </div>

            {/* Earnings Stat Cards */}
            <div className="grid-cols-4" style={{ gap: '1rem' }}>
              {/* Card 1: Total Lifetime Earnings */}
              <div className="stat-card-modern">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="stat-label">Lifetime Earnings</span>
                    <div className="stat-value" style={{ color: 'var(--success)', fontFeatureSettings: 'tnum' }}>
                      ₹{totalEarnings.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)' }}>
                    <Wallet size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ArrowUpRight size={13} color="var(--success)" />
                  <span>Across {completedBookings.length} completed tasks</span>
                </div>
              </div>

              {/* Card 2: This Month's Earnings */}
              <div className="stat-card-modern">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="stat-label">This Month</span>
                    <div className="stat-value" style={{ color: 'var(--primary)', fontFeatureSettings: 'tnum' }}>
                      ₹{currentMonthEarnings.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                    <Calendar size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Current billing period revenue
                </div>
              </div>

              {/* Card 3: Cash Collected (COD) */}
              <div className="stat-card-modern">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="stat-label">Cash Collected</span>
                    <div className="stat-value" style={{ fontFeatureSettings: 'tnum' }}>
                      ₹{cashCollected.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)' }}>
                    <DollarSign size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Direct after-service customer cash
                </div>
              </div>

              {/* Card 4: Avg. Earnings Per Job */}
              <div className="stat-card-modern">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="stat-label">Avg. Per Job</span>
                    <div className="stat-value" style={{ fontFeatureSettings: 'tnum' }}>
                      ₹{avgPerJob.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#818CF8' }}>
                    <Award size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Avg. revenue per service ticket
                </div>
              </div>
            </div>

            {/* Analytics Grid: Service Breakdown & Revenue Timeline */}
            <div className="grid-cols-2" style={{ gap: '1.5rem', alignItems: 'stretch' }}>
              {/* Left Column: Earnings by Service Breakdown */}
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="panel-header" style={{ marginBottom: '1rem' }}>
                    <h3 className="panel-title">
                      <PieChart size={16} color="var(--primary)" />
                      <span>Revenue by Service Category</span>
                    </h3>
                    <span className="badge badge-assigned">{serviceEarningsList.length} Services</span>
                  </div>

                  {serviceEarningsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      No completed services yet to generate breakdown analytics.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {serviceEarningsList.slice(0, 5).map((srv, idx) => {
                        const pct = totalEarnings > 0 ? Math.round((srv.amount / totalEarnings) * 100) : 0;
                        const colors = ['#38BDF8', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                        const barColor = colors[idx % colors.length];

                        return (
                          <div key={srv.name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {srv.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({srv.count} {srv.count === 1 ? 'task' : 'tasks'})</span>
                              </span>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                                ₹{srv.amount.toLocaleString('en-IN')} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>({pct}%)</span>
                              </span>
                            </div>
                            <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  backgroundColor: barColor,
                                  borderRadius: '999px',
                                  transition: 'width 0.4s ease'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Online Payments: <strong>₹{onlineSettled.toLocaleString('en-IN')}</strong></span>
                  <span>Cash Collections: <strong>₹{cashCollected.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              {/* Right Column: Performance & Settlement Metrics */}
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="panel-header" style={{ marginBottom: '1rem' }}>
                    <h3 className="panel-title">
                      <BarChart3 size={16} color="var(--success)" />
                      <span>Daily Revenue Activity</span>
                    </h3>
                    <span className="badge badge-completed">Recent Daily Volume</span>
                  </div>

                  {chartData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      No recent revenue timeline data recorded.
                    </div>
                  ) : (
                    <div>
                      {/* CSS Bar Chart */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '140px', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                        {chartData.map((d) => {
                          const heightPct = Math.max(12, Math.round((d.amount / maxChartAmount) * 100));
                          return (
                            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', height: '100%', justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', fontFeatureSettings: 'tnum' }}>
                                ₹{d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : d.amount}
                              </span>
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: '36px',
                                  height: `${heightPct}%`,
                                  backgroundColor: 'var(--primary)',
                                  borderRadius: '4px 4px 0 0',
                                  background: 'linear-gradient(180deg, var(--primary) 0%, rgba(56, 189, 248, 0.4) 100%)',
                                  transition: 'height 0.3s ease'
                                }}
                                title={`${d.date}: ₹${d.amount}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {chartData.map(d => (
                          <span key={d.date} style={{ flex: 1, textAlign: 'center' }}>
                            {d.date.slice(5)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Job Completion Rate</span>
                    <strong style={{ color: 'var(--success)', fontSize: '0.9375rem' }}>{completionRate}% On-Time</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Partner Tier Status</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '0.9375rem' }}>Verified Professional (4.9★)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Settlements & Transaction History Log */}
            <div className="panel">
              <div className="panel-header" style={{ marginBottom: '1rem' }}>
                <h3 className="panel-title">
                  <Wallet size={16} color="var(--primary)" />
                  <span>Settled Bookings & Completed Payout Records</span>
                </h3>
                <span className="badge badge-completed">{completedBookings.length} Total Settlements</span>
              </div>

              {completedBookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="empty-state-title">No completed earnings history</h3>
                  <p className="empty-state-description">
                    When you accept, perform, and complete service jobs, your earnings statements will appear here.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '0.65rem 0.5rem' }}>Task #</th>
                          <th style={{ padding: '0.65rem 0.5rem' }}>Service Performed</th>
                          <th style={{ padding: '0.65rem 0.5rem' }}>Customer</th>
                          <th style={{ padding: '0.65rem 0.5rem' }}>Date & Schedule</th>
                          <th style={{ padding: '0.65rem 0.5rem' }}>Payment Mode</th>
                          <th style={{ padding: '0.65rem 0.5rem' }}>Status</th>
                          <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedBookings.slice((earningsPage - 1) * itemsPerPage, earningsPage * itemsPerPage).map((job) => (
                          <tr key={job.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s' }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                              #{String(job.id).slice(-6)}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {job.serviceName}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                              {job.customerName || 'Customer'}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              {job.bookingDate} • {formatLocalTime(job.startTime)}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span className="badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '0.6875rem' }}>
                                {job.paymentMethod === 'AFTER_SERVICE' ? 'Cash on Delivery' : 'Online Gateway'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span className="badge badge-completed">
                                <span className="badge-dot" /> Settled
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)', fontSize: '0.9375rem', fontFeatureSettings: 'tnum' }}>
                              ₹{job.finalAmount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={earningsPage}
                    totalItems={completedBookings.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setEarningsPage}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: FLEET MANAGER (Logistics Vehicles)                                 */}
        {/* ========================================================================= */}
        {activeTab === 'fleet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Vehicle Fleet Management
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Register and toggle the active status of your commercial logistics vehicles.</p>
              </div>
              <button onClick={handleAddNewVehicle} className="btn btn-primary btn-sm">
                <Plus size={14} />
                <span>Add Vehicle</span>
              </button>
            </div>

            {/* Vehicle Registration / Edit Form Modal */}
            {showVehicleForm && (
              <div className="modal-overlay" onClick={() => setShowVehicleForm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
                  <div className="modal-header">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                      {editingVehicleId ? 'Edit Vehicle Details' : 'Register New Vehicle'}
                    </h3>
                    <button onClick={() => setShowVehicleForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveVehicle}>
                    <div className="form-group">
                      <label className="form-label">Vehicle Category</label>
                      <select className="form-control" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                        <option value="MINI_TRUCK">Mini Truck (e.g. Tata Ace, Bolero)</option>
                        <option value="THREE_WHEELER_CARGO">3 Wheeler Cargo (e.g. Ape, Alfa)</option>
                        <option value="TWO_WHEELER_COURIER">2 Wheeler Cargo / Courier</option>
                        <option value="PICKUP_LARGE">Large Commercial Truck</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Model Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Tata Ace Gold"
                          className="form-control"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">License Plate *</label>
                        <input
                          type="text"
                          placeholder="MP 09 AB 1234"
                          className="form-control"
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Payload Capacity (KG)</label>
                        <input
                          type="number"
                          placeholder="1000"
                          className="form-control"
                          value={vehicleCapacityKg}
                          onChange={(e) => setVehicleCapacityKg(e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Fuel Type</label>
                        <select className="form-control" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                          <option value="DIESEL">Diesel</option>
                          <option value="CNG">CNG</option>
                          <option value="ELECTRIC">Electric (EV)</option>
                          <option value="PETROL">Petrol</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '0.75rem' }}>
                      <label className="form-checkbox-label">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={vehicleAvailable}
                          onChange={(e) => setVehicleAvailable(e.target.checked)}
                        />
                        <span>Available for live trip dispatch</span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={savingVehicle}>
                        {savingVehicle ? 'Saving...' : editingVehicleId ? 'Update Vehicle' : 'Register Vehicle'}
                      </button>
                      <button type="button" onClick={() => setShowVehicleForm(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {myVehicles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Truck size={20} />
                </div>
                <h3 className="empty-state-title">No vehicles in fleet</h3>
                <p className="empty-state-description">Add your commercial vehicle to start receiving freight and transport orders.</p>
                <button onClick={handleAddNewVehicle} className="btn btn-primary btn-sm">Add First Vehicle</button>
              </div>
            ) : (
              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                {myVehicles.map((veh) => (
                  <div key={veh.id} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Truck size={16} color="var(--primary)" />
                            <strong style={{ fontSize: '0.9375rem', color: 'var(--text-main)' }}>{veh.modelName}</strong>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {veh.registrationNumber}
                          </span>
                        </div>
                        <span className={`badge ${veh.available !== false ? 'badge-completed' : 'badge-cancelled'}`}>
                          {veh.available !== false ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                        <span>Capacity: <strong style={{ color: 'var(--text-main)' }}>{veh.capacityKg || 1000} KG</strong></span>
                        <span>Fuel: <strong style={{ color: 'var(--text-main)' }}>{veh.fuelType || 'DIESEL'}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => handleToggleVehicleAvailability(veh.id)}
                        className={`btn btn-sm ${veh.available !== false ? 'btn-secondary' : 'btn-success'}`}
                        style={{ padding: '0.2rem 0.5rem' }}
                      >
                        <Power size={12} />
                        <span>{veh.available !== false ? 'Go Offline' : 'Go Online'}</span>
                      </button>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => handleEditVehicle(veh)} className="btn btn-ghost btn-sm" title="Edit Vehicle">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDeleteVehicle(veh.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} title="Delete Vehicle">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SCHEDULE & AVAILABILITY SLOTS                                      */}
        {/* ========================================================================= */}
        {activeTab === 'schedule' && (
          <div className="grid-cols-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
            {/* Create Slot Form */}
            <form onSubmit={handleAddAvailability} className="panel">
              <div className="panel-header">
                <h2 className="panel-title">
                  <Calendar size={16} color="var(--primary)" />
                  <span>Add Availability Slot</span>
                </h2>
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  min={tomorrowStr}
                  value={availDate}
                  onChange={(e) => setAvailDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={availStart}
                    onChange={(e) => setAvailStart(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={availEnd}
                    onChange={(e) => setAvailEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                <Plus size={14} />
                <span>Publish Slot</span>
              </button>
            </form>

            {/* Existing Slots List */}
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">
                  <Clock size={16} color="var(--primary)" />
                  <span>Active Scheduled Slots</span>
                </h2>
                <span className="badge badge-assigned">{availability.length} Slots</span>
              </div>

              {availability.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No availability slots published yet.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                  {availability.map((slot) => (
                    <div key={slot.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', fontSize: '0.8125rem'
                    }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>{slot.availableDate}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                          {formatLocalTime(slot.startTime)} - {formatLocalTime(slot.endTime)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteAvailability(slot.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--error)', padding: '0.2rem' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: PROFILE & CATEGORY SETTINGS                                        */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="grid-cols-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
            {/* Profile Info Form */}
            <form onSubmit={handleUpdateProfile} className="panel">
              <div className="panel-header">
                <h2 className="panel-title">
                  <User size={16} color="var(--primary)" />
                  <span>Partner Profile Details</span>
                </h2>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Experience (Years)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editExp}
                    onChange={(e) => setEditExp(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bio / Background</label>
                <textarea
                  rows="3"
                  className="form-control"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>

            {/* Service Categories Selection */}
            <form onSubmit={handleSaveCategories} className="panel">
              <div className="panel-header">
                <h2 className="panel-title">
                  <Briefcase size={16} color="var(--primary)" />
                  <span>Assigned Service Categories</span>
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                Select the service domains in which you can receive on-demand orders:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1rem' }}>
                {availableCategories.map((cat) => {
                  const isChecked = selectedCategoryIds.includes(cat.id);
                  return (
                    <label key={cat.id} className="form-checkbox-label" style={{
                      padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)',
                      background: isChecked ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                      border: '1px solid', borderColor: isChecked ? 'var(--primary)' : 'var(--border-light)'
                    }}>
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCategory(cat.id)}
                      />
                      <span style={{ fontSize: '0.8125rem', fontWeight: isChecked ? 600 : 400 }}>{cat.name}</span>
                    </label>
                  );
                })}
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={savingCategories}>
                {savingCategories ? 'Updating...' : 'Update Service Categories'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Pop-up Modal for Payment Collection Restriction (When attempting before work completion) */}
      <PaymentRestrictionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        booking={paymentRestrictedBooking}
        onCompleteJob={handleCompleteJobFromModal}
      />

      {/* Pop-up Modal for Collect Cash Confirmation */}
      <CollectCashModal
        isOpen={showCollectCashModal}
        onClose={() => setShowCollectCashModal(false)}
        booking={collectCashBooking}
        onConfirm={handleConfirmCollectCash}
        loading={modalSubmitting}
      />

      {/* Pop-up Modal for Reject Task Confirmation */}
      <RejectTaskModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        booking={rejectingBooking}
        onConfirm={handleConfirmReject}
        loading={modalSubmitting}
      />
    </div>
  );
}
