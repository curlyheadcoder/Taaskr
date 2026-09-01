import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';

export default function ProviderDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [assignedBookings, setAssignedBookings] = useState([]);
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
      // 1. Get current provider details via provider.getProfile
      const user = await api.provider.getProfile();
      setUserProfile(user);
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditExp(user.experienceYears || 0);
      setEditCity(user.city || '');
      setEditPincode(user.pincode || '');
      setEditBio(user.bio || '');

      // 2. Load availability slots (allowed for provider role)
      const slots = await api.provider.getAvailability();
      setAvailability(slots);

      // 3. Load assigned bookings (allowed for provider role)
      const bookingsList = await api.provider.getBookings();
      setAssignedBookings(bookingsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

      // 4. Load selected categories
      const myCats = await api.provider.getCategories();
      setSelectedCategoryIds(myCats.map(c => c.id));

      // 5. Load all active categories
      const allCats = await api.catalog.getCategories();
      setAvailableCategories(allCats.filter(c => c.active));

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
      
      // Reload slots
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
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleAcceptJob = async (bookingId) => {
    try {
      await api.provider.acceptBooking(bookingId);
      showNotification('Job accepted.');
      loadProviderDashboard(); // Reload lists
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
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

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await api.provider.updateBookingStatus(bookingId, status);
      showNotification(status === 'COMPLETED' ? 'Job completed.' : `Job status updated to ${status}.`);
      loadProviderDashboard();
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleMarkPaymentReceived = async (bookingId) => {
    if (!window.confirm('Confirm that you received payment from the customer?')) return;
    try {
      await api.provider.markAfterServicePaymentReceived(bookingId);
      showNotification('Payment marked as received.');
      loadProviderDashboard();
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, 'error');
    }
  };

  const openCustomerDirections = (job) => {
    const destination = Number.isFinite(job.latitude) && Number.isFinite(job.longitude)
      ? `${job.latitude},${job.longitude}`
      : [job.address, job.city, job.pincode].filter(Boolean).join(', ');
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await api.provider.updateProfile({
        name: editName,
        phone: editPhone,
        experienceYears: Number(editExp),
        city: editCity,
        pincode: editPincode,
        bio: editBio
      });
      showNotification('Profile updated successfully.');
      setUserProfile(updated);
    } catch (err) {
      showNotification(`Update failed: ${err.message}`, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleCategory = (categoryId) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleSaveCategories = async (e) => {
    e.preventDefault();
    if (selectedCategoryIds.length === 0) {
      showNotification('Please select at least one category.', 'error');
      return;
    }
    setSavingCategories(true);
    try {
      await api.provider.updateCategories(selectedCategoryIds);
      showNotification('Categories updated successfully.');
    } catch (err) {
      showNotification(`Update failed: ${err.message}`, 'error');
    } finally {
      setSavingCategories(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
        <div style={{
          display: 'inline-block', width: '30px', height: '30px',
          border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)',
          borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '1rem', fontWeight: 500 }}>Loading provider dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in">
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

      {userProfile && (
        <section className="premium-card" style={{
          marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
        }}>
          <div>
            <span className="badge badge-assigned" style={{ marginBottom: '0.5rem', background: '#F1F5F9', color: 'var(--text-muted)', border: 'none' }}>Active Provider Account</span>
            <h1 style={{ color: 'var(--primary)', fontSize: '2.2rem' }}>{userProfile.name}</h1>
            <p style={{ color: 'var(--text-main)', marginTop: '0.25rem', fontSize: '1rem', fontWeight: 500 }}>
              ✉️ {userProfile.email} | 📞 {userProfile.phone || 'No phone added'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              📍 Service Area: {userProfile.city || 'Not specified'} (Pincode: {userProfile.pincode || 'Not specified'})
            </p>
            {userProfile.bio && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic', marginTop: '1rem', maxWidth: '600px', lineHeight: 1.5 }}>
                "{userProfile.bio}"
              </p>
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
        {/* Left Column: Assigned Bookings */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '0.25rem' }}>{job.serviceName}</h3>
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
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Address & Schedule</p>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{job.address}, {job.city} - {job.pincode}</p>
                    <button
                      type="button"
                      onClick={() => openCustomerDirections(job)}
                      className="btn btn-secondary btn-small"
                      style={{ marginTop: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Open customer location in Google Maps"
                    >
                      <span aria-hidden="true">📍</span> Navigate
                    </button>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 500 }}>⏱️ {job.bookingDate} at {formatLocalTime(job.startTime)}</p>
                  </div>
                </div>

                {job.notes && (
                  <div style={{ fontSize: '0.9rem', background: '#FEF3C7', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A' }}>
                    <span style={{ color: '#92400E', fontWeight: 600 }}>Customer Instructions: </span>
                    <span style={{ color: '#B45309', fontStyle: 'italic' }}>"{job.notes}"</span>
                  </div>
                )}

                {/* Payment Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Payment:</span>
                  <span className={`badge ${job.paymentStatus === 'PAID' ? 'badge-completed' : 'badge-pending'}`}>
                    {job.paymentStatus}
                  </span>
                  {job.paymentMethod === 'AFTER_SERVICE' && (
                    <span style={{ color: 'var(--text-muted)' }}>(after service)</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                  {job.status === 'ASSIGNED' && (
                    <>
                      <button onClick={() => handleRejectJob(job.id)} className="btn btn-danger btn-small">Reject Request</button>
                      <button onClick={() => handleAcceptJob(job.id)} className="btn btn-success btn-small">Accept Request</button>
                    </>
                  )}
                  {job.status === 'ACCEPTED' && (
                    <button onClick={() => handleUpdateStatus(job.id, 'IN_PROGRESS')} className="btn btn-primary btn-small">Start Work</button>
                  )}
                  {job.status === 'IN_PROGRESS' && (
                    <button onClick={() => handleUpdateStatus(job.id, 'COMPLETED')} className="btn btn-success btn-small">Mark Completed</button>
                  )}
                  {job.status === 'COMPLETED' && (
                    <>
                      <span style={{ color: 'var(--success)', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        ✓ Job completed.
                      </span>
                      {job.paymentMethod === 'AFTER_SERVICE' && job.paymentStatus !== 'PAID' && (
                        <button onClick={() => handleMarkPaymentReceived(job.id)} className="btn btn-primary btn-small">
                          Mark Payment Received
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Availability Calendar & Profile Edit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Calendar Card */}
          <div className="premium-card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📅 Availability Slots
            </h2>
  
            <form onSubmit={handleAddAvailability} style={{ marginBottom: '1.5rem', background: 'var(--bg-page)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Add Calendar Slot</h4>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
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
  
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={availStart}
                    onChange={(e) => setAvailStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
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
  
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                + Register Slot
              </button>
            </form>
  
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              {availability.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center', padding: '1rem' }}>No slots registered.</p>
              ) : (
                availability.map((slot) => (
                  <div key={slot.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)', fontSize: '0.9rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div>
                      <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>{slot.availableDate}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatLocalTime(slot.startTime)} - {formatLocalTime(slot.endTime)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAvailability(slot.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem' }}
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
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏷️ Service Categories
            </h2>
            <form onSubmit={handleSaveCategories}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
                {availableCategories.map(cat => (
                  <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => handleToggleCategory(cat.id)}
                      style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }}
                    />
                    {cat.name}
                  </label>
                ))}
                {availableCategories.length === 0 && (
                  <p style={{ color: 'var(--text-muted)' }}>No categories available.</p>
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingCategories}>
                {savingCategories ? 'Saving...' : 'Save Categories'}
              </button>
            </form>
          </div>

          {/* Profile Editor Card */}
          <div className="premium-card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚙️ Profile Settings
            </h2>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
  
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell clients about your skills and experience..."
                  style={{ resize: 'none' }}
                />
              </div>
  
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>
          </div>
  
        </div>
      </div>
    </div>
  );
}
