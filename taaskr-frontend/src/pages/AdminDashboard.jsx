import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import { sortBookingsByStatusPriority } from '../utils/sorting';
import AnalyticsDashboardTab from '../components/admin/AnalyticsDashboardTab';
import SystemObservabilityTab from '../components/admin/SystemObservabilityTab';
import Pagination from '../components/Pagination';
import { 
  BarChart3, Activity, Layers, Users, Briefcase, Plus, Trash2, 
  Edit2, Check, X, ShieldCheck, RefreshCw, DollarSign, Calendar, 
  MapPin, Truck, AlertCircle, Search, MessageSquare, Send, CheckCircle2, Clock, HelpCircle, FileText,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

export default function AdminDashboard() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sidebar Expand / Collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('taaskr_admin_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('taaskr_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Pagination states
  const [servicesPage, setServicesPage] = useState(1);
  const [providersPage, setProvidersPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [discussionsPage, setDiscussionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [disputesPage, setDisputesPage] = useState(1);
  const itemsPerPage = 8;

  // Tabs: 'analytics', 'observability', 'catalog', 'providers', 'providers_pending', 'providers_approved', 'bookings', 'users', 'discussions', 'payouts', 'disputes'
  const [activeTab, setActiveTab] = useState('analytics');

  // Payout processing modal state
  const [processingPayout, setProcessingPayout] = useState(null);
  const [payoutStatusDecision, setPayoutStatusDecision] = useState('COMPLETED');
  const [payoutTxRef, setPayoutTxRef] = useState('');
  const [payoutAdminNotes, setPayoutAdminNotes] = useState('');
  const [submittingPayoutProcess, setSubmittingPayoutProcess] = useState(false);

  // Dispute resolution modal state
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [disputeStatusDecision, setDisputeStatusDecision] = useState('RESOLVED');
  const [disputeResolutionNotes, setDisputeResolutionNotes] = useState('');
  const [submittingDisputeResolve, setSubmittingDisputeResolve] = useState(false);

  // Provider sub-tabs & remarks states
  const [providerSubTab, setProviderSubTab] = useState('pending');
  const [editingRemarksProviderId, setEditingRemarksProviderId] = useState(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);

  // Discussion states
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [discussionFilter, setDiscussionFilter] = useState('ALL');
  const [submittingAdminReply, setSubmittingAdminReply] = useState(false);

  const filteredDiscussions = discussions.filter(d => {
    if (discussionFilter === 'ALL') return true;
    return d.status === discussionFilter;
  });

  const activeDiscussion = discussions.find(d => d.id === selectedDiscussionId) 
    || (filteredDiscussions.length > 0 ? filteredDiscussions[0] : null);

  // Category CRUD states
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);

  // Service CRUD states
  const [srvName, setSrvName] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState('');
  const [srvDuration, setSrvDuration] = useState('');
  const [srvCatId, setSrvCatId] = useState('');
  const [editingSrvId, setEditingSrvId] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [cats, servs, usersList, providersList, bookingsList, discussionsList, payoutsList, disputesList] = await Promise.all([
        api.catalog.getCategories(),
        api.catalog.getServices(),
        api.admin.getUsers(),
        api.admin.getProviders(),
        api.admin.getAllBookings(),
        api.admin.getDiscussions(),
        api.payouts.getAdminPayouts().catch(() => []),
        api.disputes.getAllForAdmin().catch(() => [])
      ]);

      setCategories(cats || []);
      setServices(servs || []);
      setUsers(usersList || []);
      setProviders(providersList || []);
      setBookings(sortBookingsByStatusPriority(bookingsList || []));
      setDiscussions(discussionsList || []);
      setPayouts(payoutsList || []);
      setDisputes(disputesList || []);
      if (discussionsList && discussionsList.length > 0 && !selectedDiscussionId) {
        setSelectedDiscussionId(discussionsList[0].id);
      }
    } catch (err) {
      console.error('Failed to load admin console data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (e) => {
    e.preventDefault();
    if (!processingPayout) return;
    setSubmittingPayoutProcess(true);
    try {
      await api.payouts.processAdminPayout(
        processingPayout.id,
        payoutStatusDecision,
        payoutTxRef.trim(),
        payoutAdminNotes.trim()
      );
      setProcessingPayout(null);
      setPayoutTxRef('');
      setPayoutAdminNotes('');
      loadAdminData();
    } catch (err) {
      alert(`Failed to process payout: ${err.message}`);
    } finally {
      setSubmittingPayoutProcess(false);
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!resolvingDispute) return;
    setSubmittingDisputeResolve(true);
    try {
      await api.disputes.resolve(
        resolvingDispute.id,
        disputeStatusDecision,
        disputeResolutionNotes.trim()
      );
      setResolvingDispute(null);
      setDisputeResolutionNotes('');
      loadAdminData();
    } catch (err) {
      alert(`Failed to resolve dispute: ${err.message}`);
    } finally {
      setSubmittingDisputeResolve(false);
    }
  };

  const messagesContainerRef = useRef(null);

  const scrollToChatBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    document.body.classList.remove('theme-user', 'theme-provider');
    document.body.classList.add('theme-admin');
    loadAdminData();
    return () => {
      document.body.classList.remove('theme-admin');
    };
  }, []);

  // Live Auto-Poll Partner Discussions in Admin Panel every 3 seconds
  useEffect(() => {
    if (activeTab !== 'discussions') return;
    const pollInterval = setInterval(async () => {
      try {
        const discussionsList = await api.admin.getDiscussions();
        if (Array.isArray(discussionsList)) {
          setDiscussions(discussionsList);
        }
      } catch (e) {
        // silent background poll
      }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [activeTab]);

  // Scroll chat box when opening/selecting a discussion thread
  useEffect(() => {
    if (activeTab === 'discussions' && selectedDiscussionId) {
      const timer = setTimeout(scrollToChatBottom, 60);
      return () => clearTimeout(timer);
    }
  }, [selectedDiscussionId, activeTab]);

  // ----------------------------------------
  // CATEGORY OPERATIONS
  // ----------------------------------------
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    try {
      if (editingCatId) {
        await api.admin.updateCategory(editingCatId, { name: catName, description: catDesc });
      } else {
        await api.admin.createCategory({ name: catName, description: catDesc });
      }
      setCatName('');
      setCatDesc('');
      setEditingCatId(null);
      const cats = await api.catalog.getCategories();
      setCategories(cats);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
  };

  // ----------------------------------------
  // SERVICE OPERATIONS
  // ----------------------------------------
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!srvName || !srvPrice || !srvDuration || !srvCatId) {
      alert('Please fill in all service fields');
      return;
    }
    try {
      const data = {
        name: srvName,
        description: srvDesc,
        price: Number(srvPrice),
        durationMinutes: Number(srvDuration),
        categoryId: Number(srvCatId)
      };

      if (editingSrvId) {
        await api.admin.updateService(editingSrvId, data);
      } else {
        await api.admin.createService(data);
      }

      setSrvName('');
      setSrvDesc('');
      setSrvPrice('');
      setSrvDuration('');
      setSrvCatId('');
      setEditingSrvId(null);
      
      const servs = await api.catalog.getServices();
      setServices(servs);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditService = (srv) => {
    setEditingSrvId(srv.id);
    setSrvName(srv.name);
    setSrvDesc(srv.description || '');
    setSrvPrice(srv.price);
    setSrvDuration(srv.durationMinutes);
    setSrvCatId(srv.categoryId);
  };

  const handleDeleteService = async (srvId) => {
    if (!window.confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await api.admin.deleteService(srvId);
      const servs = await api.catalog.getServices();
      setServices(servs);
    } catch (err) {
      alert(err.message);
    }
  };

  // ----------------------------------------
  // PARTNER DESK / DISCUSSION OPERATIONS
  // ----------------------------------------
  const handleAdminSendReply = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const text = adminReplyText.trim();
    if (!text || !selectedDiscussionId || submittingAdminReply) return;
    setSubmittingAdminReply(true);
    setAdminReplyText('');
    try {
      const updated = await api.admin.replyDiscussion(selectedDiscussionId, text);
      setDiscussions(prev => prev.map(d => d.id === updated.id ? updated : d));
      setTimeout(scrollToChatBottom, 60);
    } catch (err) {
      alert(err.message || 'Failed to send reply to provider');
    } finally {
      setSubmittingAdminReply(false);
    }
  };

  const handleUpdateDiscussionStatus = async (discussionId, status) => {
    try {
      const updated = await api.admin.updateDiscussionStatus(discussionId, status);
      setDiscussions(prev => prev.map(d => d.id === updated.id ? updated : d));
    } catch (err) {
      alert(err.message || 'Failed to update discussion status');
    }
  };

  const handleApproveProvider = async (providerId) => {
    try {
      await api.admin.approveProvider(providerId);
      const providersList = await api.admin.getProviders();
      setProviders(providersList);
    } catch (err) {
      alert(err.message || 'Failed to approve partner');
    }
  };

  const handleSaveRemarks = async (providerId) => {
    setSavingRemarks(true);
    try {
      const updated = await api.admin.updateProviderRemarks(providerId, remarksInput.trim());
      setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingRemarksProviderId(null);
      setRemarksInput('');
    } catch (err) {
      alert(err.message || 'Failed to save remarks');
    } finally {
      setSavingRemarks(false);
    }
  };

  if (loading) {
    return (
      <div className="enterprise-layout admin-theme">
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

  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((acc, curr) => acc + (Number(curr.finalAmount) || 0), 0);

  const pendingProviders = providers.filter(p => !p.approved);
  const approvedProviders = providers.filter(p => p.approved);

  return (
    <div className="enterprise-layout admin-theme animate-fade-in">
      {/* Enterprise Sidebar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <ShieldCheck size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.1, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  Admin Console
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Operations & Governance</span>
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
            onClick={() => setActiveTab('analytics')}
            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
            title="Analytics"
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </button>

          <button 
            onClick={() => setActiveTab('observability')}
            className={`sidebar-item ${activeTab === 'observability' ? 'active' : ''}`}
            title="Observability"
          >
            <Activity size={16} />
            <span>Observability</span>
          </button>

          <button 
            onClick={() => setActiveTab('discussions')}
            className={`sidebar-item ${activeTab === 'discussions' ? 'active' : ''}`}
            title="Partner Desk"
            style={{ position: 'relative' }}
          >
            <MessageSquare size={16} />
            <span>Partner Desk</span>
            {discussions.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length > 0 && (
              <span style={{ 
                marginLeft: 'auto', 
                background: 'var(--primary)', 
                color: '#fff', 
                fontSize: '0.68rem', 
                fontWeight: 700, 
                padding: '0.1rem 0.45rem', 
                borderRadius: '10px' 
              }}>
                {discussions.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('catalog')}
            className={`sidebar-item ${activeTab === 'catalog' ? 'active' : ''}`}
            title="Service Catalog"
          >
            <Layers size={16} />
            <span>Service Catalog</span>
          </button>

          {/* Pending Provider Approvals */}
          <button 
            onClick={() => { setActiveTab('providers_pending'); setProviderSubTab('pending'); setProvidersPage(1); }}
            className={`sidebar-item ${activeTab === 'providers_pending' || (activeTab === 'providers' && providerSubTab === 'pending') ? 'active' : ''}`}
            title="Pending Approvals"
          >
            <AlertCircle size={16} color={pendingProviders.length > 0 ? '#F59E0B' : 'currentColor'} />
            <span>Pending Approvals</span>
            {pendingProviders.length > 0 && (
              <span style={{ 
                marginLeft: 'auto', 
                background: 'rgba(245, 158, 11, 0.18)', 
                color: '#D97706', 
                fontSize: '0.68rem', 
                fontWeight: 700, 
                padding: '0.1rem 0.45rem', 
                borderRadius: '10px' 
              }}>
                {pendingProviders.length}
              </span>
            )}
          </button>

          {/* Approved Providers */}
          <button 
            onClick={() => { setActiveTab('providers_approved'); setProviderSubTab('approved'); setProvidersPage(1); }}
            className={`sidebar-item ${activeTab === 'providers_approved' || (activeTab === 'providers' && providerSubTab === 'approved') ? 'active' : ''}`}
            title="Approved Providers"
          >
            <Briefcase size={16} />
            <span>Approved Providers</span>
            <span style={{ 
              marginLeft: 'auto', 
              background: 'rgba(16, 185, 129, 0.15)', 
              color: '#10B981', 
              fontSize: '0.68rem', 
              fontWeight: 700, 
              padding: '0.1rem 0.45rem', 
              borderRadius: '10px' 
            }}>
              {approvedProviders.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('bookings')}
            className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`}
            title="All Bookings"
          >
            <Calendar size={16} />
            <span>All Bookings ({bookings.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('payouts')}
            className={`sidebar-item ${activeTab === 'payouts' ? 'active' : ''}`}
            title="Payout Settlements"
          >
            <DollarSign size={16} />
            <span>Payouts & Settlements</span>
            {payouts.filter(p => p.status === 'REQUESTED' || p.status === 'PROCESSING').length > 0 && (
              <span style={{ 
                marginLeft: 'auto', 
                background: 'rgba(245, 158, 11, 0.18)', 
                color: '#D97706', 
                fontSize: '0.68rem', 
                fontWeight: 700, 
                padding: '0.1rem 0.45rem', 
                borderRadius: '10px' 
              }}>
                {payouts.filter(p => p.status === 'REQUESTED' || p.status === 'PROCESSING').length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('disputes')}
            className={`sidebar-item ${activeTab === 'disputes' ? 'active' : ''}`}
            title="Customer Disputes"
          >
            <AlertCircle size={16} color={disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length > 0 ? '#EF4444' : 'currentColor'} />
            <span>Disputes & Issues</span>
            {disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length > 0 && (
              <span style={{ 
                marginLeft: 'auto', 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: '#EF4444', 
                fontSize: '0.68rem', 
                fontWeight: 700, 
                padding: '0.1rem 0.45rem', 
                borderRadius: '10px' 
              }}>
                {disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
            title="Users"
          >
            <Users size={16} />
            <span>Users ({users.length})</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="enterprise-main">
        <div className="enterprise-header">
          <div>
            <h1>Operations Console</h1>
            <p>Platform telemetry, catalog control, and provider verification.</p>
          </div>
          <button onClick={loadAdminData} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboardTab 
            categories={categories}
            providers={providers}
            bookings={bookings}
            users={users}
            totalRevenue={totalRevenue}
            onRefresh={loadAdminData}
          />
        )}

        {/* Tab: System Observability & Telemetry */}
        {activeTab === 'observability' && (
          <SystemObservabilityTab 
            totalBookings={bookings.length}
            totalProviders={providers.length}
            totalUsers={users.length}
          />
        )}

        {/* Tab: Partner Desk (Discussions & Support) */}
        {activeTab === 'discussions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem', height: 'calc(100vh - 160px)', minHeight: '600px' }}>
            {/* Left Column: Tickets & Filter List */}
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Partner Discussions</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{filteredDiscussions.length} threads</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED'].map(filter => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setDiscussionFilter(filter)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: discussionFilter === filter ? 'rgba(99, 102, 241, 0.6)' : 'var(--border-light)',
                        background: discussionFilter === filter ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'transparent',
                        color: discussionFilter === filter ? '#ffffff' : 'var(--text-muted)',
                        boxShadow: discussionFilter === filter ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {filter.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
                {filteredDiscussions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem' }}>No discussions found in this filter.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {filteredDiscussions.map(d => {
                      const isSelected = (activeDiscussion && activeDiscussion.id === d.id);
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDiscussionId(d.id)}
                          style={{
                            padding: '0.85rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                            boxShadow: isSelected ? '0 0 16px rgba(99, 102, 241, 0.18)' : 'none',
                            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ 
                              fontSize: '0.68rem', 
                              fontWeight: 700, 
                              padding: '0.15rem 0.5rem', 
                              borderRadius: '4px',
                              background: 'rgba(99, 102, 241, 0.18)', 
                              color: '#A78BFA',
                              border: '1px solid rgba(99, 102, 241, 0.35)',
                              letterSpacing: '0.02em'
                            }}>
                              {d.category ? d.category.replace('_', ' ') : 'GENERAL'}
                            </span>
                            <span className={`badge ${
                              d.status === 'RESOLVED' ? 'badge-completed' :
                              d.status === 'IN_REVIEW' ? 'badge-inprogress' :
                              d.status === 'CLOSED' ? 'badge-pending' : 'badge-accepted'
                            }`} style={{ fontSize: '0.65rem' }}>
                              {d.status}
                            </span>
                          </div>

                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.subject}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Provider: <strong style={{ color: 'var(--text-main)' }}>{d.providerName || `Partner #${d.providerId}`}</strong></span>
                            <span>{d.messages ? d.messages.length : 0} msgs</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Active Conversation & Reply Console */}
            {activeDiscussion ? (
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{activeDiscussion.subject}</h2>
                      <span className={`badge ${
                        activeDiscussion.status === 'RESOLVED' ? 'badge-completed' :
                        activeDiscussion.status === 'IN_REVIEW' ? 'badge-inprogress' :
                        activeDiscussion.status === 'CLOSED' ? 'badge-pending' : 'badge-accepted'
                      }`}>
                        {activeDiscussion.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Provider: <strong style={{ color: 'var(--text-main)' }}>{activeDiscussion.providerName || `Partner #${activeDiscussion.providerId}`}</strong> ({activeDiscussion.providerEmail || 'N/A'})</span>
                      {activeDiscussion.bookingId && <span>Booking Ref: <strong>#{activeDiscussion.bookingId}</strong></span>}
                      <span>Priority: <strong style={{ color: activeDiscussion.priority === 'URGENT' ? '#EF4444' : activeDiscussion.priority === 'HIGH' ? '#F59E0B' : 'var(--text-main)' }}>{activeDiscussion.priority}</strong></span>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {activeDiscussion.status !== 'IN_REVIEW' && (
                      <button 
                        onClick={() => handleUpdateDiscussionStatus(activeDiscussion.id, 'IN_REVIEW')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Mark In-Review
                      </button>
                    )}
                    {activeDiscussion.status !== 'RESOLVED' && (
                      <button 
                        onClick={() => handleUpdateDiscussionStatus(activeDiscussion.id, 'RESOLVED')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}
                      >
                        <CheckCircle2 size={13} />
                        Mark Resolved
                      </button>
                    )}
                    {activeDiscussion.status === 'RESOLVED' && (
                      <button 
                        onClick={() => handleUpdateDiscussionStatus(activeDiscussion.id, 'OPEN')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Reopen Ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Thread */}
                <div ref={messagesContainerRef} className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeDiscussion.messages && activeDiscussion.messages.map((msg, idx) => {
                    const isAdmin = msg.senderRole === 'ADMIN';
                    return (
                      <div 
                        key={msg.id || idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '80%',
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <strong style={{ color: isAdmin ? '#818CF8' : 'var(--text-main)' }}>
                            {isAdmin ? '🛡️ Admin Support' : `🛠️ ${msg.senderName || 'Provider'}`}
                          </strong>
                          <span>• {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{
                          padding: '0.85rem 1.15rem',
                          borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isAdmin ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'var(--bg-subtle)',
                          color: isAdmin ? '#ffffff' : 'var(--text-main)',
                          border: isAdmin ? 'none' : '1px solid var(--border-light)',
                          fontSize: '0.875rem',
                          lineHeight: '1.45',
                          whiteSpace: 'pre-wrap',
                          boxShadow: isAdmin ? '0 4px 14px rgba(99, 102, 241, 0.25)' : '0 2px 4px rgba(0,0,0,0.04)'
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Box */}
                <form onSubmit={handleAdminSendReply} style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', display: 'flex', gap: '0.75rem' }}>
                  <textarea
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAdminSendReply(e);
                      }
                    }}
                    placeholder="Type official support response to provider..."
                    rows={2}
                    className="form-control"
                    style={{ flex: 1, resize: 'none' }}
                  />
                  <button 
                    type="submit" 
                    disabled={submittingAdminReply || !adminReplyText.trim()}
                    className="btn btn-primary"
                    style={{ 
                      alignSelf: 'flex-end', 
                      height: '42px', 
                      padding: '0 1.35rem',
                      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                      fontWeight: 600
                    }}
                  >
                    <Send size={15} />
                    <span>{submittingAdminReply ? 'Sending...' : 'Reply'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <p>Select a discussion from the left pane to view messages.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Service Catalog Management */}
        {activeTab === 'catalog' && (
          <div>
            {/* Category Form & List */}
            <div className="panel" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem' }}>
                {editingCatId ? 'Edit Category' : 'Create Service Category'}
              </h3>
              <form onSubmit={handleSaveCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Category Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Electrical" 
                    value={catName} 
                    onChange={e => setCatName(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Wiring and repairs" 
                    value={catDesc} 
                    onChange={e => setCatDesc(e.target.value)} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    <Plus size={14} />
                    <span>{editingCatId ? 'Update Category' : 'Add Category'}</span>
                  </button>
                  {editingCatId && (
                    <button type="button" onClick={() => { setEditingCatId(null); setCatName(''); setCatDesc(''); }} className="btn btn-secondary">
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Categories Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    background: 'var(--bg-subtle)', 
                    border: '1px solid var(--border)',
                    fontSize: '0.8125rem'
                  }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{cat.name}</span>
                    <button 
                      type="button" 
                      onClick={() => handleEditCategory(cat)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Form & Table */}
            <div className="panel" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem' }}>
                {editingSrvId ? 'Edit Service' : 'Add New Service'}
              </h3>
              <form onSubmit={handleSaveService} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Service Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Fan Repair" 
                    value={srvName} 
                    onChange={e => setSrvName(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Category</label>
                  <select 
                    className="form-control" 
                    value={srvCatId} 
                    onChange={e => setsrvCatId(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Price (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 499" 
                    value={srvPrice} 
                    onChange={e => setSrvPrice(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Duration (Mins)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 60" 
                    value={srvDuration} 
                    onChange={e => setSrvDuration(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Service description" 
                    value={srvDesc} 
                    onChange={e => setsrvDesc(e.target.value)} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    <Plus size={14} />
                    <span>{editingSrvId ? 'Update' : 'Add'}</span>
                  </button>
                  {editingSrvId && (
                    <button type="button" onClick={() => { setEditingSrvId(null); setSrvName(''); setSrvDesc(''); setSrvPrice(''); setSrvDuration(''); setSrvCatId(''); }} className="btn btn-secondary">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Services Table */}
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.slice((servicesPage - 1) * itemsPerPage, servicesPage * itemsPerPage).map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</td>
                      <td>
                        <span className="badge badge-accepted">{s.categoryName || 'General'}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                        ₹{s.price}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.durationMinutes} mins</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            type="button" 
                            onClick={() => handleEditService(s)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.4rem' }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteService(s.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.4rem', color: 'var(--color-danger)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={servicesPage}
                totalItems={services.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setServicesPage}
              />
            </div>
          </div>
        )}

        {/* Tab: Providers Verification & Directory */}
        {(activeTab === 'providers' || activeTab === 'providers_pending' || activeTab === 'providers_approved') && (
          <div>
            {/* Sub-tab Pill Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => { setProviderSubTab('pending'); setActiveTab('providers_pending'); setProvidersPage(1); }}
                  style={{
                    padding: '0.45rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: providerSubTab === 'pending' ? 'var(--bg-card)' : 'transparent',
                    color: providerSubTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: providerSubTab === 'pending' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <AlertCircle size={14} color={providers.filter(p => !p.approved).length > 0 ? '#F59E0B' : 'currentColor'} />
                  <span>Pending Verification</span>
                  <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '10px',
                    background: providers.filter(p => !p.approved).length > 0 ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-subtle)',
                    color: providers.filter(p => !p.approved).length > 0 ? '#D97706' : 'var(--text-muted)',
                    fontWeight: 700
                  }}>
                    {providers.filter(p => !p.approved).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setProviderSubTab('approved'); setActiveTab('providers_approved'); setProvidersPage(1); }}
                  style={{
                    padding: '0.45rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: providerSubTab === 'approved' ? 'var(--bg-card)' : 'transparent',
                    color: providerSubTab === 'approved' ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: providerSubTab === 'approved' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <CheckCircle2 size={14} color="#10B981" />
                  <span>Approved Partners</span>
                  <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    fontWeight: 700
                  }}>
                    {providers.filter(p => p.approved).length}
                  </span>
                </button>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {providerSubTab === 'pending'
                  ? 'Set required actions/feedback for pending providers until they qualify for approval.'
                  : 'Active onboarded service professionals verified to claim and fulfill customer jobs.'}
              </div>
            </div>

            {/* PENDING PROVIDERS VIEW */}
            {providerSubTab === 'pending' && (
              <div>
                {providers.filter(p => !p.approved).length === 0 ? (
                  <div className="panel" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={40} color="#10B981" style={{ marginBottom: '0.75rem', opacity: 0.8 }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>All Caught Up!</h3>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>There are no providers currently waiting for verification approval.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {providers.filter(p => !p.approved).slice((providersPage - 1) * itemsPerPage, providersPage * itemsPerPage).map((p) => {
                      const isEditingThis = editingRemarksProviderId === p.id;
                      return (
                        <div key={p.id} className="panel" style={{ borderLeft: '4px solid #F59E0B' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{p.name}</h3>
                                <span className="badge badge-pending" style={{ fontSize: '0.68rem' }}>Pending Verification</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>#{p.id}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                <span>Email: <strong style={{ color: 'var(--text-main)' }}>{p.email}</strong> {p.emailVerified ? '✓' : '(unverified)'}</span>
                                <span>Phone: <strong style={{ color: 'var(--text-main)' }}>{p.phone || 'N/A'}</strong> {p.phoneVerified ? '✓' : '(unverified)'}</span>
                                <span>City: <strong style={{ color: 'var(--text-main)' }}>{p.city || 'N/A'}</strong> ({p.pincode || 'N/A'})</span>
                                <span>Experience: <strong style={{ color: 'var(--text-main)' }}>{p.experienceYears || 0} yrs</strong></span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                onClick={() => handleApproveProvider(p.id)}
                                className="btn btn-primary btn-sm"
                                style={{ background: '#10B981', borderColor: '#10B981' }}
                              >
                                <Check size={13} />
                                <span>Approve Partner</span>
                              </button>
                            </div>
                          </div>

                          {/* Action Requirements / Admin Remarks Box */}
                          <div style={{ 
                            background: 'var(--bg-subtle)', 
                            border: '1px solid var(--border)', 
                            borderRadius: 'var(--radius-sm)', 
                            padding: '0.85rem 1rem' 
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>📝 Required Action / Verification Feedback:</span>
                              </span>
                              {!isEditingThis && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRemarksProviderId(p.id);
                                    setRemarksInput(p.adminRemarks || '');
                                  }}
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', color: 'var(--primary)' }}
                                >
                                  <Edit2 size={12} />
                                  <span>{p.adminRemarks ? 'Edit Requirement' : '+ Add Requirement'}</span>
                                </button>
                              )}
                            </div>

                            {isEditingThis ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <textarea
                                  value={remarksInput}
                                  onChange={(e) => setRemarksInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      if (remarksInput.trim() && !savingRemarks) {
                                        handleSaveRemarks(p.id);
                                      }
                                    }
                                  }}
                                  placeholder="Specify what documents, photos, or details are required from this provider (e.g. Please upload ID proof and vehicle insurance)..."
                                  rows={2}
                                  className="form-control"
                                  style={{ width: '100%', fontSize: '0.8125rem' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRemarksProviderId(null);
                                      setRemarksInput('');
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingRemarks}
                                    onClick={() => handleSaveRemarks(p.id)}
                                    className="btn btn-primary btn-sm"
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    {savingRemarks ? 'Saving...' : 'Save Feedback'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p style={{ 
                                margin: 0, 
                                fontSize: '0.8125rem', 
                                color: p.adminRemarks ? 'var(--text-main)' : 'var(--text-muted)',
                                fontStyle: p.adminRemarks ? 'normal' : 'italic'
                              }}>
                                {p.adminRemarks || 'No feedback or pending requirements added yet. Click "+ Add Requirement" to notify the provider what is needed.'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <Pagination
                      currentPage={providersPage}
                      totalItems={providers.filter(p => !p.approved).length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setProvidersPage}
                    />
                  </div>
                )}
              </div>
            )}

            {/* APPROVED PROVIDERS VIEW */}
            {providerSubTab === 'approved' && (
              <div className="table-container">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Provider Name</th>
                      <th>Contact Info</th>
                      <th>Location</th>
                      <th>Rating</th>
                      <th>Completed Tasks</th>
                      <th>Status</th>
                      <th>Admin Feedback / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.filter(p => p.approved).slice((providersPage - 1) * itemsPerPage, providersPage * itemsPerPage).map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          <div>{p.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID #{p.id}</div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          <div>{p.email}</div>
                          <div style={{ fontSize: '0.75rem' }}>{p.phone || 'No phone'}</div>
                        </td>
                        <td>
                          <div>{p.city || 'N/A'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.pincode || ''}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          ★ {p.rating ? p.rating.toFixed(1) : 'New'}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.totalJobs || 0} jobs</td>
                        <td>
                          <span className="badge badge-completed">
                            Approved
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.adminRemarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  currentPage={providersPage}
                  totalItems={providers.filter(p => p.approved).length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setProvidersPage}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: PAYOUT SETTLEMENTS                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'payouts' && (
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title">
                <DollarSign size={18} color="var(--primary)" />
                <span>Provider Payouts & Settlement Requests</span>
              </h2>
              <span className="badge badge-assigned">{payouts.length} Total Requests</span>
            </div>

            {payouts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <DollarSign size={22} />
                </div>
                <h3 className="empty-state-title">No payout requests</h3>
                <p className="empty-state-description">When partners request earnings withdrawals, they will appear here for processing.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Provider Name</th>
                      <th>Amount</th>
                      <th>Requested Date</th>
                      <th>Status</th>
                      <th>Banking Notes / UTR</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.slice((payoutsPage - 1) * itemsPerPage, payoutsPage * itemsPerPage).map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                          #{String(p.id).slice(-6)}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          <div>{p.providerName || `Provider #${p.providerId}`}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.providerEmail || ''}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9375rem', fontFeatureSettings: 'tnum' }}>
                          ₹{p.amount?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td>
                          <span className={`badge ${p.status === 'COMPLETED' ? 'badge-completed' : p.status === 'REJECTED' ? 'badge-cancelled' : 'badge-pending'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                          {p.transactionReference ? (
                            <div><strong>UTR:</strong> {p.transactionReference}</div>
                          ) : null}
                          {p.notes ? <div>{p.notes}</div> : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {p.status === 'REQUESTED' || p.status === 'PROCESSING' ? (
                            <button
                              onClick={() => {
                                setProcessingPayout(p);
                                setPayoutStatusDecision('COMPLETED');
                                setPayoutTxRef('');
                                setPayoutAdminNotes('');
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                            >
                              Process Settlement
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Processed ({p.processedAt ? new Date(p.processedAt).toLocaleDateString() : 'Settled'})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  currentPage={payoutsPage}
                  totalItems={payouts.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setPayoutsPage}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: DISPUTES & ISSUES                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'disputes' && (
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title">
                <AlertCircle size={18} color="#EF4444" />
                <span>Customer Booking Disputes & Escalations</span>
              </h2>
              <span className="badge badge-cancelled">{disputes.length} Disputes</span>
            </div>

            {disputes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CheckCircle2 size={22} color="var(--success)" />
                </div>
                <h3 className="empty-state-title">No customer disputes</h3>
                <p className="empty-state-description">Zero unresolved customer complaints or service escalations at this time.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Dispute ID</th>
                      <th>Booking Ref</th>
                      <th>Customer</th>
                      <th>Provider</th>
                      <th>Reason Category</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.slice((disputesPage - 1) * itemsPerPage, disputesPage * itemsPerPage).map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#EF4444' }}>
                          #{String(d.id).slice(-6)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{d.serviceName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Booking #{d.bookingId}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                          <div>{d.customerName || 'Customer'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.customerEmail || ''}</div>
                        </td>
                        <td style={{ color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                          <div>{d.providerName || 'Provider'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.providerEmail || ''}</div>
                        </td>
                        <td>
                          <span className="badge badge-assigned" style={{ fontSize: '0.6875rem', textTransform: 'capitalize' }}>
                            {d.reason?.toLowerCase().replace(/_/g, ' ') || 'General'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-main)', maxWidth: '240px', lineHeight: 1.35 }}>
                          <div>"{d.description}"</div>
                          {d.resolutionNotes && (
                            <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--success)' }}>
                              <strong>Resolution:</strong> {d.resolutionNotes}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${d.status === 'RESOLVED' ? 'badge-completed' : d.status === 'DISMISSED' ? 'badge-cancelled' : 'badge-pending'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {d.status === 'OPEN' || d.status === 'UNDER_REVIEW' ? (
                            <button
                              onClick={() => {
                                setResolvingDispute(d);
                                setDisputeStatusDecision('RESOLVED');
                                setDisputeResolutionNotes('');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Resolve
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  currentPage={disputesPage}
                  totalItems={disputes.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setDisputesPage}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Process Payout */}
      {processingPayout && (
        <div className="modal-overlay" onClick={() => setProcessingPayout(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Process Provider Payout #{String(processingPayout.id).slice(-6)}
              </h3>
              <button onClick={() => setProcessingPayout(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Provider:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.8125rem' }}>{processingPayout.providerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Requested Amount:</span>
                <strong style={{ color: 'var(--success)', fontSize: '1rem' }}>₹{processingPayout.amount?.toLocaleString('en-IN')}</strong>
              </div>
              {processingPayout.notes && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <strong>Bank / UPI Info:</strong> {processingPayout.notes}
                </div>
              )}
            </div>

            <form onSubmit={handleProcessPayout}>
              <div className="form-group">
                <label className="form-label">Payout Action</label>
                <select className="form-control" value={payoutStatusDecision} onChange={(e) => setPayoutStatusDecision(e.target.value)}>
                  <option value="COMPLETED">Approve & Mark Transferred (COMPLETED)</option>
                  <option value="PROCESSING">Mark Processing in Bank</option>
                  <option value="REJECTED">Reject Payout Request</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Bank UTR / Transaction Reference</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. UTR123456789012 or IMPS ref"
                  value={payoutTxRef}
                  onChange={(e) => setPayoutTxRef(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Internal Admin Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional notes or rejection rationale"
                  value={payoutAdminNotes}
                  onChange={(e) => setPayoutAdminNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={submittingPayoutProcess}>
                  {submittingPayoutProcess ? 'Saving...' : 'Confirm Status'}
                </button>
                <button type="button" onClick={() => setProcessingPayout(null)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Dispute */}
      {resolvingDispute && (
        <div className="modal-overlay" onClick={() => setResolvingDispute(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Resolve Dispute #{String(resolvingDispute.id).slice(-6)}
              </h3>
              <button onClick={() => setResolvingDispute(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer: </span>
                <strong>{resolvingDispute.customerName}</strong> ({resolvingDispute.customerEmail})
              </div>
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Provider: </span>
                <strong>{resolvingDispute.providerName}</strong> ({resolvingDispute.providerEmail})
              </div>
              <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--text-main)' }}>
                "{resolvingDispute.description}"
              </div>
            </div>

            <form onSubmit={handleResolveDispute}>
              <div className="form-group">
                <label className="form-label">Resolution Status</label>
                <select className="form-control" value={disputeStatusDecision} onChange={(e) => setDisputeStatusDecision(e.target.value)}>
                  <option value="RESOLVED">Resolved (Action Taken)</option>
                  <option value="DISMISSED">Dismissed (No Action Required)</option>
                  <option value="UNDER_REVIEW">Keep Under Review</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Resolution Details / Notes *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Explain resolution, refund decision, or follow-up..."
                  value={disputeResolutionNotes}
                  onChange={(e) => setDisputeResolutionNotes(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={submittingDisputeResolve || !disputeResolutionNotes.trim()}>
                  {submittingDisputeResolve ? 'Saving...' : 'Submit Resolution'}
                </button>
                <button type="button" onClick={() => setResolvingDispute(null)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
