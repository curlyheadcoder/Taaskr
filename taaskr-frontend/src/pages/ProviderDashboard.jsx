import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import { Truck, MapPin, Package, Navigation, CheckCircle2, ShieldCheck, Clock, Check, X, AlertCircle } from 'lucide-react';

export default function ProviderDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [assignedBookings, setAssignedBookings] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState(null);

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
  const [myVehicle, setMyVehicle] = useState(null);
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
  };

  const loadProviderDashboard = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Get current provider details
      const user = await api.provider.getProfile();
      setUserProfile(user);
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditExp(user.experienceYears || 0);
      setEditCity(user.city || '');
      setEditPincode(user.pincode || '');
      setEditBio(user.bio || '');

      // 2. Load availability slots
      const slots = await api.provider.getAvailability();
      setAvailability(slots);

      // 3. Load assigned bookings
      const bookingsList = await api.provider.getBookings();
      setAssignedBookings(bookingsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

      // 4. Load available tasks
      const tasksList = await api.provider.getAvailableTasks();
      setAvailableTasks(tasksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

      // 5. Load selected categories
      const myCats = await api.provider.getCategories();
      setSelectedCategoryIds(myCats.map(c => c.id));

      // 6. Load all active categories
      const allCats = await api.catalog.getCategories();
      setAvailableCategories(allCats.filter(c => c.active));

      // 7. Load vehicle profile if any
      try {
        const vehicle = await api.vehicle.getMyVehicle();
        if (vehicle) {
          setMyVehicle(vehicle);
          setVehicleType(vehicle.vehicleType || 'MINI_TRUCK');
          setFuelType(vehicle.fuelType || 'DIESEL');
          setVehicleModel(vehicle.modelName || '');
          setRegistrationNumber(vehicle.registrationNumber || '');
          setVehicleCapacityKg(vehicle.capacityKg || '1000');
          setVehicleAvailable(vehicle.available !== false);
        }
      } catch (e) {
        // No vehicle registered yet
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
      showNotification('Availability slot added.');
      const slots = await api.provider.getAvailability();
      setAvailability(slots);
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
      showNotification('Task claimed successfully! It is now in your assigned bookings.');
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

  const handleCollectCash = async (bookingId) => {
    if (!window.confirm('Confirm that you have collected cash payment from the customer?')) return;
    try {
      await api.provider.markAfterServicePaymentReceived(bookingId);
      showNotification('Cash payment recorded successfully.');
      loadProviderDashboard();
    } catch (err) {
      showNotification(`Failed to record payment: ${err.message}`, 'error');
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

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!registrationNumber || !vehicleModel) {
      showNotification('Please fill in vehicle model and registration number', 'error');
      return;
    }
    setSavingVehicle(true);
    try {
      const saved = await api.vehicle.registerVehicle({
        vehicleType,
        fuelType,
        modelName: vehicleModel,
        registrationNumber: registrationNumber.toUpperCase(),
        capacityKg: parseFloat(vehicleCapacityKg) || 1000,
        available: vehicleAvailable
      });
      setMyVehicle(saved);
      showNotification('🚚 Vehicle details registered successfully!');
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
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
        <div style={{
          display: 'inline-block',
          width: '32px',
          height: '32px',
          border: '3px solid var(--border-light)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '1.25rem', fontWeight: 500 }}>Loading Partner Dashboard...</p>
      </div>
    );
  }

  const isLogisticsPartner = selectedCategoryIds.some(catId => {
    const cat = availableCategories.find(c => c.id === catId);
    const name = (cat?.name || '').toLowerCase();
    return name.includes('vehicle') || name.includes('transport') || name.includes('logistic');
  }) || Boolean(myVehicle?.id);

  return (
    <div className="enterprise-layout animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Sidebar Navigation */}
      <aside className="enterprise-sidebar">
        <div style={{ padding: '0.5rem 0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
            background: 'var(--primary)', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem'
          }}>
            {userProfile?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>{userProfile?.name || 'Partner'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 600 }}>● Active Partner</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <button className="sidebar-item active">
            <span style={{ fontSize: '1.1rem' }}>📊</span> Overview
          </button>
          <button className="sidebar-item" onClick={() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span> Available Tasks
          </button>
          <button className="sidebar-item" onClick={() => document.getElementById('assigned-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <span style={{ fontSize: '1.1rem' }}>📋</span> My Bookings
          </button>
          {isLogisticsPartner && (
            <button className="sidebar-item" onClick={() => document.getElementById('vehicle-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <span style={{ fontSize: '1.1rem' }}>🚚</span> My Vehicle
            </button>
          )}
          <button className="sidebar-item" onClick={() => document.getElementById('schedule-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <span style={{ fontSize: '1.1rem' }}>🕒</span> Schedule Slots
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="enterprise-main">
        {notification && (
          <div role="status" style={{
            position: 'fixed', top: '5.5rem', right: '1.5rem', zIndex: 100,
            display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '380px',
            padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)',
            background: notification.type === 'error' ? '#FEF2F2' : '#ECFDF5',
            color: notification.type === 'error' ? '#B91C1C' : '#047857',
            border: `1px solid ${notification.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>{notification.type === 'error' ? '⚠' : '✓'}</span>
            <span style={{ flex: 1, fontWeight: 600 }}>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              aria-label="Dismiss notification"
              title="Dismiss"
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}
        {errorMessage && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--error)',
            padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.95rem'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="enterprise-header">
          <div>
            <h1>Partner Dashboard</h1>
            <p>Manage jobs, transport requests, live availability, and your commercial vehicle.</p>
          </div>
        </div>

        {userProfile && (
          <section className="premium-card" style={{
            marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
          }}>
            <div>
              <span className="badge badge-assigned" style={{ marginBottom: '0.5rem' }}>Active Partner Account</span>
              <h1 style={{ color: 'var(--primary)', fontSize: '2.2rem' }}>{userProfile.name}</h1>
              <p style={{ color: 'var(--text-main)', marginTop: '0.25rem', fontSize: '1rem', fontWeight: 500 }}>
                ✉️ {userProfile.email} | 📞 {userProfile.phone || 'No phone added'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                📍 Service Area: {userProfile.city || 'Not specified'} (Pincode: {userProfile.pincode || 'Not specified'})
              </p>
              {myVehicle && (
                <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.08)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(37,99,235,0.2)' }}>
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Vehicle: {myVehicle.modelName} ({myVehicle.registrationNumber}) • {myVehicle.capacityKg} KG Max
                  </span>
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex', gap: '2.5rem', background: 'var(--bg-page)', padding: '1.5rem 2.5rem',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', alignItems: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Rating</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.8rem', display: 'block', marginTop: '0.25rem' }}>
                  ⭐ {userProfile.rating !== undefined ? userProfile.rating.toFixed(1) : '0.0'}
                </strong>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-light)', height: '40px' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Experience</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.8rem', display: 'block', marginTop: '0.25rem' }}>
                  {userProfile.experienceYears || 0} yrs
                </strong>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-light)', height: '40px' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Jobs</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.8rem', display: 'block', marginTop: '0.25rem' }}>
                  {userProfile.totalJobs || 0}
                </strong>
              </div>
            </div>
          </section>
        )}

        <div className="grid-cols-3" style={{ gap: '2rem', alignItems: 'flex-start' }}>
          {/* Left Column: Assigned Bookings & Available Tasks */}
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* AVAILABLE TASKS SECTION */}
            <div id="tasks-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--secondary)' }}>Available Tasks (Claim Now)</h2>
                <span className="badge badge-pending">{availableTasks.length} Available</span>
              </div>

              {availableTasks.length === 0 ? (
                <div className="premium-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-hover)' }}>
                  <span style={{ fontSize: '2.5rem' }}>🔍</span>
                  <p style={{ marginTop: '1rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>No unassigned tasks in your area right now.</p>
                </div>
              ) : (
                availableTasks.map((job) => (
                  <div key={job.id} className="premium-card" style={{
                    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
                    borderLeft: '4px solid var(--secondary)', background: 'var(--bg-card)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {job.dropAddress && <Truck className="w-5 h-5 text-blue-500" />}
                          <h3 style={{ color: 'var(--text-main)', fontSize: '1.3rem', margin: 0 }}>{job.serviceName}</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>📍 {job.city} - {job.pincode}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '1.3rem' }}>₹{job.finalAmount}</p>
                        <button onClick={() => handleClaimTask(job.id)} className="btn btn-primary btn-small" style={{ marginTop: '0.5rem' }}>
                          Accept & Claim Job
                        </button>
                      </div>
                    </div>

                    {/* Route Details if Vehicle Job */}
                    {job.dropAddress && (
                      <div style={{ background: 'rgba(37,99,235,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(37,99,235,0.15)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 700, textTransform: 'uppercase' }}>📍 Pickup Point</span>
                            <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{job.address}, {job.city}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#F97316', fontWeight: 700, textTransform: 'uppercase' }}>🏁 Drop-off Destination</span>
                            <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{job.dropAddress}, {job.dropCity}</p>
                          </div>
                        </div>
                        {job.packageWeightKg && (
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            📦 Cargo Weight: {job.packageWeightKg} KG {job.distanceKm ? `• Est. Distance: ${job.distanceKm} KM` : ''}
                          </p>
                        )}
                      </div>
                    )}

                    <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 500 }}>⏱️ Scheduled for: {job.bookingDate} at {formatLocalTime(job.startTime)}</p>
                      {job.notes && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}>"{job.notes}"</p>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ASSIGNED BOOKINGS SECTION */}
            <div id="assigned-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>Assigned Customer Bookings</h2>
                <span className="badge badge-assigned">{assignedBookings.length} Total</span>
              </div>

              {assignedBookings.length === 0 ? (
                <div className="premium-card" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '3rem' }}>📭</span>
                  <p style={{ marginTop: '1rem', fontSize: '1rem', color: 'var(--text-muted)' }}>No job bookings currently assigned to you.</p>
                </div>
              ) : (
                assignedBookings.map((job) => (
                  <div key={job.id} className="premium-card" style={{
                    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
                    borderLeft: `4px solid ${
                      job.status === 'ASSIGNED' ? '#3B82F6' : job.status === 'ACCEPTED' ? '#0F172A' : job.status === 'IN_PROGRESS' ? '#F59E0B' : '#10B981'
                    }`
                  }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {job.dropAddress && <Truck className="w-5 h-5 text-blue-500" />}
                          <h3 style={{ color: 'var(--text-main)', fontSize: '1.3rem', margin: 0 }}>{job.serviceName}</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ID: #{String(job.id).slice(-6)} | Placed: {new Date(job.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.3rem' }}>₹{job.finalAmount}</p>
                        <span className={`badge ${
                          job.status === 'ASSIGNED' ? 'badge-assigned' : job.status === 'ACCEPTED' ? 'badge-accepted' : job.status === 'IN_PROGRESS' ? 'badge-inprogress' : 'badge-completed'
                        }`} style={{ fontSize: '0.65rem', marginTop: '0.35rem' }}>
                          {job.status}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--bg-page)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Client Info</p>
                        <p style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1.05rem' }}>{job.userName}</p>
                        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginTop: '0.1rem' }}>📞 {job.userPhone || 'No contact specified'}</p>
                        <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 500 }}>⏱️ {job.bookingDate} at {formatLocalTime(job.startTime)}</p>
                      </div>

                      <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                          {job.dropAddress ? 'Pickup Location' : 'Service Address'}
                        </p>
                        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{job.address}, {job.city} - {job.pincode}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => openCustomerDirections(job)}
                            className="btn btn-secondary btn-small"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                          >
                            📍 {job.dropAddress ? 'Nav to Pickup' : 'Navigate'}
                          </button>
                          {job.dropAddress && (
                            <button
                              type="button"
                              onClick={() => openDropDirections(job)}
                              className="btn btn-secondary btn-small"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#F97316' }}
                            >
                              🏁 Nav to Drop-off
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Drop-off & Cargo specific row */}
                    {job.dropAddress && (
                      <div style={{ padding: '0.9rem 1.25rem', background: 'rgba(249, 115, 22, 0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(249, 115, 22, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#F97316', fontWeight: 700, textTransform: 'uppercase' }}>🏁 Drop Destination:</span>
                          <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>{job.dropAddress}, {job.dropCity} ({job.dropPincode})</p>
                          {job.packageWeightKg && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Cargo: {job.packageWeightKg} KG {job.packageDescription ? `(${job.packageDescription})` : ''}
                            </span>
                          )}
                        </div>
                        {job.distanceKm && (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transit Distance</span>
                            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{job.distanceKm} KM</p>
                          </div>
                        )}
                      </div>
                    )}

                    {job.notes && (
                      <div style={{ fontSize: '0.9rem', background: 'rgba(245, 158, 11, 0.12)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                        <p style={{ color: 'var(--text-main)', fontStyle: 'italic', margin: 0 }}>
                          📝 Customer Note: "{job.notes}"
                        </p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment Method:</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {job.paymentMethod === 'AFTER_SERVICE' ? '💵 Cash After Trip' : '💳 Online Paid'}
                        </span>
                        <span className={`badge ${job.paymentStatus === 'PAID' ? 'badge-completed' : 'badge-pending'}`} style={{ fontSize: '0.65rem' }}>
                          {job.paymentStatus}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {job.status === 'ASSIGNED' && (
                          <>
                            <button onClick={() => handleAcceptJob(job.id)} className="btn btn-primary btn-small">
                              Accept Trip / Job
                            </button>
                            <button onClick={() => handleRejectJob(job.id)} className="btn btn-secondary btn-small">
                              Reject
                            </button>
                          </>
                        )}

                        {job.status === 'ACCEPTED' && (
                          <button onClick={() => handleStatusUpdate(job.id, 'IN_PROGRESS')} className="btn btn-primary btn-small">
                            {job.dropAddress ? '🚀 Start Trip / Pickup Reached' : 'Start Service'}
                          </button>
                        )}

                        {job.status === 'IN_PROGRESS' && (
                          <button onClick={() => handleStatusUpdate(job.id, 'COMPLETED')} className="btn btn-primary btn-small" style={{ background: '#10B981', borderColor: '#10B981' }}>
                            {job.dropAddress ? '🏁 Complete Delivery & Trip' : 'Complete Service'}
                          </button>
                        )}

                        {job.status === 'COMPLETED' && job.paymentMethod === 'AFTER_SERVICE' && job.paymentStatus !== 'PAID' && (
                          <button onClick={() => handleCollectCash(job.id)} className="btn btn-primary btn-small" style={{ background: '#10B981', borderColor: '#10B981' }}>
                            Collect ₹{job.finalAmount} Cash
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Right Column: Vehicle Registration & Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* VEHICLE PROFILE CARD (Only visible for Logistics / Vehicle Transport Partners) */}
            {isLogisticsPartner && (
              <div id="vehicle-section" className="premium-card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Truck className="w-5 h-5" /> My Transport Vehicle
                  </h2>
                  {myVehicle && (
                    <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>
                      {myVehicle.available ? 'Online & Available' : 'Offline'}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Register your vehicle to receive on-demand intra-city delivery and transport trips.
                </p>

                <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Vehicle Category *</label>
                    <select
                      className="form-control"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                    >
                      <option value="TWO_WHEELER_ELECTRIC">Electric Bike (Courier up to 25 KG)</option>
                      <option value="TWO_WHEELER_PETROL">Petrol Bike (Courier up to 25 KG)</option>
                      <option value="THREE_WHEELER_ELECTRIC">Electric Rickshaw (up to 250 KG)</option>
                      <option value="LOADING_VEHICLE">Loading Vehicle 3W (up to 500 KG)</option>
                      <option value="MINI_TRUCK">Mini Truck - Tata Ace (up to 1000 KG)</option>
                      <option value="TRUCK">Truck 14ft / 17ft (up to 2500 KG)</option>
                      <option value="HEAVY_TRUCK">Heavy Commercial Truck (up to 7000 KG)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Fuel Type</label>
                      <select
                        className="form-control"
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                      >
                        <option value="DIESEL">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="PETROL">Petrol</option>
                        <option value="ELECTRIC">Electric</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Capacity (KG)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={vehicleCapacityKg}
                        onChange={(e) => setVehicleCapacityKg(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Model Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Tata Ace Gold, Hero Electric Nyx, Piaggio Ape"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Registration Plate / Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MP-09-TA-1234"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      required
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    <input
                      type="checkbox"
                      checked={vehicleAvailable}
                      onChange={(e) => setVehicleAvailable(e.target.checked)}
                      style={{ accentColor: 'var(--primary)', width: '1rem', height: '1rem' }}
                    />
                    <span>Mark vehicle as Available for trips today</span>
                  </label>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={savingVehicle}>
                    {savingVehicle ? 'Saving Vehicle...' : myVehicle ? 'Update Vehicle Info' : 'Register My Vehicle'}
                  </button>
                </form>
              </div>
            )}

            {/* Availability Slots Card */}
            <div id="schedule-section" className="premium-card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🕒 Daily Availability
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Create recurring time slots when you are open to take customer bookings.
              </p>

              <form onSubmit={handleAddAvailability} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min={tomorrowStr}
                    value={availDate}
                    onChange={(e) => setAvailDate(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={availStart}
                      onChange={(e) => setAvailStart(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={availEnd}
                      onChange={(e) => setAvailEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.25rem' }}>
                  + Add Availability Slot
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                {availability.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '0.75rem' }}>No slots registered.</p>
                ) : (
                  availability.map((slot) => (
                    <div key={slot.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'var(--bg-page)', padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)', fontSize: '0.85rem'
                    }}>
                      <div>
                        <p style={{ color: 'var(--text-main)', fontWeight: 600, margin: 0 }}>{slot.availableDate}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                          {formatLocalTime(slot.startTime)} - {formatLocalTime(slot.endTime)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAvailability(slot.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontSize: '1rem', cursor: 'pointer' }}
                        title="Delete Slot"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Categories Card */}
            <div className="premium-card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🛠️ My Trade Categories
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Select the service domains you accept jobs for:
              </p>
              <form onSubmit={handleSaveCategories}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {availableCategories.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => handleToggleCategory(cat.id)}
                        style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--primary)' }}
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingCategories}>
                  {savingCategories ? 'Saving...' : 'Save Categories'}
                </button>
              </form>
            </div>

            {/* Profile Settings Card */}
            <div className="premium-card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ⚙️ Profile Settings
              </h2>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Experience (Years) *</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={editExp}
                    onChange={(e) => setEditExp(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Bio / Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Skills, commercial license, vehicles..."
                    style={{ resize: 'none' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Profile Details'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
