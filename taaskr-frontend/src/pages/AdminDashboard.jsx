import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatLocalTime } from '../utils/time';
import AnalyticsDashboardTab from '../components/admin/AnalyticsDashboardTab';
import SystemObservabilityTab from '../components/admin/SystemObservabilityTab';

export default function AdminDashboard() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'analytics', 'observability', 'catalog', 'providers', 'bookings'
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
      const cats = await api.catalog.getCategories();
      setCategories(cats);

      const servs = await api.catalog.getServices();
      setServices(servs);

      const usersList = await api.admin.getUsers();
      setUsers(usersList);

      const providersList = await api.admin.getProviders();
      setProviders(providersList);

      const bookingsList = await api.admin.getAllBookings();
      setBookings(bookingsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
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
        alert('Category updated!');
      } else {
        await api.admin.createCategory({ name: catName, description: catDesc });
        alert('Category created!');
      }
      setCatName('');
      setCatDesc('');
      setEditingCatId(null);
      // Reload lists
      const cats = await api.catalog.getCategories();
      setCategories(cats);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatDesc(cat.description);
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
        alert('Service updated!');
      } else {
        await api.admin.createService(data);
        alert('Service created!');
      }

      setSrvName('');
      setSrvDesc('');
      setSrvPrice('');
      setSrvDuration('');
      setSrvCatId('');
      setEditingSrvId(null);
      
      // Reload
      const servs = await api.catalog.getServices();
      setServices(servs);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditService = (srv) => {
    setEditingSrvId(srv.id);
    setSrvName(srv.name);
    setSrvDesc(srv.description);
    setSrvPrice(srv.price);
    setSrvDuration(srv.durationMinutes);
    setSrvCatId(srv.categoryId);
  };

  const handleDeleteService = async (srvId) => {
    if (!window.confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await api.admin.deleteService(srvId);
      alert('Service deactivated.');
      const servs = await api.catalog.getServices();
      setServices(servs);
    } catch (err) {
      alert(err.message);
    }
  };

  // ----------------------------------------
  // PROVIDER OPERATIONS
  // ----------------------------------------
  const handleApproveProvider = async (providerId) => {
    try {
      await api.admin.approveProvider(providerId);
      alert('Provider profile approved successfully!');
      // Reload providers
      const providersList = await api.admin.getProviders();
      setProviders(providersList);
    } catch (err) {
      alert(err.message);
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
        <p style={{ marginTop: '1rem', fontWeight: 500 }}>Loading Admin Console...</p>
      </div>
    );
  }

  // Authoritative Revenue Calculation: Sum finalAmount only if paymentStatus is PAID
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((acc, curr) => acc + (Number(curr.finalAmount) || 0), 0);

  return (
    <div className="enterprise-layout animate-fade-in">
      {/* Enterprise Sidebar */}
      <aside className="enterprise-sidebar">
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>Admin Center</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Enterprise Management</p>
        </div>
        
        <nav className="enterprise-sidebar-nav">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.25rem' }}>📊</span> Dashboard Analytics
          </button>
          <button 
            onClick={() => setActiveTab('observability')}
            className={`sidebar-item ${activeTab === 'observability' ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.25rem' }}>⚡</span> Live Observability
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`sidebar-item ${activeTab === 'catalog' ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.25rem' }}>🗂️</span> Catalog Manager
          </button>
          <button 
            onClick={() => setActiveTab('providers')}
            className={`sidebar-item ${activeTab === 'providers' ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.25rem' }}>💼</span> Provider Approvals
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.25rem' }}>📝</span> Bookings Monitor
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="enterprise-main">
        <div className="enterprise-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Welcome back, Admin. Here's what's happening today.</p>
          </div>
        </div>

        {/* Tab: Dashboard Analytics */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboardTab />
        )}

        {/* Tab: Live System Observability */}
        {activeTab === 'observability' && (
          <SystemObservabilityTab />
        )}

      {/* Tab: Catalog Manager */}
      {activeTab === 'catalog' && (
        <div className="grid-cols-3" style={{ gap: '2rem', alignItems: 'flex-start' }}>
          {/* Categories CRUD Form & List */}
          <div className="premium-card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>
              {editingCatId ? 'Edit Category' : 'Create Category'}
            </h2>
            
            <form onSubmit={handleSaveCategory} style={{ marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Painting"
                  className="form-control"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Description</label>
                <textarea
                  placeholder="e.g. Wall painting and coating..."
                  className="form-control"
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingCatId ? 'Update' : 'Add Category'}
                </button>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(null);
                      setCatName('');
                      setCatDesc('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>Current Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-page)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>{cat.name}</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{cat.description}</p>
                  </div>
                  <button onClick={() => handleEditCategory(cat)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} title="Edit">✏️</button>
                </div>
              ))}
            </div>
          </div>

          {/* Services CRUD */}
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="premium-card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>
                {editingSrvId ? 'Edit Service Details' : 'Register New Catalog Service'}
              </h2>

              <form onSubmit={handleSaveService} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Service Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kitchen Cleaning"
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
                  <label className="form-label">Base Price (INR) *</label>
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
                  <label className="form-label">Estimated Duration (Mins) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    className="form-control"
                    value={srvDuration}
                    onChange={(e) => setSrvDuration(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Service Description</label>
                  <input
                    type="text"
                    placeholder="Enter details on what tasks the provider will perform..."
                    className="form-control"
                    value={srvDesc}
                    onChange={(e) => setSrvDesc(e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
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
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary">
                    {editingSrvId ? 'Update Service' : 'Publish Service'}
                  </button>
                </div>
              </form>

              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>Catalog Services</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(srv => {
                      const cat = categories.find(c => c.id === srv.categoryId);
                      return (
                        <tr key={srv.id} style={{ opacity: srv.active ? 1 : 0.5 }}>
                          <td style={{ fontWeight: 600 }}>{srv.name}</td>
                          <td>{cat ? cat.name : 'Unknown'}</td>
                          <td style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{srv.price}</td>
                          <td>{srv.durationMinutes} min</td>
                          <td>
                            <span className={`badge ${srv.active ? 'badge-completed' : 'badge-cancelled'}`}>
                              {srv.active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleEditService(srv)} className="btn btn-secondary btn-small" style={{ padding: '0.2rem 0.5rem' }}>✏️</button>
                              {srv.active && (
                                <button onClick={() => handleDeleteService(srv.id)} className="btn btn-danger btn-small" style={{ padding: '0.2rem 0.5rem' }}>🗑️</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Provider Approvals */}
      {activeTab === 'providers' && (
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1.5rem' }}>Provider Profile Review Queue</h2>

          {providers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No providers registered in the database.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Provider Name</th>
                    <th>Email / Phone</th>
                    <th>Experience</th>
                    <th>Bio</th>
                    <th>Approval Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>{p.email}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {p.phone}</div>
                      </td>
                      <td>{p.experienceYears} Years</td>
                      <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.bio}>{p.bio}</td>
                      <td>
                        <span className={`badge ${p.approved ? 'badge-completed' : 'badge-pending'}`}>
                          {p.approved ? 'Approved' : 'Pending Review'}
                        </span>
                      </td>
                      <td>
                        {!p.approved ? (
                          <button
                            onClick={() => handleApproveProvider(p.id)}
                            className="btn btn-success btn-small"
                          >
                            ✓ Approve Profile
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Already Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Bookings Monitor */}
      {activeTab === 'bookings' && (
        <div className="premium-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1.5rem' }}>Global Bookings Ledger</h2>

          {bookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No service bookings registered in system.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer Details</th>
                    <th>Service Scheduled</th>
                    <th>Date / Time</th>
                    <th>Assigned Provider</th>
                    <th>Price</th>
                    <th>Workflow Status</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>#{String(b.id).slice(-6)}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{b.userName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {b.userPhone || 'N/A'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{b.serviceName}</div>
                        <span className="badge badge-assigned" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', background: 'var(--bg-page)', color: 'var(--text-muted)', border: 'none' }}>{b.categoryName}</span>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-main)' }}>{b.bookingDate}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏱️ {formatLocalTime(b.startTime)}</div>
                      </td>
                      <td>
                        {b.providerId ? (
                          <div>
                            <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{b.providerName}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--error)', fontStyle: 'italic', fontSize: '0.85rem' }}>Awaiting Provider</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{b.finalAmount}</td>
                      <td>
                        <span className={`badge ${
                          b.status === 'PENDING' ? 'badge-pending' : b.status === 'ASSIGNED' ? 'badge-assigned' : b.status === 'ACCEPTED' ? 'badge-accepted' : b.status === 'IN_PROGRESS' ? 'badge-inprogress' : b.completed || b.status === 'COMPLETED' ? 'badge-completed' : 'badge-cancelled'
                        }`}>
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
            </div>
          )}
        </div>
      )}
      </main>
    </div>
  );
}
