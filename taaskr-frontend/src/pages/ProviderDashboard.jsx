import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import Pagination from '../components/Pagination';
import PaymentRestrictionModal from '../components/PaymentRestrictionModal';
import { 
  Truck, MapPin, Package, Navigation, CheckCircle2, ShieldCheck, 
  Clock, Check, X, AlertCircle, Plus, Trash2, Edit2, Phone, Mail, 
  Star, Briefcase, Calendar, CheckSquare, Settings, User, RefreshCw,
  DollarSign, ExternalLink, Power
} from 'lucide-react';

export default function ProviderDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [assignedBookings, setAssignedBookings] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState(null);

  // Pagination states
  const [tasksPage, setTasksPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const itemsPerPage = 5;

  // Payment Restriction Modal state
  const [paymentRestrictedBooking, setPaymentRestrictedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  const loadProviderDashboard = async () => {
    setLoading(true);
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
      setAssignedBookings((bookingsList || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderDashboard();
  }, []);

  const handleAddAvailability = async (e) => {
    e.preventDefault();
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
    if (!window.confirm('Delete this availability slot?')) return;
    try {
      await api.provider.deleteAvailability(slotId);
      setAvailability(prev => prev.filter(s => s.id !== slotId));
      showNotification('Slot deleted.');
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleAcceptJob = async (bookingId) => {
    try {
      await api.provider.acceptBooking(bookingId);
      showNotification('Job accepted.');
      loadProviderDashboard();
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleClaimTask = async (bookingId) => {
    try {
      await api.provider.claimTask(bookingId);
      showNotification('Task claimed successfully. It is now listed under My Bookings.');
      loadProviderDashboard();
    } catch (err) {
      showNotification(`Claim failed: ${err.message}`, 'error');
    }
  };

  const handleRejectJob = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this job?')) return;
    try {
      await api.provider.rejectBooking(bookingId);
      showNotification('Job rejected.');
      loadProviderDashboard();
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await api.provider.updateStatus(bookingId, newStatus);
      showNotification(`Status updated to ${newStatus}.`);
      loadProviderDashboard();
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleCollectCash = async (jobOrId) => {
    const job = typeof jobOrId === 'object' ? jobOrId : assignedBookings.find(b => b.id === jobOrId);
    
    // If work is not completed, pop up the payment restriction modal directly!
    if (job && job.status !== 'COMPLETED') {
      setPaymentRestrictedBooking(job);
      setShowPaymentModal(true);
      return;
    }

    const bookingId = job ? job.id : jobOrId;
    if (!window.confirm('Confirm that you have collected the cash payment from the customer?')) return;
    try {
      await api.provider.markAfterServicePaymentReceived(bookingId);
      showNotification('Cash payment recorded successfully.');
      loadProviderDashboard();
    } catch (err) {
      if (err.message && (err.message.includes('completed') || err.message.includes('done') || err.message.includes('status'))) {
        setPaymentRestrictedBooking(job || { id: bookingId, status: 'IN_PROGRESS' });
        setShowPaymentModal(true);
      } else {
        showNotification(`Failed to record payment: ${err.message}`, 'error');
      }
    }
  };

  const handleCompleteJobFromModal = async (booking) => {
    if (!booking) return;
    try {
      await api.provider.updateStatus(booking.id, 'COMPLETED');
      showNotification(`Job #${String(booking.id).slice(-6)} marked as COMPLETED. You can now collect payment.`);
      loadProviderDashboard();
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
      loadProviderDashboard();
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
    if (!window.confirm('Are you sure you want to remove this vehicle from your fleet?')) return;
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

  return (
    <div className="enterprise-layout animate-fade-in">
      {/* Sidebar Navigation */}
      <aside className="enterprise-sidebar">
        <div style={{ padding: '0.25rem 0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem'
          }}>
            {userProfile?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1 }}>
              {userProfile?.name || 'Partner'}
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span className="badge-dot" style={{ backgroundColor: 'var(--success)' }} /> Active Partner
            </span>
          </div>
        </div>

        <nav className="enterprise-sidebar-nav">
          <button 
            className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <CheckSquare size={16} />
            <span>Task Feed ({availableTasks.length})</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Briefcase size={16} />
            <span>My Bookings ({assignedBookings.length})</span>
          </button>

          {isLogisticsPartner && (
            <button 
              className={`sidebar-item ${activeTab === 'fleet' ? 'active' : ''}`}
              onClick={() => setActiveTab('fleet')}
            >
              <Truck size={16} />
              <span>Fleet Manager ({myVehicles.length})</span>
            </button>
          )}

          <button 
            className={`sidebar-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar size={16} />
            <span>Availability Slots ({availability.length})</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
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
                Your partner account email (<strong>{userProfile.email}</strong>) is not verified. Verify your email to activate job notifications and automated dispatch.
              </span>
            </div>
            <Link 
              to={`/verify-email?type=email&email=${encodeURIComponent(userProfile.email || '')}`}
              className="btn btn-sm"
              style={{ backgroundColor: '#D97706', color: '#fff', padding: '0.25rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
            >
              Verify Email
            </Link>
          </div>
        )}

        {userProfile && userProfile.phoneVerified === false && (
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
                Your partner contact phone (<strong>{userProfile.phone || 'Not configured'}</strong>) is not verified. Verify your phone to receive live SMS job dispatch alerts.
              </span>
            </div>
            <Link 
              to={`/verify-phone?type=phone&phone=${encodeURIComponent(userProfile.phone || '')}`}
              className="btn btn-sm"
              style={{ backgroundColor: '#2563EB', color: '#fff', padding: '0.25rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
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
          <button onClick={loadProviderDashboard} className="btn btn-secondary btn-sm">
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
                              <button onClick={() => handleClaimTask(job.id)} className="btn btn-primary btn-sm" style={{ marginTop: '0.25rem' }}>
                                Claim Job
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
        {/* TAB 2: MY BOOKINGS (Assigned Tasks)                                       */}
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
                  {assignedBookings.slice((bookingsPage - 1) * itemsPerPage, bookingsPage * itemsPerPage).map((job) => (
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
                              <span className={`badge ${job.status === 'COMPLETED' ? 'badge-completed' : job.status === 'IN_PROGRESS' ? 'badge-inprogress' : 'badge-assigned'}`}>
                                {job.status}
                              </span>
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

                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {job.status === 'ASSIGNED' && (
                              <>
                                <button onClick={() => handleAcceptJob(job.id)} className="btn btn-primary btn-sm">
                                  Accept Job
                                </button>
                                <button onClick={() => handleRejectJob(job.id)} className="btn btn-danger btn-sm">
                                  Reject
                                </button>
                              </>
                            )}

                            {job.status === 'ACCEPTED' && (
                              <button onClick={() => handleStatusUpdate(job.id, 'IN_PROGRESS')} className="btn btn-primary btn-sm">
                                Start Service / Transit
                              </button>
                            )}

                            {job.status === 'IN_PROGRESS' && (
                              <button onClick={() => handleStatusUpdate(job.id, 'COMPLETED')} className="btn btn-success btn-sm">
                                Mark as Completed
                              </button>
                            )}

                            {job.paymentStatus === 'PENDING' && job.paymentMethod === 'AFTER_SERVICE' && (
                              <button onClick={() => handleCollectCash(job)} className="btn btn-secondary btn-sm" style={{ color: 'var(--success)' }}>
                                Collect Cash
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
        {/* TAB 3: FLEET MANAGER (Logistics Vehicles)                                 */}
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
        {/* TAB 4: SCHEDULE & AVAILABILITY SLOTS                                      */}
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
        {/* TAB 5: PROFILE & CATEGORY SETTINGS                                        */}
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

      {/* Pop-up Modal for Payment Collection Restriction */}
      <PaymentRestrictionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        booking={paymentRestrictedBooking}
        onCompleteJob={handleCompleteJobFromModal}
      />
    </div>
  );
}

