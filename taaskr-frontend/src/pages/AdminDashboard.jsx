import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import { sortBookingsByStatusPriority } from '../utils/sorting';
import AnalyticsDashboardTab from '../components/admin/AnalyticsDashboardTab';
import SystemObservabilityTab from '../components/admin/SystemObservabilityTab';
import Pagination from '../components/Pagination';
import { 
  BarChart3, Activity, Layers, Users, Briefcase, Plus, Trash2, 
  Edit2, Check, X, ShieldCheck, RefreshCw, DollarSign, Calendar, 
  MapPin, Truck, AlertCircle, Search
} from 'lucide-react';

export default function AdminDashboard() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [servicesPage, setServicesPage] = useState(1);
  const [providersPage, setProvidersPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const itemsPerPage = 8;

  // Tabs: 'analytics', 'observability', 'catalog', 'providers', 'bookings', 'users'
  const [activeTab, setActiveTab] = useState('analytics');

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
      const [cats, servs, usersList, providersList, bookingsList] = await Promise.all([
        api.catalog.getCategories(),
        api.catalog.getServices(),
        api.admin.getUsers(),
        api.admin.getProviders(),
        api.admin.getAllBookings()
      ]);

      setCategories(cats || []);
      setServices(servs || []);
      setUsers(usersList || []);
      setProviders(providersList || []);
      setBookings(sortBookingsByStatusPriority(bookingsList || []));
    } catch (err) {
      console.error('Failed to load admin console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

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

  const handleApproveProvider = async (providerId) => {
    try {
      await api.admin.approveProvider(providerId);
      const providersList = await api.admin.getProviders();
      setProviders(providersList);
    } catch (err) {
      alert(err.message);
    }
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

  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((acc, curr) => acc + (Number(curr.finalAmount) || 0), 0);

  return (
    <div className="enterprise-layout animate-fade-in">
      {/* Enterprise Sidebar */}
      <aside className="enterprise-sidebar">
        <div style={{ padding: '0.25rem 0.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.9375rem' }}>
            <ShieldCheck size={18} color="var(--primary)" />
            <span>Admin Center</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operations & Governance</span>
        </div>
        
        <nav className="enterprise-sidebar-nav">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </button>

          <button 
            onClick={() => setActiveTab('observability')}
            className={`sidebar-item ${activeTab === 'observability' ? 'active' : ''}`}
          >
            <Activity size={16} />
            <span>Observability</span>
          </button>

          <button 
            onClick={() => setActiveTab('catalog')}
            className={`sidebar-item ${activeTab === 'catalog' ? 'active' : ''}`}
          >
            <Layers size={16} />
            <span>Service Catalog</span>
          </button>

          <button 
            onClick={() => setActiveTab('providers')}
            className={`sidebar-item ${activeTab === 'providers' ? 'active' : ''}`}
          >
            <Briefcase size={16} />
            <span>Providers ({providers.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('bookings')}
            className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`}
          >
            <Calendar size={16} />
            <span>All Bookings ({bookings.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
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
            <span>Refresh All</span>
          </button>
        </div>

        {/* Tab: Analytics */}
        {activeTab === 'analytics' && <AnalyticsDashboardTab />}

        {/* Tab: Observability */}
        {activeTab === 'observability' && <SystemObservabilityTab />}

        {/* Tab: Catalog Manager */}
        {activeTab === 'catalog' && (
          <div className="grid-cols-3" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
            {/* Categories Form & List */}
            <div className="panel">
              <div className="panel-header">
                <h3 className="panel-title">
                  <Layers size={16} color="var(--primary)" />
                  <span>{editingCatId ? 'Edit Category' : 'Add Category'}</span>
                </h3>
              </div>
              
              <form onSubmit={handleSaveCategory} style={{ marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrical & Wiring"
                    className="form-control"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    placeholder="Category scope summary..."
                    className="form-control"
                    rows={2}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    {editingCatId ? 'Update' : 'Add Category'}
                  </button>
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={() => { setEditingCatId(null); setCatName(''); setCatDesc(''); }}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  Existing Categories ({categories.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '240px', overflowY: 'auto' }}>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>{cat.name}</strong>
                      </div>
                      <button onClick={() => handleEditCategory(cat)} className="btn btn-ghost btn-sm" style={{ padding: '0.15rem' }}>
                        <Edit2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Services CRUD */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Plus size={16} color="var(--primary)" />
                    <span>{editingSrvId ? 'Edit Service' : 'Register New Service'}</span>
                  </h3>
                </div>

                <form onSubmit={handleSaveService} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Service Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Split AC Servicing"
                      className="form-control"
                      value={srvName}
                      onChange={(e) => setSrvName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={srvCatId}
                      onChange={(e) => setSrvCatId(e.target.value)}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Base Rate (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 599"
                      className="form-control"
                      value={srvPrice}
                      onChange={(e) => setSrvPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration (Minutes) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 60"
                      className="form-control"
                      value={srvDuration}
                      onChange={(e) => setSrvDuration(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2', margin: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea
                      placeholder="Service deliverables, terms, and tools included..."
                      className="form-control"
                      rows={2}
                      value={srvDesc}
                      onChange={(e) => setSrvDesc(e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      {editingSrvId ? 'Update Service' : 'Save Service'}
                    </button>
                    {editingSrvId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSrvId(null);
                          setSrvName('');
                          setSrvDesc('');
                          setSrvPrice('');
                          setSrvDuration('');
                          setSrvCatId('');
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Service Table List */}
              <div className="table-container">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Service Title</th>
                      <th>Category</th>
                      <th>Base Rate</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.slice((servicesPage - 1) * itemsPerPage, servicesPage * itemsPerPage).map((srv) => (
                      <tr key={srv.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{srv.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{srv.category?.name || categories.find(c => c.id === srv.categoryId)?.name || 'General'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>₹{srv.price}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{srv.durationMinutes} min</td>
                        <td>
                          <span className={`badge ${srv.active !== false ? 'badge-completed' : 'badge-cancelled'}`}>
                            {srv.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button onClick={() => handleEditService(srv)} className="btn btn-ghost btn-sm" title="Edit Service">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDeleteService(srv.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} title="Deactivate">
                              <Trash2 size={13} />
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
          </div>
        )}

        {/* Tab: Provider Approvals */}
        {activeTab === 'providers' && (
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Provider Name</th>
                  <th>Contact Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Admin Approval</th>
                </tr>
              </thead>
              <tbody>
                {providers.slice((providersPage - 1) * itemsPerPage, providersPage * itemsPerPage).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{p.email}</span>
                        {p.emailVerified ? (
                          <span title="Email Verified" style={{ color: '#10B981', display: 'inline-flex' }}><Check size={12} /></span>
                        ) : (
                          <span title="Email Unverified" style={{ color: '#D97706', fontSize: '0.65rem', background: '#FEF3C7', padding: '0.05rem 0.3rem', borderRadius: '3px' }}>Unverified</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{p.phone || 'N/A'}</span>
                        {p.phoneVerified ? (
                          <span title="Phone Verified" style={{ color: '#10B981', display: 'inline-flex' }}><Check size={12} /></span>
                        ) : (
                          <span title="Phone Unverified" style={{ color: '#2563EB', fontSize: '0.65rem', background: '#EFF6FF', padding: '0.05rem 0.3rem', borderRadius: '3px' }}>Unverified</span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-main)' }}>{p.city} ({p.pincode})</td>
                    <td style={{ color: 'var(--text-main)' }}>{p.experienceYears || 0} yrs</td>
                    <td>
                      <span className={`badge ${p.approved ? 'badge-completed' : 'badge-pending'}`}>
                        {p.approved ? 'Approved' : 'Pending Verification'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!p.approved ? (
                        <button
                          onClick={() => handleApproveProvider(p.id)}
                          className="btn btn-success btn-sm"
                          style={{ padding: '0.2rem 0.5rem' }}
                        >
                          Approve Partner
                        </button>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={12} /> Approved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={providersPage}
              totalItems={providers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setProvidersPage}
            />
          </div>
        )}

        {/* Tab: All Bookings Monitor */}
        {activeTab === 'bookings' && (
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Provider</th>
                  <th>Scheduled</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice((bookingsPage - 1) * itemsPerPage, bookingsPage * itemsPerPage).map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>
                      #{String(b.id).slice(-6)}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{b.customerName || 'Customer'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {b.dropAddress && <Truck size={13} color="var(--primary)" />}
                        <span>{b.serviceName}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{b.providerName || 'Unassigned'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{b.bookingDate} {formatLocalTime(b.startTime)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                      ₹{b.finalAmount ?? b.totalAmount ?? 0}
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'COMPLETED' ? 'badge-completed' : b.status === 'IN_PROGRESS' ? 'badge-inprogress' : b.status === 'ACCEPTED' ? 'badge-accepted' : 'badge-pending'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${b.paymentStatus === 'PAID' ? 'badge-completed' : 'badge-pending'}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={bookingsPage}
              totalItems={bookings.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setBookingsPage}
            />
          </div>
        )}

        {/* Tab: Registered Users */}
        {activeTab === 'users' && (
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Role</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {users.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage).map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{u.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.phone || 'N/A'}</td>
                    <td style={{ color: 'var(--text-main)' }}>{u.city || 'N/A'}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-completed' : u.role === 'PROVIDER' ? 'badge-accepted' : 'badge-pending'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          padding: '0.1rem 0.35rem', 
                          borderRadius: '3px',
                          background: u.emailVerified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                          color: u.emailVerified ? '#10B981' : '#D97706',
                          fontWeight: 600
                        }}>
                          {u.emailVerified ? '✓ Email' : '✕ Email'}
                        </span>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          padding: '0.1rem 0.35rem', 
                          borderRadius: '3px',
                          background: u.phoneVerified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                          color: u.phoneVerified ? '#10B981' : '#2563EB',
                          fontWeight: 600
                        }}>
                          {u.phoneVerified ? '✓ Phone' : '✕ Phone'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={usersPage}
              totalItems={users.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setUsersPage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
