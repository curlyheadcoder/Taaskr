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
  const itemsPerPage = 10;

  // Tabs: 'analytics', 'observability', 'catalog', 'providers', 'providers_pending', 'providers_approved', 'bookings', 'users', 'discussions', 'payouts', 'disputes'
  const [activeTab, setActiveTab] = useState('analytics');

  // Notification Toast state
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Payout processing modal state
  const [processingPayout, setProcessingPayout] = useState(null);
  const [payoutStatusDecision, setPayoutStatusDecision] = useState('PROCESSED');
  const [payoutTxRef, setPayoutTxRef] = useState('');
  const [payoutAdminNotes, setPayoutAdminNotes] = useState('');
  const [submittingPayoutProcess, setSubmittingPayoutProcess] = useState(false);

  // Segmented tab inside Disputes & Issues: 'CUSTOMER' | 'PROVIDER'
  const [disputeTypeTab, setDisputeTypeTab] = useState('CUSTOMER');

  // Customer Dispute resolution states
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [selectedDisputeId, setSelectedDisputeId] = useState(null);
  const [disputeFilter, setDisputeFilter] = useState('ALL');
  const [disputeSearch, setDisputeSearch] = useState('');
  const [disputeStatusDecision, setDisputeStatusDecision] = useState('RESOLVED');
  const [disputeResolutionNotes, setDisputeResolutionNotes] = useState('');
  const [disputeRefundAmount, setDisputeRefundAmount] = useState('');
  const [submittingDisputeResolve, setSubmittingDisputeResolve] = useState(false);
  const [adminCustomerReplyText, setAdminCustomerReplyText] = useState('');
  const [submittingCustomerReply, setSubmittingCustomerReply] = useState(false);

  const filteredDisputes = disputes.filter(d => {
    if (disputeFilter !== 'ALL' && d.status !== disputeFilter) return false;
    if (disputeSearch.trim()) {
      const q = disputeSearch.toLowerCase();
      const matchId = String(d.id).includes(q);
      const matchBooking = String(d.bookingId || '').includes(q) || String(d.bookingCode || '').toLowerCase().includes(q) || String(d.serviceName || '').toLowerCase().includes(q);
      const matchCustomer = String(d.customerName || '').toLowerCase().includes(q) || String(d.customerEmail || '').toLowerCase().includes(q);
      const matchProvider = String(d.providerName || '').toLowerCase().includes(q) || String(d.providerEmail || '').toLowerCase().includes(q);
      const matchReason = String(d.reason || '').toLowerCase().includes(q);
      return matchId || matchBooking || matchCustomer || matchProvider || matchReason;
    }
    return true;
  });

  const activeDispute = disputes.find(d => d.id === selectedDisputeId) 
    || (filteredDisputes.length > 0 ? filteredDisputes[0] : null);

  // KYC Verification state
  const [kycDocuments, setKycDocuments] = useState([]);
  const [kycFilter, setKycFilter] = useState('ALL');
  const [kycPage, setKycPage] = useState(1);
  const [verifyingKycDoc, setVerifyingKycDoc] = useState(null);
  const [kycDecisionStatus, setKycDecisionStatus] = useState('VERIFIED');
  const [kycRejectionReason, setKycRejectionReason] = useState('');
  const [submittingKycVerify, setSubmittingKycVerify] = useState(false);

  // Provider sub-tabs & remarks states
  const [providerSubTab, setProviderSubTab] = useState('pending');
  const [editingRemarksProviderId, setEditingRemarksProviderId] = useState(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);

  // Provider Raised Tickets / Discussions states
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminProviderChatText, setAdminProviderChatText] = useState('');
  const [discussionFilter, setDiscussionFilter] = useState('ALL');
  const [providerTicketSearch, setProviderTicketSearch] = useState('');
  const [providerResolutionStatus, setProviderResolutionStatus] = useState('RESOLVED');
  const [submittingAdminReply, setSubmittingAdminReply] = useState(false);
  const [submittingProviderChat, setSubmittingProviderChat] = useState(false);

  const filteredDiscussions = discussions.filter(d => {
    if (discussionFilter !== 'ALL' && d.status !== discussionFilter) return false;
    if (providerTicketSearch.trim()) {
      const q = providerTicketSearch.toLowerCase();
      const matchId = String(d.id).includes(q);
      const matchSubject = String(d.subject || '').toLowerCase().includes(q);
      const matchProvider = String(d.providerName || '').toLowerCase().includes(q) || String(d.providerEmail || '').toLowerCase().includes(q);
      const matchCategory = String(d.category || '').toLowerCase().includes(q);
      const matchBooking = String(d.bookingId || '').includes(q);
      const matchMessages = Array.isArray(d.messages) && d.messages.some(m => String(m.message || '').toLowerCase().includes(q));
      return matchId || matchSubject || matchProvider || matchCategory || matchBooking || matchMessages;
    }
    return true;
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
      const [cats, servs, usersList, providersList, bookingsList, discussionsList, payoutsList, disputesList, kycDocs] = await Promise.all([
        api.catalog.getCategories(),
        api.catalog.getServices(),
        api.admin.getUsers(),
        api.admin.getProviders(),
        api.admin.getAllBookings(),
        api.admin.getDiscussions(),
        api.payouts.getAdminPayouts().catch(() => []),
        api.disputes.getAllForAdmin().catch(() => []),
        api.kyc.getAdminDocuments().catch(() => ({ content: [] }))
      ]);

      setCategories(cats || []);
      setServices(servs || []);
      setUsers(usersList || []);
      setProviders(providersList || []);
      setBookings(sortBookingsByStatusPriority(bookingsList || []));
      setDiscussions(discussionsList || []);
      setPayouts(payoutsList || []);
      setDisputes(disputesList || []);
      setKycDocuments((kycDocs && kycDocs.content) ? kycDocs.content : (Array.isArray(kycDocs) ? kycDocs : []));
      if (discussionsList && discussionsList.length > 0 && !selectedDiscussionId) {
        setSelectedDiscussionId(discussionsList[0].id);
      }
      if (disputesList && disputesList.length > 0 && !selectedDisputeId) {
        setSelectedDisputeId(disputesList[0].id);
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
      showNotification(`Payout #${processingPayout.id} updated to ${payoutStatusDecision} successfully.`);
      setProcessingPayout(null);
      setPayoutTxRef('');
      setPayoutAdminNotes('');
      loadAdminData();
    } catch (err) {
      showNotification(`Failed to process payout: ${err.message}`, 'error');
    } finally {
      setSubmittingPayoutProcess(false);
    }
  };

  const handleResolveDispute = async (e, disputeToResolve) => {
    if (e && e.preventDefault) e.preventDefault();
    const target = disputeToResolve || resolvingDispute || activeDispute;
    if (!target) return;
    setSubmittingDisputeResolve(true);
    try {
      await api.disputes.resolve(
        target.id,
        disputeStatusDecision,
        disputeResolutionNotes.trim(),
        disputeRefundAmount ? Number(disputeRefundAmount) : undefined
      );
      showNotification(`Dispute #${target.id} resolved as ${disputeStatusDecision}.`);
      setResolvingDispute(null);
      setDisputeResolutionNotes('');
      setDisputeRefundAmount('');
      loadAdminData();
    } catch (err) {
      showNotification(`Failed to resolve dispute: ${err.message}`, 'error');
    } finally {
      setSubmittingDisputeResolve(false);
    }
  };

  const handleSendCustomerReply = async (e, disputeToSend) => {
    if (e && e.preventDefault) e.preventDefault();
    const target = disputeToSend || activeDispute;
    if (!target || !adminCustomerReplyText.trim() || submittingCustomerReply) return;
    const text = adminCustomerReplyText.trim();
    setSubmittingCustomerReply(true);
    setAdminCustomerReplyText('');
    try {
      const updated = await api.disputes.reply(target.id, text);
      setDisputes(prev => prev.map(d => d.id === updated.id ? updated : d));
      setTimeout(scrollToChatBottom, 60);
    } catch (err) {
      showNotification(err.message || 'Failed to send reply to customer', 'error');
    } finally {
      setSubmittingCustomerReply(false);
    }
  };

  const handleQuickUpdateDisputeStatus = async (disputeId, newStatus) => {
    try {
      await api.disputes.resolve(
        disputeId,
        newStatus,
        `Status updated to ${newStatus} by Admin`
      );
      showNotification(`Dispute #${disputeId} status updated to ${newStatus}.`);
      loadAdminData();
    } catch (err) {
      showNotification(`Failed to update dispute status: ${err.message}`, 'error');
    }
  };

  const handleVerifyKycDocument = async (e) => {
    e.preventDefault();
    if (!verifyingKycDoc) return;
    if (kycDecisionStatus === 'REJECTED' && !kycRejectionReason.trim()) {
      showNotification('Rejection reason is required when rejecting a document.', 'error');
      return;
    }
    setSubmittingKycVerify(true);
    try {
      await api.kyc.verifyDocument(verifyingKycDoc.id, kycDecisionStatus, kycRejectionReason.trim());
      showNotification(`Document ${kycDecisionStatus === 'VERIFIED' ? 'verified' : 'rejected'} successfully.`);
      setVerifyingKycDoc(null);
      setKycRejectionReason('');
      loadAdminData();
    } catch (err) {
      showNotification(`Failed to verify KYC document: ${err.message}`, 'error');
    } finally {
      setSubmittingKycVerify(false);
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

    const handleSwitchTab = (e) => {
      if (!e.detail) return;
      if (typeof e.detail === 'string') {
        setActiveTab(e.detail);
      } else if (typeof e.detail === 'object') {
        if (e.detail.tab) setActiveTab(e.detail.tab);
        if (e.detail.disputeType) setDisputeTypeTab(e.detail.disputeType);
        if (e.detail.disputeId) setSelectedDisputeId(Number(e.detail.disputeId));
        if (e.detail.discussionId) setSelectedDiscussionId(Number(e.detail.discussionId));
      }
    };
    window.addEventListener('switch-admin-tab', handleSwitchTab);

    return () => {
      window.removeEventListener('switch-admin-tab', handleSwitchTab);
      document.body.classList.remove('theme-admin');
    };
  }, []);

  // Live Auto-Poll Disputes & Partner Discussions in Admin Panel every 2.5 seconds without page refresh
  useEffect(() => {
    if (activeTab !== 'discussions' && activeTab !== 'disputes') return;
    const pollInterval = setInterval(async () => {
      try {
        if (activeTab === 'disputes') {
          if (disputeTypeTab === 'CUSTOMER') {
            const disputesList = await api.disputes.getAllForAdmin();
            if (Array.isArray(disputesList)) {
              setDisputes(disputesList);
            }
          } else if (disputeTypeTab === 'PROVIDER') {
            const discussionsList = await api.admin.getDiscussions();
            if (Array.isArray(discussionsList)) {
              setDiscussions(discussionsList);
            }
          }
        } else if (activeTab === 'discussions') {
          const discussionsList = await api.admin.getDiscussions();
          if (Array.isArray(discussionsList)) {
            setDiscussions(discussionsList);
          }
        }
      } catch (e) {
        // silent background poll
      }
    }, 2500);
    return () => clearInterval(pollInterval);
  }, [activeTab, disputeTypeTab]);

  // Scroll chat box when opening/selecting a discussion or dispute thread
  useEffect(() => {
    if ((activeTab === 'discussions' || activeTab === 'disputes') && (selectedDiscussionId || selectedDisputeId)) {
      const timer = setTimeout(scrollToChatBottom, 60);
      return () => clearTimeout(timer);
    }
  }, [selectedDiscussionId, selectedDisputeId, activeTab, disputeTypeTab]);

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
  const handleSendProviderChat = async (e, customTargetId) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetId = customTargetId || selectedDiscussionId || activeDiscussion?.id;
    if (!targetId || !adminProviderChatText.trim() || submittingProviderChat) return;
    const text = adminProviderChatText.trim();
    setSubmittingProviderChat(true);
    setAdminProviderChatText('');
    try {
      const updated = await api.admin.replyDiscussion(targetId, text);
      setDiscussions(prev => prev.map(d => d.id === updated.id ? updated : d));
      setTimeout(scrollToChatBottom, 60);
    } catch (err) {
      alert(err.message || 'Failed to send message to provider');
    } finally {
      setSubmittingProviderChat(false);
    }
  };

  const handleAdminSendReply = async (e, customTargetId, customText) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetId = customTargetId || selectedDiscussionId;
    const text = (customText !== undefined ? customText : adminReplyText).trim();
    if (!text || !targetId || submittingAdminReply) return;
    setSubmittingAdminReply(true);
    setAdminReplyText('');
    try {
      const updated = await api.admin.replyDiscussion(targetId, text);
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

  const handleResolveProviderTicket = async (e, ticket) => {
    if (e && e.preventDefault) e.preventDefault();
    const target = ticket || activeDiscussion;
    if (!target) return;
    const text = adminReplyText.trim();
    if (!text && target.status === providerResolutionStatus) {
      alert('Please enter a response note/finding or select a new status.');
      return;
    }
    setSubmittingAdminReply(true);
    try {
      let updatedTicket = target;
      if (text) {
        updatedTicket = await api.admin.replyDiscussion(target.id, text);
      }
      if (providerResolutionStatus && providerResolutionStatus !== target.status) {
        updatedTicket = await api.admin.updateDiscussionStatus(target.id, providerResolutionStatus);
      }
      setDiscussions(prev => prev.map(d => d.id === updatedTicket.id ? updatedTicket : d));
      setAdminReplyText('');
      setTimeout(scrollToChatBottom, 60);
    } catch (err) {
      alert(err.message || 'Failed to process provider ticket resolution');
    } finally {
      setSubmittingAdminReply(false);
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
      {/* Floating Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          color: '#ffffff',
          border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#10b981'}`,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(12px)',
          fontSize: '0.875rem',
          fontWeight: 500,
          maxWidth: '440px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: notification.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: notification.type === 'error' ? '#ef4444' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          </div>
          <div style={{ flex: 1, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: notification.type === 'error' ? '#ef4444' : '#10b981' }}>
              {notification.type === 'error' ? 'Action Notice' : 'Success'}
            </div>
            <div style={{ color: '#f8fafc', fontSize: '0.8125rem', marginTop: '1px' }}>
              {notification.message}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

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
                backgroundColor: 'rgba(139, 92, 246, 0.16)', color: '#8B5CF6', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <ShieldCheck size={18} color="#8B5CF6" />
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

          {/* Help Desk (Customer & Provider Tickets) */}
          <button 
            onClick={() => { setActiveTab('disputes'); }}
            className={`sidebar-item ${activeTab === 'disputes' ? 'active' : ''}`}
            title="Help Desk"
          >
            <HelpCircle size={16} color={(disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length + discussions.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length) > 0 ? '#EF4444' : 'currentColor'} />
            <span>Help Desk</span>
            {(disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length + discussions.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length) > 0 && (
              <span style={{ 
                marginLeft: 'auto', 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: '#EF4444', 
                fontSize: '0.68rem', 
                fontWeight: 700, 
                padding: '0.1rem 0.45rem', 
                borderRadius: '10px' 
              }}>
                {disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length + discussions.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length}
              </span>
            )}
          </button>

          {/* KYC Document Verifications */}
          <button 
            onClick={() => { setActiveTab('kyc'); setKycPage(1); }}
            className={`sidebar-item ${activeTab === 'kyc' ? 'active' : ''}`}
            title="KYC Verifications"
          >
            <ShieldCheck size={16} color={kycDocuments.filter(d => d.status === 'PENDING').length > 0 ? '#F59E0B' : 'currentColor'} />
            <span>KYC Verifications</span>
            {kycDocuments.filter(d => d.status === 'PENDING').length > 0 && (
              <span style={{ 
                marginLeft: 'auto', 
                background: 'rgba(245, 158, 11, 0.18)', 
                color: '#D97706', 
                fontSize: '0.68rem', 
                fontWeight: 700, 
                padding: '0.1rem 0.45rem', 
                borderRadius: '10px' 
              }}>
                {kycDocuments.filter(d => d.status === 'PENDING').length}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <h1 style={{ margin: 0 }}>Operations Console</h1>
              <span className="glow-pill" style={{ background: 'rgba(139, 92, 246, 0.16)', color: '#A78BFA', borderColor: 'rgba(139, 92, 246, 0.45)' }}>
                <span className="status-pulse-dot" style={{ backgroundColor: '#8B5CF6', boxShadow: '0 0 8px #8B5CF6' }} />
                COMMAND ROOM
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0' }}>Platform telemetry, catalog governance, and provider arbitration.</p>
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
                          <span className={`badge ${p.status === 'COMPLETED' || p.status === 'PROCESSED' ? 'badge-completed' : p.status === 'REJECTED' ? 'badge-cancelled' : 'badge-pending'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                          {p.transactionReference ? (
                            <div style={{ color: 'var(--text-main)' }}><strong>UTR:</strong> {p.transactionReference}</div>
                          ) : null}
                          {p.upiId && <div><strong>UPI:</strong> <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{p.upiId}</span></div>}
                          {p.bankAccountNumber && (
                            <div>
                              <strong>A/C:</strong> {p.bankAccountNumber}
                              {p.bankIfsc ? <span style={{ fontFamily: 'var(--font-mono)', marginLeft: '4px' }}>({p.bankIfsc})</span> : null}
                              {p.bankName ? ` - ${p.bankName}` : ''}
                            </div>
                          )}
                          {p.notes && !p.upiId && !p.bankAccountNumber ? <div>{p.notes}</div> : null}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {p.status === 'REQUESTED' || p.status === 'APPROVED' || p.status === 'PROCESSING' ? (
                            <button
                              onClick={() => {
                                setProcessingPayout(p);
                                setPayoutStatusDecision('PROCESSED');
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
        {/* TAB: DISPUTES & ESCALATIONS SPLIT CONSOLE (CUSTOMER & PROVIDER TICKETS)   */}
        {/* ========================================================================= */}
        {activeTab === 'disputes' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Top Segmented Tab Switcher: Customer vs Provider Raised Tickets */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: 'var(--bg-card)',
              padding: '0.65rem 0.85rem',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setDisputeTypeTab('CUSTOMER')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: disputeTypeTab === 'CUSTOMER' ? 'var(--primary)' : 'transparent',
                    background: disputeTypeTab === 'CUSTOMER' ? 'var(--primary-subtle)' : 'transparent',
                    color: disputeTypeTab === 'CUSTOMER' ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <AlertCircle size={15} color={disputeTypeTab === 'CUSTOMER' ? 'var(--primary)' : 'currentColor'} />
                  <span>👤 Customer Raised Tickets</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    background: disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-subtle)',
                    color: disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length > 0 ? '#EF4444' : 'var(--text-muted)',
                    fontWeight: 700
                  }}>
                    {disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length} Open ({disputes.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDisputeTypeTab('PROVIDER')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: disputeTypeTab === 'PROVIDER' ? '#6366F1' : 'transparent',
                    background: disputeTypeTab === 'PROVIDER' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    color: disputeTypeTab === 'PROVIDER' ? '#6366F1' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <MessageSquare size={15} color={disputeTypeTab === 'PROVIDER' ? '#6366F1' : 'currentColor'} />
                  <span>🛠️ Provider Raised Tickets</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    background: discussions.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length > 0 ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-subtle)',
                    color: discussions.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length > 0 ? '#6366F1' : 'var(--text-muted)',
                    fontWeight: 700
                  }}>
                    {discussions.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length} Open ({discussions.length})
                  </span>
                </button>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Active Queue: <strong style={{ color: 'var(--text-main)' }}>{disputeTypeTab === 'CUSTOMER' ? 'Customer Booking Complaints' : 'Service Partner Inquiries & Grievances'}</strong>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* VIEW 1: CUSTOMER RAISED TICKETS CONSOLE                      */}
            {/* ------------------------------------------------------------- */}
            {disputeTypeTab === 'CUSTOMER' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Header & Metrics Strip */}
                <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={22} color="#EF4444" />
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                        Customer Booking Disputes & Escalations Console
                      </h2>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0.35rem 0 0 0' }}>
                      Review reported customer complaints, investigate service discrepancies, issue resolution rulings, and authorize refunds.
                    </p>
                  </div>

                  {/* Status Filter Chips */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {[
                      { key: 'ALL', label: `All (${disputes.length})` },
                      { key: 'OPEN', label: `Open (${disputes.filter(d => d.status === 'OPEN').length})` },
                      { key: 'UNDER_REVIEW', label: `In-Review (${disputes.filter(d => d.status === 'UNDER_REVIEW').length})` },
                      { key: 'RESOLVED', label: `Resolved (${disputes.filter(d => d.status === 'RESOLVED').length})` },
                      { key: 'DISMISSED', label: `Dismissed (${disputes.filter(d => d.status === 'DISMISSED').length})` }
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => { setDisputeFilter(f.key); setDisputesPage(1); }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: disputeFilter === f.key ? 'var(--primary)' : 'var(--border-light)',
                          background: disputeFilter === f.key ? 'var(--primary-subtle)' : 'transparent',
                          color: disputeFilter === f.key ? 'var(--primary)' : 'var(--text-muted)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main 2-Column Split Console */}
                {disputes.length === 0 ? (
                  <div className="panel empty-state" style={{ padding: '3.5rem 1.5rem' }}>
                    <div className="empty-state-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                      <CheckCircle2 size={32} color="var(--success)" />
                    </div>
                    <h3 className="empty-state-title">No customer disputes</h3>
                    <p className="empty-state-description">Zero unresolved customer complaints or service escalations at this time.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem', alignItems: 'flex-start' }}>
                    {/* Left Column: Filterable Dispute Cards List */}
                    <div className="panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '760px' }}>
                      {/* Search bar */}
                      <div style={{ position: 'relative' }}>
                        <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          placeholder="Search tickets, bookings, names..."
                          value={disputeSearch}
                          onChange={(e) => setDisputeSearch(e.target.value)}
                          className="form-control"
                          style={{ paddingLeft: '2rem', fontSize: '0.8125rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span>Showing {filteredDisputes.length} tickets</span>
                        <span>{disputeFilter !== 'ALL' ? `Filter: ${disputeFilter}` : 'All Statuses'}</span>
                      </div>

                      {/* Scrollable list */}
                      <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', overflowY: 'auto', maxHeight: '640px', paddingRight: '0.35rem' }}>
                        {filteredDisputes.map((disp) => {
                          const isSelected = (selectedDisputeId || disputes[0]?.id) === disp.id;
                          let statusBadgeClass = 'badge-pending';
                          if (disp.status === 'RESOLVED') statusBadgeClass = 'badge-completed';
                          else if (disp.status === 'UNDER_REVIEW') statusBadgeClass = 'badge-assigned';
                          else if (disp.status === 'DISMISSED') statusBadgeClass = 'badge-cancelled';

                          return (
                            <div
                              key={disp.id}
                              onClick={() => {
                                setSelectedDisputeId(disp.id);
                                setDisputeStatusDecision(disp.status === 'OPEN' ? 'RESOLVED' : disp.status);
                                setDisputeResolutionNotes(disp.resolution || '');
                                setDisputeRefundAmount(disp.refundAmount ? String(disp.refundAmount) : '');
                              }}
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
                                <strong style={{ fontSize: '0.82rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)', lineHeight: 1.25 }}>
                                  Ticket #{String(disp.id).slice(-6)}
                                </strong>
                                <span className={`badge ${statusBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', flexShrink: 0 }}>
                                  {disp.status}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                <span style={{ color: '#EF4444', fontWeight: 600 }}>
                                  {disp.reason?.replace(/_/g, ' ') || 'General Issue'}
                                </span>
                                <span>• Booking #{disp.bookingCode || disp.bookingId}</span>
                              </div>

                              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                <strong>Customer:</strong> {disp.customerName || 'Customer'}
                                {disp.providerName && <span style={{ color: 'var(--text-muted)' }}> | <strong>Partner:</strong> {disp.providerName}</span>}
                              </div>

                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                "{disp.description}"
                              </p>

                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                {disp.createdAt ? new Date(disp.createdAt).toLocaleDateString() : 'Recent'}
                              </div>
                            </div>
                          );
                        })}

                        {filteredDisputes.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                            No customer tickets matching current filters.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Active Customer Dispute Resolution Console */}
                    {(() => {
                      const disp = activeDispute;
                      if (!disp) {
                        return (
                          <div className="panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Select a customer dispute ticket from the left pane to view details and issue resolution.
                          </div>
                        );
                      }

                      let statusBadgeClass = 'badge-pending';
                      if (disp.status === 'RESOLVED') statusBadgeClass = 'badge-completed';
                      else if (disp.status === 'UNDER_REVIEW') statusBadgeClass = 'badge-assigned';
                      else if (disp.status === 'DISMISSED') statusBadgeClass = 'badge-cancelled';

                      return (
                        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
                          {/* Ticket Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                                  Dispute Resolution Console #{String(disp.id).slice(-6)}
                                </h3>
                                <span className={`badge ${statusBadgeClass}`}>
                                  {disp.status}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Filed on: {disp.createdAt ? new Date(disp.createdAt).toLocaleString() : 'Recent'}
                              </span>
                            </div>

                            {/* Quick Status Pill Actions */}
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {disp.status === 'OPEN' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickUpdateDisputeStatus(disp.id, 'UNDER_REVIEW')}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                >
                                  ⏳ Mark In-Review
                                </button>
                              )}
                              {disp.status !== 'RESOLVED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDisputeStatusDecision('RESOLVED');
                                    if (!disputeResolutionNotes.trim()) {
                                      setDisputeResolutionNotes('Resolved to customer and provider satisfaction after review.');
                                    }
                                  }}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#10B981', borderColor: '#10B981' }}
                                >
                                  ✓ Set Resolved
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Party Intelligence & Booking Info Cards */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                👤 CUSTOMER DETAILS
                              </span>
                              <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem', display: 'block' }}>{disp.customerName || 'Customer'}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>{disp.customerEmail || 'No email registered'}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>User ID: #{disp.userId || 'N/A'}</span>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                🛠️ SERVICE PARTNER
                              </span>
                              <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem', display: 'block' }}>{disp.providerName || 'Provider Unassigned'}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>{disp.providerEmail || ''}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Provider ID: #{disp.providerId || 'N/A'}</span>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                📋 BOOKING CONTEXT
                              </span>
                              <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', display: 'block' }}>
                                #{disp.bookingCode || disp.bookingId}
                              </strong>
                              <span style={{ color: 'var(--text-main)', fontSize: '0.78rem', display: 'block' }}>{disp.serviceName || 'On-Demand Service'}</span>
                              <span className="badge badge-assigned" style={{ fontSize: '0.68rem', marginTop: '0.2rem' }}>
                                {disp.reason?.replace(/_/g, ' ') || 'General Issue'}
                              </span>
                            </div>
                          </div>

                          {/* Interactive Conversation Timeline Thread */}
                          <div>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                              Communication & Dispute Thread
                            </h4>
                            {(() => {
                              const rawDesc = disp.description || '';
                              const conversationList = [];
                              const parts = rawDesc.split(/\n\n(?=\[(?:Customer|Admin Support)[^\]]*\]:)/);
                              
                              parts.forEach((p, index) => {
                                const trimmed = p.trim();
                                if (!trimmed) return;
                                const match = trimmed.match(/^\[(Customer|Admin Support)(?:\s*-\s*([^\]]+))?\]:\s*([\s\S]*)$/);
                                if (match) {
                                  const role = match[1] === 'Admin Support' ? 'ADMIN' : 'USER';
                                  const timeStr = match[2] || (disp.createdAt ? new Date(disp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent');
                                  conversationList.push({
                                    id: `desc-${index}`,
                                    senderRole: role,
                                    senderName: role === 'ADMIN' ? '🛡️ Admin Support' : `👤 ${disp.customerName || 'Customer'}`,
                                    message: match[3],
                                    timestamp: timeStr
                                  });
                                } else {
                                  conversationList.push({
                                    id: `initial-${index}`,
                                    senderRole: 'USER',
                                    senderName: `👤 ${disp.customerName || 'Customer'} (Initial Stated Complaint)`,
                                    message: trimmed,
                                    timestamp: disp.createdAt ? new Date(disp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'
                                  });
                                }
                              });

                              if (disp.resolution) {
                                conversationList.push({
                                  id: 'resolution-ruling',
                                  senderRole: 'ADMIN',
                                  senderName: `🛡️ ${disp.resolvedBy || 'Admin Support'} (Official Ruling)`,
                                  message: disp.resolution,
                                  timestamp: disp.updatedAt ? new Date(disp.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
                                  isRuling: true
                                });
                              }

                              return (
                                <div
                                  ref={messagesContainerRef}
                                  className="custom-scrollbar"
                                  style={{
                                    maxHeight: '320px',
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
                                    const isAdmin = msg.senderRole === 'ADMIN';
                                    const isRuling = msg.isRuling;

                                    return (
                                      <div
                                        key={msg.id || idx}
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: isAdmin ? 'flex-end' : 'flex-start',
                                          maxWidth: '85%',
                                          alignSelf: isAdmin ? 'flex-end' : 'flex-start'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                          <strong style={{ color: isAdmin ? (isRuling ? '#10B981' : '#818CF8') : 'var(--text-main)' }}>
                                            {msg.senderName}
                                          </strong>
                                          <span>• {msg.timestamp}</span>
                                        </div>
                                        <div style={{
                                          padding: '0.75rem 1rem',
                                          borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                          background: isAdmin 
                                            ? (isRuling ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, var(--primary) 0%, #1D4ED8 100%)')
                                            : 'var(--bg-card)',
                                          color: isAdmin ? '#ffffff' : 'var(--text-main)',
                                          border: isAdmin ? 'none' : '1px solid var(--border-light)',
                                          fontSize: '0.84rem',
                                          lineHeight: 1.45,
                                          whiteSpace: 'pre-wrap',
                                          boxShadow: isAdmin ? '0 2px 8px rgba(37, 99, 235, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)'
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

                          {/* Conversational Reply Input for Ongoing Discussion */}
                          {disp.status !== 'DISMISSED' && (
                            <form onSubmit={(e) => handleSendCustomerReply(e, disp)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginTop: '0.25rem' }}>
                              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                                <textarea
                                  className="form-control"
                                  rows={2}
                                  placeholder="Type a message or response to customer in this thread..."
                                  value={adminCustomerReplyText}
                                  onChange={(e) => setAdminCustomerReplyText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      if (!submittingCustomerReply && adminCustomerReplyText.trim()) {
                                        handleSendCustomerReply(e, disp);
                                      }
                                    }
                                  }}
                                  style={{ resize: 'none', fontSize: '0.84rem' }}
                                />
                              </div>
                              <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submittingCustomerReply || !adminCustomerReplyText.trim()}
                                style={{ padding: '0.65rem 1.25rem', height: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                              >
                                <Send size={15} />
                                <span>{submittingCustomerReply ? 'Sending...' : 'Send Message'}</span>
                              </button>
                            </form>
                          )}

                          {/* Resolution Submission Console Form */}
                          <form onSubmit={(e) => handleResolveDispute(e, disp)} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <ShieldCheck size={16} color="var(--primary)" />
                              <span>Issue Resolution Ruling & Actions</span>
                            </h4>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Decision Status *</label>
                                <select
                                  className="form-control"
                                  value={disputeStatusDecision}
                                  onChange={(e) => setDisputeStatusDecision(e.target.value)}
                                >
                                  <option value="RESOLVED">RESOLVED (Action Taken / Solved)</option>
                                  <option value="DISMISSED">DISMISSED (Complaint Invalid / Outside Terms)</option>
                                  <option value="UNDER_REVIEW">UNDER REVIEW (Investigation In-Flight)</option>
                                  <option value="OPEN">OPEN (Re-Opened for Audit)</option>
                                </select>
                              </div>

                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Refund Amount (₹ INR - Optional)</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="e.g. 499 or 0"
                                  value={disputeRefundAmount}
                                  onChange={(e) => setDisputeRefundAmount(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Quick Presets Chips */}
                            <div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                ⚡ One-Click Resolution Templates:
                              </span>
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {[
                                  'Full refund approved and issued to customer original payment method.',
                                  'Service revisited and completed to customer satisfaction.',
                                  'Provider counselled on service standards; partial refund credited.',
                                  'Claim investigated; no breach of service terms found. Ticket closed.'
                                ].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setDisputeResolutionNotes(preset)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', border: '1px solid var(--border-subtle)' }}
                                  >
                                    {preset.slice(0, 42)}...
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label">Official Resolution Details & Findings *</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                placeholder="State the resolution reason, refund decision, or follow-up notes for customer and provider..."
                                value={disputeResolutionNotes}
                                onChange={(e) => setDisputeResolutionNotes(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!submittingDisputeResolve && disputeResolutionNotes.trim()) {
                                      handleResolveDispute(e, disp);
                                    }
                                  }
                                }}
                                required
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                              <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submittingDisputeResolve || !disputeResolutionNotes.trim()}
                                style={{ padding: '0.5rem 1.5rem', fontWeight: 600 }}
                              >
                                {submittingDisputeResolve ? 'Processing...' : 'Submit Dispute Ruling & Send Reply'}
                              </button>
                            </div>
                          </form>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW 2: PROVIDER RAISED TICKETS & GRIEVANCE CONSOLE          */}
            {/* ------------------------------------------------------------- */}
            {disputeTypeTab === 'PROVIDER' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Header & Metrics Strip */}
                <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MessageSquare size={22} color="#6366F1" />
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                        Provider Disputes & Grievance Resolution Console
                      </h2>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0.35rem 0 0 0' }}>
                      Review service partner grievances, rate/payment queries, booking penalties, and communicate in real-time.
                    </p>
                  </div>

                  {/* Status Filter Chips */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {[
                      { key: 'ALL', label: `All (${discussions.length})` },
                      { key: 'OPEN', label: `Open (${discussions.filter(d => d.status === 'OPEN').length})` },
                      { key: 'IN_REVIEW', label: `In-Review (${discussions.filter(d => d.status === 'IN_REVIEW').length})` },
                      { key: 'RESOLVED', label: `Resolved (${discussions.filter(d => d.status === 'RESOLVED').length})` },
                      { key: 'CLOSED', label: `Closed (${discussions.filter(d => d.status === 'CLOSED').length})` }
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => { setDiscussionFilter(f.key); }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: discussionFilter === f.key ? '#6366F1' : 'var(--border-light)',
                          background: discussionFilter === f.key ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          color: discussionFilter === f.key ? '#6366F1' : 'var(--text-muted)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main 2-Column Split Console */}
                {discussions.length === 0 ? (
                  <div className="panel empty-state" style={{ padding: '3.5rem 1.5rem' }}>
                    <div className="empty-state-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                      <CheckCircle2 size={32} color="#6366F1" />
                    </div>
                    <h3 className="empty-state-title">No partner tickets</h3>
                    <p className="empty-state-description">Zero unresolved provider grievances or support inquiries at this time.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem', alignItems: 'flex-start' }}>
                    {/* Left Column: Filterable Provider Tickets Cards List */}
                    <div className="panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '760px' }}>
                      {/* Search bar */}
                      <div style={{ position: 'relative' }}>
                        <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          placeholder="Search tickets, subjects, partners, bookings..."
                          value={providerTicketSearch}
                          onChange={(e) => setProviderTicketSearch(e.target.value)}
                          className="form-control"
                          style={{ paddingLeft: '2rem', fontSize: '0.8125rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span>Showing {filteredDiscussions.length} tickets</span>
                        <span>{discussionFilter !== 'ALL' ? `Filter: ${discussionFilter}` : 'All Statuses'}</span>
                      </div>

                      {/* Scrollable list */}
                      <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', overflowY: 'auto', maxHeight: '640px', paddingRight: '0.35rem' }}>
                        {filteredDiscussions.map((d) => {
                          const isSelected = (activeDiscussion && activeDiscussion.id === d.id);
                          let statusBadgeClass = 'badge-pending';
                          if (d.status === 'RESOLVED') statusBadgeClass = 'badge-completed';
                          else if (d.status === 'IN_REVIEW') statusBadgeClass = 'badge-assigned';
                          else if (d.status === 'CLOSED') statusBadgeClass = 'badge-cancelled';

                          const priorityColor = d.priority === 'URGENT' ? '#EF4444' : (d.priority === 'HIGH' ? '#F59E0B' : '#6366F1');

                          return (
                            <div
                              key={d.id}
                              onClick={() => {
                                setSelectedDiscussionId(d.id);
                                setProviderResolutionStatus(d.status === 'OPEN' ? 'RESOLVED' : d.status);
                              }}
                              style={{
                                padding: '0.85rem',
                                borderRadius: '10px',
                                border: '1px solid',
                                borderColor: isSelected ? '#6366F1' : 'var(--border-light)',
                                background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-subtle)',
                                boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.18)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.18s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <strong style={{ fontSize: '0.82rem', color: isSelected ? '#6366F1' : 'var(--text-main)', lineHeight: 1.25 }}>
                                    Ticket #{String(d.id).slice(-6)}
                                  </strong>
                                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: priorityColor, border: `1px solid ${priorityColor}40`, padding: '0.05rem 0.3rem', borderRadius: '4px' }}>
                                    {d.priority || 'NORMAL'}
                                  </span>
                                </div>
                                <span className={`badge ${statusBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', flexShrink: 0 }}>
                                  {d.status}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                <span style={{ color: '#6366F1', fontWeight: 600 }}>
                                  {d.category ? d.category.replace(/_/g, ' ') : 'GENERAL INQUIRY'}
                                </span>
                                {d.bookingId && <span>• Booking #{d.bookingId}</span>}
                              </div>

                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {d.subject}
                              </div>

                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                <strong>Partner:</strong> <span style={{ color: 'var(--text-main)' }}>{d.providerName || `Partner #${d.providerId}`}</span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                <span>{d.messages ? d.messages.length : 0} messages in thread</span>
                                <span>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'}</span>
                              </div>
                            </div>
                          );
                        })}

                        {filteredDiscussions.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                            No provider tickets matching current filters.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Active Provider Grievance Resolution Console */}
                    {(() => {
                      const d = activeDiscussion;
                      if (!d) {
                        return (
                          <div className="panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Select a provider ticket from the left pane to view grievance details and issue rulings.
                          </div>
                        );
                      }

                      let statusBadgeClass = 'badge-pending';
                      if (d.status === 'RESOLVED') statusBadgeClass = 'badge-completed';
                      else if (d.status === 'IN_REVIEW') statusBadgeClass = 'badge-assigned';
                      else if (d.status === 'CLOSED') statusBadgeClass = 'badge-cancelled';

                      const priorityColor = d.priority === 'URGENT' ? '#EF4444' : (d.priority === 'HIGH' ? '#F59E0B' : '#6366F1');

                      return (
                        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
                          {/* Ticket Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                                  {d.subject}
                                </h3>
                                <span className={`badge ${statusBadgeClass}`}>
                                  {d.status}
                                </span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: priorityColor, border: `1px solid ${priorityColor}40`, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                  {d.priority || 'NORMAL'} PRIORITY
                                </span>
                              </div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Ticket #{String(d.id).slice(-6)} • Filed on: {d.createdAt ? new Date(d.createdAt).toLocaleString() : 'Recent'}
                              </span>
                            </div>

                            {/* Quick Status Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {d.status === 'OPEN' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateDiscussionStatus(d.id, 'IN_REVIEW')}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                >
                                  ⏳ Mark In-Review
                                </button>
                              )}
                              {d.status !== 'RESOLVED' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateDiscussionStatus(d.id, 'RESOLVED')}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#10B981', borderColor: '#10B981' }}
                                >
                                  ✓ Mark Resolved
                                </button>
                              )}
                              {d.status !== 'CLOSED' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateDiscussionStatus(d.id, 'CLOSED')}
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', border: '1px solid var(--border-light)' }}
                                >
                                  ✕ Close Ticket
                                </button>
                              )}
                              {(d.status === 'RESOLVED' || d.status === 'CLOSED') && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateDiscussionStatus(d.id, 'OPEN')}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                >
                                  ↺ Re-Open
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Party Intelligence & Context Cards */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                🛠️ PROVIDER DETAILS
                              </span>
                              <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem', display: 'block' }}>{d.providerName || 'Provider'}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>{d.providerEmail || 'No email registered'}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Partner ID: #{d.providerId || 'N/A'}</span>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                🏷️ GRIEVANCE CATEGORY
                              </span>
                              <strong style={{ color: '#6366F1', fontSize: '0.85rem', display: 'block' }}>
                                {d.category ? d.category.replace(/_/g, ' ') : 'GENERAL'}
                              </strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>
                                Priority: <strong style={{ color: priorityColor }}>{d.priority || 'NORMAL'}</strong>
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{d.messages ? d.messages.length : 0} total messages</span>
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                📋 LINKED BOOKING CONTEXT
                              </span>
                              {d.bookingId ? (
                                <>
                                  <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', display: 'block' }}>
                                    Booking #{d.bookingId}
                                  </strong>
                                  <span style={{ color: 'var(--text-main)', fontSize: '0.78rem', display: 'block' }}>Booking Related Inquiry</span>
                                  <span className="badge badge-assigned" style={{ fontSize: '0.68rem', marginTop: '0.2rem' }}>
                                    Partner Task
                                  </span>
                                </>
                              ) : (
                                <>
                                  <strong style={{ color: 'var(--text-main)', display: 'block' }}>General Platform Grievance</strong>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No specific booking reference linked</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Interactive Conversation Timeline Thread */}
                          <div>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                              Communication Thread ({d.messages ? d.messages.length : 0})
                            </h4>
                            <div
                              ref={messagesContainerRef}
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
                              {(!d.messages || d.messages.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                                  No message history in this thread yet.
                                </div>
                              ) : (
                                d.messages.map((msg, idx) => {
                                  const isAdmin = msg.senderRole === 'ADMIN';
                                  return (
                                    <div
                                      key={msg.id || idx}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isAdmin ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%',
                                        alignSelf: isAdmin ? 'flex-end' : 'flex-start'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        <strong style={{ color: isAdmin ? '#818CF8' : 'var(--text-main)' }}>
                                          {isAdmin ? '🛡️ Admin Support' : `🛠️ ${msg.senderName || 'Provider'}`}
                                        </strong>
                                        <span>• {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                                      </div>
                                      <div style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                        background: isAdmin ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'var(--bg-card)',
                                        color: isAdmin ? '#ffffff' : 'var(--text-main)',
                                        border: isAdmin ? 'none' : '1px solid var(--border-light)',
                                        fontSize: '0.84rem',
                                        lineHeight: 1.45,
                                        whiteSpace: 'pre-wrap',
                                        boxShadow: isAdmin ? '0 2px 10px rgba(99, 102, 241, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)'
                                      }}>
                                        {msg.message}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Conversational Reply Input for Ongoing Discussion with Provider */}
                          {d.status !== 'CLOSED' && (
                            <form onSubmit={(e) => handleSendProviderChat(e, d.id)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginTop: '0.25rem' }}>
                              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                                <textarea
                                  className="form-control"
                                  rows={2}
                                  placeholder="Type a message or response to provider in this thread..."
                                  value={adminProviderChatText}
                                  onChange={(e) => setAdminProviderChatText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      if (!submittingProviderChat && adminProviderChatText.trim()) {
                                        handleSendProviderChat(e, d.id);
                                      }
                                    }
                                  }}
                                  style={{ resize: 'none', fontSize: '0.84rem' }}
                                />
                              </div>
                              <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submittingProviderChat || !adminProviderChatText.trim()}
                                style={{ padding: '0.65rem 1.25rem', height: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', border: 'none' }}
                              >
                                <Send size={15} />
                                <span>{submittingProviderChat ? 'Sending...' : 'Send Message'}</span>
                              </button>
                            </form>
                          )}

                          {/* Provider Resolution Ruling & Actions Form */}
                          <form onSubmit={(e) => handleResolveProviderTicket(e, d)} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <ShieldCheck size={16} color="#6366F1" />
                              <span>Issue Resolution Ruling & Support Response</span>
                            </h4>

                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label">Decision Status *</label>
                              <select
                                className="form-control"
                                value={providerResolutionStatus}
                                onChange={(e) => setProviderResolutionStatus(e.target.value)}
                              >
                                <option value="RESOLVED">RESOLVED (Grievance Solved / Action Executed)</option>
                                <option value="IN_REVIEW">IN REVIEW (Under Investigation / Follow-up Needed)</option>
                                <option value="CLOSED">CLOSED (Inquiry Completed / Dismissed)</option>
                                <option value="OPEN">OPEN (Active Thread)</option>
                              </select>
                            </div>

                            {/* Quick Presets Chips */}
                            <div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                ⚡ One-Click Resolution Templates:
                              </span>
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {[
                                  'Payment discrepancy verified and credited to provider wallet.',
                                  'Booking penalty dispute reviewed and successfully waived.',
                                  'Payout release initiated; funds will reflect in bank account within 24 hours.',
                                  'Issue investigated and resolved per platform service agreement.',
                                  'Inquiry addressed; closing ticket. Please open a new request if needed.'
                                ].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setAdminReplyText(preset)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', border: '1px solid var(--border-subtle)' }}
                                  >
                                    {preset.slice(0, 42)}...
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label">Official Ruling & Response Message *</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Type the official ruling, explanation, or resolution instructions for the service partner..."
                                value={adminReplyText}
                                onChange={(e) => setAdminReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!submittingAdminReply && adminReplyText.trim()) {
                                      handleResolveProviderTicket(e, d);
                                    }
                                  }
                                }}
                                required
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                              <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submittingAdminReply || (!adminReplyText.trim() && d.status === providerResolutionStatus)}
                                style={{
                                  padding: '0.5rem 1.5rem',
                                  fontWeight: 600,
                                  background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                  border: 'none',
                                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                                }}
                              >
                                <Send size={14} style={{ marginRight: '0.35rem' }} />
                                {submittingAdminReply ? 'Processing Ruling...' : 'Submit Resolution & Send Reply'}
                              </button>
                            </div>
                          </form>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------- */}
        {/* TAB: KYC VERIFICATIONS CONSOLE          */}
        {/* ---------------------------------------- */}
        {activeTab === 'kyc' && (
          <div className="panel animate-fade-in" style={{ padding: '1.5rem' }}>
            {/* Header & Metrics Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={22} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    Provider KYC & Identity Verification Console
                  </h2>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0.35rem 0 0 0' }}>
                  Audit, approve, or reject official government identity documents uploaded by service partners.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: `All (${kycDocuments.length})` },
                  { key: 'PENDING', label: `Pending Review (${kycDocuments.filter(d => d.status === 'PENDING').length})` },
                  { key: 'VERIFIED', label: `Verified (${kycDocuments.filter(d => d.status === 'VERIFIED').length})` },
                  { key: 'REJECTED', label: `Rejected (${kycDocuments.filter(d => d.status === 'REJECTED').length})` }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => { setKycFilter(f.key); setKycPage(1); }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: kycFilter === f.key ? 'var(--primary)' : 'var(--border-light)',
                      background: kycFilter === f.key ? 'var(--primary-subtle)' : 'transparent',
                      color: kycFilter === f.key ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Verification Table */}
            {kycDocuments.filter(d => kycFilter === 'ALL' || d.status === kycFilter).length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                <div className="empty-state-icon">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="empty-state-title">No KYC documents in this view</h3>
                <p className="empty-state-description">
                  There are no partner documents matching the <strong>{kycFilter}</strong> status filter.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th>Document ID</th>
                      <th>Partner Details</th>
                      <th>Document Type</th>
                      <th>ID Number</th>
                      <th>Uploaded File</th>
                      <th>Status</th>
                      <th>Submitted Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycDocuments
                      .filter(d => kycFilter === 'ALL' || d.status === kycFilter)
                      .slice((kycPage - 1) * itemsPerPage, kycPage * itemsPerPage)
                      .map((doc) => (
                        <tr key={doc.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                            #{String(doc.id).slice(-6)}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{doc.providerName || 'Provider'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              Provider #{doc.providerId}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-assigned" style={{ fontSize: '0.72rem' }}>
                              {doc.documentType?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-main)' }}>
                            {doc.documentNumber || '—'}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.originalFileName || 'Document'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : 'Attached'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${doc.status === 'VERIFIED' ? 'badge-completed' : doc.status === 'REJECTED' ? 'badge-cancelled' : 'badge-pending'}`}>
                              {doc.status === 'VERIFIED' && '✓ Verified'}
                              {doc.status === 'PENDING' && '⏳ Pending'}
                              {doc.status === 'REJECTED' && '✕ Rejected'}
                            </span>
                            {doc.status === 'REJECTED' && doc.rejectionReason && (
                              <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.2rem', maxWidth: '180px' }}>
                                Reason: {doc.rejectionReason}
                              </div>
                            )}
                            {doc.status === 'VERIFIED' && doc.verifiedByName && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                By: {doc.verifiedByName}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              <a
                                href={api.kyc.getDocumentViewUrl(doc.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                                title="View Document File"
                              >
                                View File
                              </a>
                              <button
                                onClick={() => {
                                  setVerifyingKycDoc(doc);
                                  setKycDecisionStatus(doc.status === 'VERIFIED' ? 'VERIFIED' : 'VERIFIED');
                                  setKycRejectionReason(doc.rejectionReason || '');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                              >
                                {doc.status === 'PENDING' ? 'Review' : 'Update Status'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <Pagination
                  currentPage={kycPage}
                  totalItems={kycDocuments.filter(d => kycFilter === 'ALL' || d.status === kycFilter).length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setKycPage}
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
              {processingPayout.upiId && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <strong>UPI ID:</strong> <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{processingPayout.upiId}</span>
                </div>
              )}
              {processingPayout.bankAccountNumber && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <strong>Bank Account:</strong> {processingPayout.bankAccountNumber}
                  {processingPayout.bankIfsc ? <span style={{ fontFamily: 'var(--font-mono)', marginLeft: '4px' }}>({processingPayout.bankIfsc})</span> : null}
                  {processingPayout.bankName ? ` - ${processingPayout.bankName}` : ''}
                </div>
              )}
              {processingPayout.notes && !processingPayout.upiId && !processingPayout.bankAccountNumber && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <strong>Bank / UPI Info:</strong> {processingPayout.notes}
                </div>
              )}
            </div>

            <form onSubmit={handleProcessPayout}>
              <div className="form-group">
                <label className="form-label">Payout Action</label>
                <select className="form-control" value={payoutStatusDecision} onChange={(e) => setPayoutStatusDecision(e.target.value)}>
                  <option value="PROCESSED">Approve & Mark Transferred (PROCESSED)</option>
                  <option value="COMPLETED">Approve & Mark Transferred (COMPLETED)</option>
                  <option value="APPROVED">Mark Approved / Processing</option>
                  <option value="REJECTED">Reject Payout Request (Refund Wallet)</option>
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

      {/* Modal: Verify KYC Document */}
      {verifyingKycDoc && (
        <div className="modal-overlay" onClick={() => setVerifyingKycDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                <span>Verify KYC Document #{String(verifyingKycDoc.id).slice(-6)}</span>
              </h3>
              <button onClick={() => setVerifyingKycDoc(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Provider:</span>
                <strong style={{ color: 'var(--text-main)' }}>{verifyingKycDoc.providerName} (ID #{verifyingKycDoc.providerId})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Document Type:</span>
                <span className="badge badge-assigned">{verifyingKycDoc.documentType?.replace(/_/g, ' ')}</span>
              </div>
              {verifyingKycDoc.documentNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ID / Doc Number:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{verifyingKycDoc.documentNumber}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{verifyingKycDoc.originalFileName}</span>
                <a
                  href={api.kyc.getDocumentViewUrl(verifyingKycDoc.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                >
                  Open Document File ↗
                </a>
              </div>
            </div>

            <form onSubmit={handleVerifyKycDocument}>
              <div className="form-group">
                <label className="form-label">Verification Decision *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setKycDecisionStatus('VERIFIED')}
                    style={{
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${kycDecisionStatus === 'VERIFIED' ? 'var(--success)' : 'var(--border-light)'}`,
                      backgroundColor: kycDecisionStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: kycDecisionStatus === 'VERIFIED' ? 'var(--success)' : 'var(--text-main)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Approve & Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => setKycDecisionStatus('REJECTED')}
                    style={{
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${kycDecisionStatus === 'REJECTED' ? 'var(--error)' : 'var(--border-light)'}`,
                      backgroundColor: kycDecisionStatus === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      color: kycDecisionStatus === 'REJECTED' ? 'var(--error)' : 'var(--text-main)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Reject Document
                  </button>
                </div>
              </div>

              {kycDecisionStatus === 'REJECTED' && (
                <div className="form-group">
                  <label className="form-label">Rejection Reason * (Sent to Partner)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Unclear scan, expired identification card, or name mismatch with partner profile."
                    value={kycRejectionReason}
                    onChange={(e) => setKycRejectionReason(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                    {['Blurry or unreadable photo', 'Expired document', 'Name mismatch with profile', 'Incomplete document sides'].map(sugg => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => setKycRejectionReason(sugg)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', border: '1px solid var(--border-subtle)' }}
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="submit"
                  className={`btn ${kycDecisionStatus === 'VERIFIED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1, backgroundColor: kycDecisionStatus === 'VERIFIED' ? 'var(--success)' : '#ef4444', color: '#fff' }}
                  disabled={submittingKycVerify}
                >
                  {submittingKycVerify ? 'Saving...' : kycDecisionStatus === 'VERIFIED' ? 'Confirm Verification' : 'Confirm Rejection'}
                </button>
                <button type="button" onClick={() => setVerifyingKycDoc(null)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
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
