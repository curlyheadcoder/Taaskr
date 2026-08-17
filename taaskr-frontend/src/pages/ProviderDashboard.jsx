import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';

export default function ProviderDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [assignedBookings, setAssignedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // New availability form state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [availDate, setAvailDate] = useState(tomorrowStr);
  const [availStart, setAvailStart] = useState('09:00');
  const [availEnd, setAvailEnd] = useState('11:00');

  const loadProviderDashboard = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Get current logged in user details via auth.me (which provider role has access to)
      const user = await api.auth.me();
      setUserProfile(user);

      // 2. Load availability slots (allowed for provider role)
      const slots = await api.provider.getAvailability();
      setAvailability(slots);

      // 3. Load assigned bookings (allowed for provider role)
      const bookingsList = await api.provider.getBookings();
      setAssignedBookings(bookingsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

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
      alert('Availability slot added!');
      
      // Reload slots
      const slots = await api.provider.getAvailability();
      setAvailability(slots);
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleDeleteAvailability = async (slotId) => {
    if (!window.confirm('Delete this availability slot?')) return;
    try {
      await api.provider.deleteAvailability(slotId);
      setAvailability(prev => prev.filter(s => s.id !== slotId));
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleAcceptJob = async (bookingId) => {
    try {
      await api.provider.acceptBooking(bookingId);
      alert('Job accepted!');
      loadProviderDashboard(); // Reload lists
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleRejectJob = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this job?')) return;
    try {
      await api.provider.rejectBooking(bookingId);
      alert('Job rejected.');
      loadProviderDashboard();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await api.provider.updateBookingStatus(bookingId, status);
      alert(`Job status updated to ${status}!`);
      loadProviderDashboard();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <div style={{
          display: 'inline-block',
          width: '30px',
          height: '30px',
          border: '2.5px solid var(--border-glass)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '1rem' }}>Loading provider dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in">
      {errorMessage && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          color: 'var(--rose)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Profile summary banner */}
      {userProfile && (
        <section className="glass-panel" style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <span className="badge badge-assigned" style={{ marginBottom: '0.5rem' }}>Active Provider Account</span>
            <h1 style={{ color: '#fff', fontSize: '2rem' }}>{userProfile.name}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              ✉️ {userProfile.email} | 📞 {userProfile.phone || 'No phone added'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              📍 Service Area: {userProfile.city || 'Not specified'} (Pincode: {userProfile.pincode || 'Not specified'})
            </p>
          </div>
          
          <div style={{
            maxWidth: '350px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed var(--border-glass)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.4'
          }}>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>ℹ️ Provider Profile Notice:</strong>
            Provider self-profile endpoint is missing from the current backend. Detailed statistics (rating, experience years, bio) cannot be queried for the logged-in provider.
          </div>
        </section>
      )}

      <div className="grid-cols-3" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left Column: Assigned Bookings (2/3 width equivalent) */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>Assigned Customer Bookings</h2>
            <span className="badge badge-assigned">{assignedBookings.length} Total</span>
          </div>

          {assignedBookings.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '2.5rem' }}>📭</span>
              <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>No job bookings currently assigned to you.</p>
            </div>
          ) : (
            assignedBookings.map((job) => (
              <div key={job.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${
                job.status === 'ASSIGNED' ? 'var(--blue)' : job.status === 'ACCEPTED' ? 'var(--primary)' : job.status === 'IN_PROGRESS' ? 'var(--secondary)' : 'var(--emerald)'
              }` }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>{job.serviceName}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ID: #{String(job.id).slice(-6)} | Placed: {new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>₹{job.finalAmount}</p>
                    <span className={`badge ${
                      job.status === 'ASSIGNED' ? 'badge-assigned' : job.status === 'ACCEPTED' ? 'badge-accepted' : job.status === 'IN_PROGRESS' ? 'badge-inprogress' : 'badge-completed'
                    }`} style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
                      {job.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Client Info</p>
                    <p style={{ color: '#fff', fontWeight: 600 }}>{job.userName}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>📞 {job.userPhone || 'No contact specified'}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Address & Schedule</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{job.address}, {job.city} - {job.pincode}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>⏱️ {job.bookingDate} at {formatLocalTime(job.startTime)}</p>
                  </div>
                </div>

                {job.notes && (
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Customer Instructions: </span>
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>"{job.notes}"</span>
                  </div>
                )}

                {/* Payment Status Indicator (Strict data mapping) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Payment:</span>
                  <span className={`badge ${job.paymentStatus === 'PAID' ? 'badge-completed' : 'badge-pending'}`}>
                    {job.paymentStatus}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                  {job.status === 'ASSIGNED' && (
                    <>
                      <button onClick={() => handleRejectJob(job.id)} className="btn btn-danger btn-small">Reject Request</button>
                      <button onClick={() => handleAcceptJob(job.id)} className="btn btn-success btn-small">Accept Request</button>
                    </>
                  )}
                  {job.status === 'ACCEPTED' && (
                    <button onClick={() => handleUpdateStatus(job.id, 'IN_PROGRESS')} className="btn className btn-primary btn-small">Start Work</button>
                  )}
                  {job.status === 'IN_PROGRESS' && (
                    <button onClick={() => handleUpdateStatus(job.id, 'COMPLETED')} className="btn btn-success btn-small">Mark Completed</button>
                  )}
                  {job.status === 'COMPLETED' && (
                    <span style={{ color: 'var(--emerald)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      ✓ Job completed.
                    </span>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Right Column: Availability Calendar (1/3 width) */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📅 Availability Slots
          </h2>

          {/* Availability Add form */}
          <form onSubmit={handleAddAvailability} style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <h4 style={{ color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Add Calendar Slot</h4>
            
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Date</label>
              <input
                type="date"
                className="form-control"
                min={tomorrowStr}
                value={availDate}
                onChange={(e) => setAvailDate(e.target.value)}
                required
                style={{ fontSize: '0.85rem', padding: '0.5rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={availStart}
                  onChange={(e) => setAvailStart(e.target.value)}
                  required
                  style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>End Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={availEnd}
                  onChange={(e) => setAvailEnd(e.target.value)}
                  required
                  style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-small" style={{ width: '100%' }}>
              + Register Slot
            </button>
          </form>

          {/* Slots List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {availability.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No slots registered.</p>
            ) : (
              availability.map((slot) => (
                <div key={slot.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 600 }}>{slot.availableDate}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {formatLocalTime(slot.startTime)} - {formatLocalTime(slot.endTime)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAvailability(slot.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--rose)',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      padding: '0.2rem'
                    }}
                    title="Delete Slot"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
