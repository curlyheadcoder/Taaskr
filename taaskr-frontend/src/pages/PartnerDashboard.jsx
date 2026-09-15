import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  Navigation, MapPin, CheckCircle, Clock, Phone, AlertCircle, 
  RefreshCw, ShieldCheck, UserCheck, Play, Award, Zap, Compass, DollarSign 
} from 'lucide-react';

export default function PartnerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'all'
  const [isBroadcastingGps, setIsBroadcastingGps] = useState(false);
  const [currentGpsCoords, setCurrentGpsCoords] = useState(null);
  const watchIdRef = useRef(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      const tasksData = await api.partner.getMyTasks();
      setTasks(tasksData || []);
    } catch (err) {
      console.error('Failed to load partner tasks:', err);
      setError(err.message || 'Failed to load assigned tasks. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live GPS Telemetry Broadcasting
  const startGpsBroadcasting = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device browser.');
      return;
    }

    setIsBroadcastingGps(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        setCurrentGpsCoords({ latitude, longitude });

        try {
          await api.partner.updateLocation({
            latitude,
            longitude,
            heading: heading || 0.0,
            speed: speed || 0.0
          });
        } catch (err) {
          console.warn('Location broadcast payload error:', err);
        }
      },
      (err) => {
        console.error('GPS Watch error:', err);
        setIsBroadcastingGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  };

  const stopGpsBroadcasting = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcastingGps(false);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Action Handlers
  const handleAcceptTask = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      await api.partner.acceptTask(bookingId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to accept task');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartJourney = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      await api.partner.startJourney(bookingId);
      if (!isBroadcastingGps) {
        startGpsBroadcasting();
      }
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to start journey');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkArrived = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      await api.partner.markArrived(bookingId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to mark arrival');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartWork = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      await api.partner.startWork(bookingId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to start work');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteWork = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      await api.partner.completeWork(bookingId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to complete work');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRecordPayment = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      await api.partner.recordPayment(bookingId, 'AFTER_SERVICE');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'active') return t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
    if (activeTab === 'completed') return t.status === 'COMPLETED';
    return true;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'IN_TRANSIT':
      case 'ON_THE_WAY':
        return { bg: 'rgba(59, 130, 246, 0.18)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.4)' };
      case 'ARRIVED_AT_LOCATION':
      case 'WORK_IN_PROGRESS':
        return { bg: 'rgba(245, 158, 11, 0.18)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.4)' };
      case 'COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.18)', text: '#34D399', border: 'rgba(16, 185, 129, 0.4)' };
      default:
        return { bg: 'rgba(139, 92, 246, 0.18)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.4)' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            fontSize: '1.5rem',
            fontWeight: 700,
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserCheck size={28} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#F8FAFC', fontWeight: 700 }}>
                {user?.name || 'Service Partner'}
              </h2>
              <span style={{
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '0.2rem 0.6rem',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <ShieldCheck size={13} /> VERIFIED TECHNICIAN
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', color: '#94A3B8', fontSize: '0.88rem' }}>
              Field Operations Console & Real-time Task Dispatch • {user?.email || ''}
            </p>
          </div>
        </div>

        {/* GPS Broadcasting Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={isBroadcastingGps ? stopGpsBroadcasting : startGpsBroadcasting}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: isBroadcastingGps 
                ? 'linear-gradient(135deg, #EF4444, #DC2626)' 
                : 'linear-gradient(135deg, #10B981, #059669)',
              color: '#FFF',
              boxShadow: isBroadcastingGps 
                ? '0 0 16px rgba(239, 68, 68, 0.4)' 
                : '0 0 16px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Compass size={16} className={isBroadcastingGps ? 'spin-slow' : ''} />
            {isBroadcastingGps ? 'Stop Live GPS Broadcast' : 'Start Live GPS Broadcast'}
          </button>
          
          <button
            onClick={loadData}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#F8FAFC',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.88rem'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-slow' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* GPS Telemetry Bar */}
      {isBroadcastingGps && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#34D399',
          fontSize: '0.88rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 10px #10B981',
              animation: 'pulse 1.5s infinite'
            }} />
            <strong>LIVE BROADCAST ACTIVE:</strong> Real-time device GPS coordinates are updating telemetry server.
          </div>
          {currentGpsCoords && (
            <div style={{ fontFamily: 'monospace', opacity: 0.9 }}>
              Lat: {currentGpsCoords.latitude.toFixed(5)} | Lng: {currentGpsCoords.longitude.toFixed(5)}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC' }}>
              {tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Active Field Tasks</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC' }}>
              {tasks.filter(t => t.status === 'COMPLETED').length}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Completed Jobs</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC' }}>
              5.0 ★
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Partner Service Score</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.88rem',
            background: activeTab === 'active' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            color: activeTab === 'active' ? '#60A5FA' : '#94A3B8'
          }}
        >
          Active Assigned ({tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.88rem',
            background: activeTab === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: activeTab === 'completed' ? '#34D399' : '#94A3B8'
          }}
        >
          Completed Jobs ({tasks.filter(t => t.status === 'COMPLETED').length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.88rem',
            background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: activeTab === 'all' ? '#F8FAFC' : '#94A3B8'
          }}
        >
          All Tasks ({tasks.length})
        </button>
      </div>

      {/* Task List Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
          <RefreshCw size={28} className="spin-slow" style={{ marginBottom: '0.75rem' }} />
          <p>Fetching assigned field tasks...</p>
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem',
          color: '#F87171',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: '#94A3B8'
        }}>
          <Navigation size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC' }}>No tasks found in this view</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {activeTab === 'active' 
              ? 'You currently have no active field dispatches. Your provider will assign incoming jobs to you.' 
              : 'No completed tasks yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredTasks.map((task) => {
            const statusBadge = getStatusBadgeClass(task.status);
            const isActionBusy = actionLoadingId === task.id;

            return (
              <div
                key={task.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '1rem',
                  paddingBottom: '0.85rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
                        BOOKING #{task.id}
                      </span>
                      <span style={{
                        background: statusBadge.bg,
                        color: statusBadge.text,
                        border: `1px solid ${statusBadge.border}`,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {task.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 style={{ margin: '0.4rem 0 0 0', color: '#F8FAFC', fontSize: '1.15rem' }}>
                      {task.serviceTitle || task.serviceName || 'Service Task'}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34D399' }}>
                      ₹{task.totalAmount || task.price || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Payment: {task.paymentStatus || 'PENDING'}
                    </div>
                  </div>
                </div>

                {/* Task Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: '0.4rem' }}>
                      CUSTOMER LOCATION
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#E2E8F0', fontSize: '0.9rem' }}>
                      <MapPin size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: '0.2rem' }} />
                      <div>
                        <strong>{task.userName || 'Customer'}</strong>
                        <div style={{ color: '#94A3B8', fontSize: '0.84rem', marginTop: '0.2rem' }}>
                          {task.address || task.serviceAddress || 'Customer Address Provided'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: '0.4rem' }}>
                      CONTACT & SCHEDULE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#E2E8F0', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={14} style={{ color: '#60A5FA' }} />
                        <span>{task.userPhone || 'Phone available on dispatch'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} style={{ color: '#FBBF24' }} />
                        <span>Scheduled: {task.bookingDate || 'Today'} • {task.bookingTime || 'Immediate'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Execution Action Buttons */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '1rem',
                  borderRadius: '12px'
                }}>
                  {task.status === 'ASSIGNED_TO_PARTNER' && (
                    <button
                      onClick={() => handleAcceptTask(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFF',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <CheckCircle size={16} /> Accept Task Dispatch
                    </button>
                  )}

                  {(task.status === 'ASSIGNED_TO_PARTNER' || task.status === 'PARTNER_ACCEPTED' || task.status === 'ACCEPTED') && (
                    <button
                      onClick={() => handleStartJourney(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        color: '#FFF',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Navigation size={16} /> Start Journey & Enable Live GPS
                    </button>
                  )}

                  {(task.status === 'IN_TRANSIT' || task.status === 'ON_THE_WAY') && (
                    <button
                      onClick={() => handleMarkArrived(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#FFF',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <MapPin size={16} /> Mark Arrived at Location
                    </button>
                  )}

                  {task.status === 'ARRIVED_AT_LOCATION' && (
                    <button
                      onClick={() => handleStartWork(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        color: '#FFF',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Play size={16} /> Start Service Work
                    </button>
                  )}

                  {task.status === 'WORK_IN_PROGRESS' && (
                    <button
                      onClick={() => handleCompleteWork(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFF',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <CheckCircle size={16} /> Mark Work Completed
                    </button>
                  )}

                  {task.status === 'WORK_COMPLETED' && (
                    <button
                      onClick={() => handleRecordPayment(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #047857)',
                        color: '#FFF',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <DollarSign size={16} /> Collect Cash / Confirm Payment (₹{task.totalAmount || 0})
                    </button>
                  )}

                  {task.status === 'COMPLETED' && (
                    <span style={{ color: '#34D399', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={16} /> Task Completed Successfully
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
