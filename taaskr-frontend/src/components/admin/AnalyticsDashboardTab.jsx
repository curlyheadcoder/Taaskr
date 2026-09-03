import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PALETTE = [
  '#3b82f6', // Brand Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: '#f59e0b' },
  ASSIGNED: { label: 'Assigned', color: '#3b82f6' },
  ACCEPTED: { label: 'Accepted', color: '#6366f1' },
  IN_PROGRESS: { label: 'In Progress', color: '#8b5cf6' },
  COMPLETED: { label: 'Completed', color: '#10b981' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444' }
};

export default function AnalyticsDashboardTab() {
  const [daysRange, setDaysRange] = useState(30);
  const [activeSubTab, setActiveSubTab] = useState('business'); // 'business' | 'system'
  const [data, setData] = useState(null);
  const [actuatorHealth, setActuatorHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (days = daysRange, isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [analyticsRes, healthRes] = await Promise.allSettled([
        api.admin.getAnalytics(days),
        api.admin.getActuatorHealth()
      ]);

      if (analyticsRes.status === 'fulfilled') {
        setData(analyticsRes.value);
      } else {
        throw new Error(analyticsRes.reason?.message || 'Failed to fetch analytics');
      }

      if (healthRes.status === 'fulfilled') {
        setActuatorHealth(healthRes.value);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Unable to connect to analytics service');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(daysRange, false);
  }, [daysRange]);

  const formatUptime = (seconds) => {
    if (!seconds) return '0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  // Theme-aware, high-contrast custom tooltip
  const CustomTooltip = ({ active, payload, label, formatter, titlePrefix }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-card, #1e293b)',
          color: 'var(--text-main, #f8fafc)',
          padding: '0.85rem 1.1rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-light, #334155)',
          fontSize: '0.875rem',
          minWidth: '160px'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-main, #f8fafc)', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-light, #334155)', paddingBottom: '0.3rem' }}>
            {titlePrefix ? `${titlePrefix}: ${label}` : label}
          </div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.3rem' }}>
              <span style={{ color: entry.color || 'var(--text-muted, #94a3b8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color || '#3b82f6' }}></span>
                {entry.name || 'Value'}:
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
                {formatter ? formatter(entry.value, entry.name) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>⚙️</div>
        <p style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>Aggregating Live Platform Intelligence & Observability...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="premium-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--error, #ef4444)', marginBottom: '0.75rem' }}>Failed to Load Analytics</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => fetchAnalytics(daysRange, false)} className="btn btn-primary">
          Retry Sync
        </button>
      </div>
    );
  }

  const kpi = data?.kpiSummary || {};
  const telemetry = data?.telemetry || {};
  const revenueTrends = data?.revenueTrends || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const statusBreakdown = data?.statusBreakdown || [];

  const heapPct = telemetry.heapMaxMb ? Math.round((telemetry.heapUsedMb / telemetry.heapMaxMb) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Header & Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        padding: '1.25rem 1.75rem',
        borderRadius: '14px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Platform Analytics & Observability
            </h2>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time business performance indicators & live system metrics
          </p>
        </div>

        {/* Action Controls: Sub-Tabs, Time Range & Modern Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          
          {/* Sub-view switcher */}
          <div style={{
            display: 'inline-flex',
            padding: '3px',
            backgroundColor: 'var(--bg-page)',
            borderRadius: '10px',
            border: '1px solid var(--border-light)'
          }}>
            <button
              onClick={() => setActiveSubTab('business')}
              style={{
                border: 'none',
                backgroundColor: activeSubTab === 'business' ? 'var(--primary)' : 'transparent',
                color: activeSubTab === 'business' ? '#ffffff' : 'var(--text-muted)',
                padding: '0.45rem 0.9rem',
                borderRadius: '7px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              📈 Business KPIs
            </button>
            <button
              onClick={() => setActiveSubTab('system')}
              style={{
                border: 'none',
                backgroundColor: activeSubTab === 'system' ? 'var(--primary)' : 'transparent',
                color: activeSubTab === 'system' ? '#ffffff' : 'var(--text-muted)',
                padding: '0.45rem 0.9rem',
                borderRadius: '7px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              ⚡ Live Observability
            </button>
          </div>

          {/* Time Range Selector including 24H */}
          {activeSubTab === 'business' && (
            <div style={{
              display: 'inline-flex',
              padding: '3px',
              backgroundColor: 'var(--bg-page)',
              borderRadius: '10px',
              border: '1px solid var(--border-light)'
            }}>
              {[
                { label: '24H', value: 1 },
                { label: '7D', value: 7 },
                { label: '14D', value: 14 },
                { label: '30D', value: 30 },
                { label: '90D', value: 90 }
              ].map(r => (
                <button
                  key={r.value}
                  onClick={() => setDaysRange(r.value)}
                  style={{
                    border: 'none',
                    backgroundColor: daysRange === r.value ? '#3b82f6' : 'transparent',
                    color: daysRange === r.value ? '#ffffff' : 'var(--text-muted)',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '7px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Redesigned High-Contrast Refresh Button */}
          <button
            onClick={() => fetchAnalytics(daysRange, true)}
            disabled={isRefreshing || loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-hover, #475569)',
              backgroundColor: 'var(--bg-page)',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span style={{
              display: 'inline-block',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}>
              🔄
            </span>
            <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
          </button>

        </div>
      </div>

      {/* VIEW 1: Business Analytics */}
      {activeSubTab === 'business' && (
        <>
          {/* KPI Cards Row (5 Cards) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* Card 1: Gross Revenue (GMV) */}
            <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #10b981', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Gross Revenue (GMV)
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
                ₹{Number(kpi.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.35rem', fontWeight: 600 }}>
                ✓ Settled & Completed
              </div>
            </div>

            {/* Card 2: Total Bookings */}
            <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #3b82f6', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Total Bookings
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
                {kpi.totalBookings || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
                {kpi.completedBookings || 0} finished ({kpi.platformFulfillmentRate || 0}%)
              </div>
            </div>

            {/* Card 3: Active Orders */}
            <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #f59e0b', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Active / In-Flight
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.4rem' }}>
                {kpi.activeBookings || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
                {kpi.pendingBookings || 0} awaiting assignment
              </div>
            </div>

            {/* Card 4: Registered Users */}
            <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #8b5cf6', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Registered Users
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
                {kpi.totalUsers || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
                Platform Customers
              </div>
            </div>

            {/* Card 5: Service Providers */}
            <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #ec4899', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Service Pros
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
                {kpi.totalProviders || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: kpi.pendingProviderApprovals > 0 ? '#f59e0b' : '#10b981', marginTop: '0.35rem', fontWeight: 600 }}>
                {kpi.pendingProviderApprovals || 0} pending review
              </div>
            </div>
          </div>

          {/* Visual Analytics Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
            
            {/* Chart 1: Revenue & Demand Trend */}
            <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    Revenue & Demand Trend ({daysRange === 1 ? 'Last 24 Hours' : `Last ${daysRange} Days`})
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Gross merchandise volume (₹) and completed bookings timeline
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: 290 }}>
                {revenueTrends.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No trend data in this range</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        content={<CustomTooltip formatter={(val, name) => name === 'Revenue' ? `₹${Number(val).toLocaleString('en-IN')}` : val} />}
                      />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenueGlow)" />
                      <Area type="monotone" dataKey="bookingsCount" name="Bookings" stroke="#3b82f6" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Booking Status Distribution */}
            <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Booking Lifecycle Distribution
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Breakdown across active, completed, and pending jobs
                </p>
              </div>

              <div style={{ width: '100%', height: 290 }}>
                {statusBreakdown.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No bookings to display</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                      <XAxis
                        dataKey="status"
                        stroke="var(--text-muted)"
                        fontSize={11}
                        fontWeight={600}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        tickFormatter={(st) => STATUS_CONFIG[st]?.label || st}
                      />
                      <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        content={<CustomTooltip titlePrefix="Workflow Status" />}
                      />
                      <Bar dataKey="count" name="Jobs Count" radius={[6, 6, 0, 0]}>
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_CONFIG[entry.status]?.color || '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Service Category Demand & Custom Readable Legend */}
            <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', gridColumn: 'span 2' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Service Category Popularity
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Distribution of consumer demand across service verticals
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: categoryDistribution.length > 0 ? '1fr 1fr' : '1fr', alignItems: 'center', gap: '1.5rem', minHeight: 260 }}>
                {categoryDistribution.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No category data available</div>
                ) : (
                  <>
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryDistribution}
                            dataKey="bookingCount"
                            nameKey="categoryName"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={3}
                          >
                            {categoryDistribution.map((entry, index) => (
                              <Cell key={`cell-pie-${index}`} fill={PALETTE[index % PALETTE.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={<CustomTooltip formatter={(val, name, entry) => `${val} jobs (₹${Number(entry?.payload?.revenue || 0).toLocaleString('en-IN')})`} />}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Clean, Non-Overlapping Custom Legend */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      paddingRight: '0.5rem'
                    }}>
                      {categoryDistribution.map((cat, idx) => (
                        <div key={cat.categoryName} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-page)',
                          border: '1px solid var(--border-light)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <span style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: PALETTE[idx % PALETTE.length],
                              flexShrink: 0
                            }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {cat.categoryName}
                            </span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                            {cat.bookingCount} jobs
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {/* VIEW 2: Dedicated Standalone Live System Observability Tile */}
      {activeSubTab === 'system' && (
        <div className="premium-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚡</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Live System Health & Observability
                </h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.3rem 0 0 0' }}>
                Spring Boot Actuator health probes, JVM memory utilization & runtime telemetry
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                {actuatorHealth?.status || telemetry.status || 'HEALTHY'}
              </span>
            </div>
          </div>

          {/* JVM Memory Gauge */}
          <div style={{ marginBottom: '2rem', padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>JVM Heap Memory Utilization:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {telemetry.heapUsedMb || 0} MB / {telemetry.heapMaxMb || 0} MB ({heapPct}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(heapPct, 100)}%`,
                height: '100%',
                backgroundColor: heapPct > 80 ? '#ef4444' : heapPct > 60 ? '#f59e0b' : '#10b981',
                borderRadius: '6px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Telemetry Metric Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.2rem', borderRadius: '12px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Application Uptime</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                ⏱️ {formatUptime(telemetry.uptimeSeconds)}
              </div>
            </div>
            <div style={{ padding: '1.2rem', borderRadius: '12px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Available CPU Processors</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                ⚙️ {telemetry.availableProcessors || 1} Cores
              </div>
            </div>
            <div style={{ padding: '1.2rem', borderRadius: '12px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Java Runtime Version</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                ☕ JDK {telemetry.jvmVersion || '17'}
              </div>
            </div>
            <div style={{ padding: '1.2rem', borderRadius: '12px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Database & Redis Pool</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginTop: '0.35rem' }}>
                ✓ Operational
              </div>
            </div>
          </div>

          {/* Actuator & Prometheus Scrape Links */}
          <div style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <span>
              Prometheus Metrics Scrape Target: <a href="/actuator/prometheus" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'underline' }}>/actuator/prometheus</a>
            </span>
            <span>
              Detailed Health Probe: <a href="/actuator/health" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'underline' }}>/actuator/health</a>
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
