import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  Navigation, MapPin, CheckCircle, Clock, Phone, AlertCircle, 
  RefreshCw, ShieldCheck, UserCheck, Play, Award, Zap, Compass, DollarSign,
  Search, ExternalLink, Building2, Briefcase, ChevronRight, Activity, Calendar
} from 'lucide-react';

export default function PartnerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  
  // GPS Telemetry
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

      // Fetch profile & tasks in parallel from backend APIs
      const [profileData, tasksData] = await Promise.allSettled([
        api.partner.getProfile ? api.partner.getProfile() : Promise.resolve(null),
        api.partner.getMyTasks ? api.partner.getMyTasks() : api.partner.getTasks()
      ]);

      if (profileData.status === 'fulfilled' && profileData.value) {
        setProfile(profileData.value);
      }
      if (tasksData.status === 'fulfilled' && tasksData.value) {
        setTasks(tasksData.value || []);
      } else if (tasksData.status === 'rejected') {
        throw tasksData.reason;
      }
    } catch (err) {
      console.error('Failed to load partner dashboard data:', err);
      setError(err.message || 'Failed to load assigned field tasks. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live GPS Broadcasting via HTML5 Geolocation Watch Position
  const startGpsBroadcasting = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device browser.');
      return;
    }

    setIsBroadcastingGps(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        setCurrentGpsCoords({ latitude, longitude, speed: speed || 0, heading: heading || 0 });

        try {
          await api.partner.updateLocation({
            latitude,
            longitude,
            heading: heading || 0.0,
            speed: speed || 0.0
          });
        } catch (err) {
          console.warn('Location broadcast telemetry error:', err);
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

  // Workflow Execution Actions
  const handleAcceptTask = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      await api.partner.acceptTask(bookingId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to accept dispatch task');
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
      alert(err.message || 'Failed to start service work');
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
      alert(err.message || 'Failed to record cash payment');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter tasks by active Tab and search query
  const filteredTasks = tasks.filter(t => {
    const matchesTab = 
      activeTab === 'active' ? (t.status !== 'COMPLETED' && t.status !== 'CANCELLED') :
      activeTab === 'completed' ? (t.status === 'COMPLETED') : true;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (t.id && String(t.id).includes(query)) ||
      (t.userName && t.userName.toLowerCase().includes(query)) ||
      (t.serviceTitle && t.serviceTitle.toLowerCase().includes(query)) ||
      (t.address && t.address.toLowerCase().includes(query));

    return matchesTab && matchesSearch;
  });

  // Calculate real DB statistics
  const totalCompletedJobs = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalActiveJobs = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
  const totalCollectedEarnings = tasks
    .filter(t => t.status === 'COMPLETED' || t.status === 'PAYMENT_COLLECTED')
    .reduce((sum, t) => sum + (Number(t.totalAmount || t.price || 0)), 0);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'IN_TRANSIT':
      case 'ON_THE_WAY':
        return { bg: 'rgba(59, 130, 246, 0.18)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.4)', label: 'IN TRANSIT' };
      case 'ARRIVED_AT_LOCATION':
        return { bg: 'rgba(245, 158, 11, 0.18)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.4)', label: 'ARRIVED AT SITE' };
      case 'WORK_IN_PROGRESS':
        return { bg: 'rgba(139, 92, 246, 0.18)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.4)', label: 'WORK IN PROGRESS' };
      case 'WORK_COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.18)', text: '#34D399', border: 'rgba(16, 185, 129, 0.4)', label: 'WORK COMPLETED' };
      case 'PAYMENT_COLLECTED':
        return { bg: 'rgba(16, 185, 129, 0.22)', text: '#10B981', border: 'rgba(16, 185, 129, 0.5)', label: 'PAYMENT COLLECTED' };
      case 'COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.18)', text: '#34D399', border: 'rgba(16, 185, 129, 0.4)', label: 'COMPLETED' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.18)', text: '#CBD5E1', border: 'rgba(148, 163, 184, 0.4)', label: status?.replace(/_/g, ' ') || 'ASSIGNED' };
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* Top Banner: Service Partner Console Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '1.75rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            fontSize: '1.6rem',
            fontWeight: 800,
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.45)'
          }}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : 'W')}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.45rem', color: '#F8FAFC', fontWeight: 800 }}>
                {profile?.name || user?.name || 'Service Technician'}
              </h2>
              <span style={{
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                padding: '0.2rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <ShieldCheck size={14} /> VERIFIED FIELD TECHNICIAN
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', color: '#94A3B8', fontSize: '0.88rem', flexWrap: 'wrap' }}>
              {profile?.providerName && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#60A5FA', fontWeight: 600 }}>
                  <Building2 size={14} /> {profile.providerName}
                </span>
              )}
              <span>{profile?.title || 'Service Specialist'}</span>
              <span>• {profile?.experience || '2+ Years'} Experience</span>
              <span>• {user?.email || profile?.email || ''}</span>
            </div>
          </div>
        </div>

        {/* Live GPS Telemetry Switch & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={isBroadcastingGps ? stopGpsBroadcasting : startGpsBroadcasting}
            style={{
              padding: '0.7rem 1.35rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: isBroadcastingGps 
                ? 'linear-gradient(135deg, #EF4444, #DC2626)' 
                : 'linear-gradient(135deg, #10B981, #059669)',
              color: '#FFF',
              boxShadow: isBroadcastingGps 
                ? '0 0 20px rgba(239, 68, 68, 0.45)' 
                : '0 0 20px rgba(16, 185, 129, 0.45)',
              transition: 'all 0.2s ease'
            }}
          >
            <Compass size={17} className={isBroadcastingGps ? 'spin-slow' : ''} />
            {isBroadcastingGps ? 'Stop Live GPS Broadcast' : 'Start Live GPS Broadcast'}
          </button>

          <button
            onClick={loadData}
            style={{
              padding: '0.7rem 1.1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#F8FAFC',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin-slow' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* GPS Active Alert Banner */}
      {isBroadcastingGps && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.14)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '14px',
          padding: '0.9rem 1.35rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#34D399',
          fontSize: '0.88rem',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 12px #10B981',
              animation: 'pulse 1.5s infinite'
            }} />
            <div>
              <strong>REAL-TIME GPS TELEMETRY ACTIVE:</strong> Device position is auto-transmitting to customers and dispatch center.
            </div>
          </div>
          {currentGpsCoords && (
            <div style={{ fontFamily: 'monospace', opacity: 0.95, fontSize: '0.82rem' }}>
              Lat: {currentGpsCoords.latitude.toFixed(5)} | Lng: {currentGpsCoords.longitude.toFixed(5)}
            </div>
          )}
        </div>
      )}

      {/* Real Performance & DB Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.35rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.15rem'
        }}>
          <div style={{ padding: '0.85rem', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.18)', color: '#60A5FA' }}>
            <Zap size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC' }}>
              {totalActiveJobs}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#94A3B8', fontWeight: 500 }}>Active Dispatches</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.35rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.15rem'
        }}>
          <div style={{ padding: '0.85rem', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.18)', color: '#34D399' }}>
            <CheckCircle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC' }}>
              {totalCompletedJobs}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#94A3B8', fontWeight: 500 }}>Completed Jobs</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.35rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.15rem'
        }}>
          <div style={{ padding: '0.85rem', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.18)', color: '#34D399' }}>
            <DollarSign size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34D399' }}>
              ₹{totalCollectedEarnings.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#94A3B8', fontWeight: 500 }}>Job Revenue Handled</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.35rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.15rem'
        }}>
          <div style={{ padding: '0.85rem', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.18)', color: '#FBBF24' }}>
            <Award size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC' }}>
              {profile?.rating ? profile.rating.toFixed(1) : '5.0'} ★
            </div>
            <div style={{ fontSize: '0.84rem', color: '#94A3B8', fontWeight: 500 }}>Technician Rating</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '0.85rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              background: activeTab === 'active' ? 'rgba(59, 130, 246, 0.22)' : 'transparent',
              color: activeTab === 'active' ? '#60A5FA' : '#94A3B8'
            }}
          >
            Active Field Tasks ({totalActiveJobs})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              background: activeTab === 'completed' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
              color: activeTab === 'completed' ? '#34D399' : '#94A3B8'
            }}
          >
            Completed Jobs ({totalCompletedJobs})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: activeTab === 'all' ? '#F8FAFC' : '#94A3B8'
            }}
          >
            All Tasks ({tasks.length})
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search booking #, customer, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem 0.5rem 2.4rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(15, 23, 42, 0.6)',
              color: '#F8FAFC',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Task List Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94A3B8' }}>
          <RefreshCw size={32} className="spin-slow" style={{ marginBottom: '0.85rem' }} />
          <p style={{ fontSize: '0.95rem' }}>Loading assigned field tasks from dispatch server...</p>
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '14px',
          padding: '1.35rem',
          color: '#F87171',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <AlertCircle size={22} />
          <div>{error}</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '18px',
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
          color: '#94A3B8'
        }}>
          <Navigation size={44} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC', fontSize: '1.15rem' }}>No field dispatches found</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {activeTab === 'active' 
              ? 'You currently have no pending tasks. New task assignments from your provider will automatically appear here.' 
              : 'No matching completed tasks found.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          {filteredTasks.map((task) => {
            const statusBadge = getStatusBadgeStyle(task.status);
            const isActionBusy = actionLoadingId === task.id;

            return (
              <div
                key={task.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '18px',
                  padding: '1.65rem',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {/* Header Row */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '1.15rem',
                  paddingBottom: '0.9rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
                        BOOKING #{task.id}
                      </span>
                      <span style={{
                        background: statusBadge.bg,
                        color: statusBadge.text,
                        border: `1px solid ${statusBadge.border}`,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        letterSpacing: '0.02em'
                      }}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <h3 style={{ margin: '0.45rem 0 0 0', color: '#F8FAFC', fontSize: '1.2rem', fontWeight: 700 }}>
                      {task.serviceTitle || task.serviceName || 'Scheduled Service Task'}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34D399' }}>
                      ₹{task.totalAmount || task.price || 0}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                      Payment Status: <strong style={{ color: task.paymentStatus === 'COMPLETED' ? '#34D399' : '#FBBF24' }}>{task.paymentStatus || 'PENDING'}</strong>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.35rem'
                }}>
                  {/* Location Card */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.55)', padding: '1.15rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                      CUSTOMER ADDRESS & NAVIGATION
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#E2E8F0', fontSize: '0.92rem' }}>
                      <MapPin size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: '0.15rem' }} />
                      <div>
                        <strong style={{ color: '#F8FAFC', fontSize: '0.98rem' }}>{task.userName || 'Customer'}</strong>
                        <div style={{ color: '#94A3B8', fontSize: '0.86rem', marginTop: '0.25rem', lineHeight: 1.4 }}>
                          {task.address || task.serviceAddress || 'Address on file'}
                        </div>
                        {task.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              color: '#60A5FA',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              marginTop: '0.5rem',
                              textDecoration: 'none'
                            }}
                          >
                            <ExternalLink size={13} /> Open in Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Timing Card */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.55)', padding: '1.15rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                      DISPATCH & SCHEDULE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#E2E8F0', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <Phone size={15} style={{ color: '#60A5FA' }} />
                        <span>
                          Call Customer:{' '}
                          <a href={`tel:${task.userPhone}`} style={{ color: '#60A5FA', fontWeight: 700, textDecoration: 'none' }}>
                            {task.userPhone || 'Provided upon dispatch'}
                          </a>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <Clock size={15} style={{ color: '#FBBF24' }} />
                        <span>Scheduled Slot: {task.bookingDate || 'Today'} • {task.bookingTime || 'Standard Service'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Buttons Panel */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.85rem',
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '1.1rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {(task.status === 'PARTNER_ASSIGNED' || task.status === 'ASSIGNED_TO_PARTNER') && (
                    <button
                      onClick={() => handleAcceptTask(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.7rem 1.35rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFF',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <CheckCircle size={17} /> Accept Task Dispatch
                    </button>
                  )}

                  {(task.status === 'PARTNER_ASSIGNED' || task.status === 'ASSIGNED_TO_PARTNER' || task.status === 'PARTNER_ACCEPTED' || task.status === 'ACCEPTED') && (
                    <button
                      onClick={() => handleStartJourney(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.7rem 1.35rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        color: '#FFF',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <Navigation size={17} /> Start Journey & Enable Live GPS
                    </button>
                  )}

                  {(task.status === 'IN_TRANSIT' || task.status === 'ON_THE_WAY') && (
                    <button
                      onClick={() => handleMarkArrived(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.7rem 1.35rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#FFF',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <MapPin size={17} /> Mark Arrived at Customer Location
                    </button>
                  )}

                  {(task.status === 'ARRIVED' || task.status === 'ARRIVED_AT_LOCATION' || task.status === 'PARTNER_ACCEPTED' || task.status === 'ACCEPTED' || task.status === 'PARTNER_ASSIGNED') && (
                    <button
                      onClick={() => handleStartWork(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.7rem 1.35rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        color: '#FFF',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      <Play size={17} /> Start Service Work
                    </button>
                  )}

                  {(task.status === 'WORK_STARTED' || task.status === 'IN_PROGRESS' || task.status === 'WORK_IN_PROGRESS') && (
                    <button
                      onClick={() => handleCompleteWork(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.7rem 1.35rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFF',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <CheckCircle size={17} /> Mark Work Completed
                    </button>
                  )}

                  {task.status === 'WORK_COMPLETED' && (
                    <button
                      onClick={() => handleRecordPayment(task.id)}
                      disabled={isActionBusy}
                      style={{
                        padding: '0.7rem 1.35rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #047857)',
                        color: '#FFF',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <DollarSign size={17} /> Collect Cash / Confirm Payment (₹{task.totalAmount || 0})
                    </button>
                  )}

                  {task.status === 'COMPLETED' && (
                    <span style={{ color: '#34D399', fontSize: '0.92rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <CheckCircle size={18} /> Task Fully Completed & Settled
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
