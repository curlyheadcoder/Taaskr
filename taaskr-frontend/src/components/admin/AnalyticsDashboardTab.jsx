import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PALETTE = [
  '#3b82f6', // Bright Blue
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
  const [activeView, setActiveView] = useState('all'); // 'all', 'business', 'system'
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
        throw new Error(analyticsRes.reason?.message || 'Failed to fetch analytics data');
      }

      if (healthRes.status === 'fulfilled') {
        setActuatorHealth(healthRes.value);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Unable to load analytics');
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

  // High contrast custom tooltip for charts
  const CustomTooltip = ({ active, payload, label, formatter, titlePrefix }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          fontSize: '0.875rem',
          minWidth: '150px'
        }}>
          <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.35rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
            {titlePrefix ? `${titlePrefix}: ${label}` : label}
          </div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.25rem' }}>
              <span style={{ color: entry.color || '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color || '#64748b' }}></span>
                {entry.name || 'Value'}:
              </span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
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
        <p style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>Aggregating Platform Intelligence & Metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="premium-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444', marginBottom: '0.75rem' }}>Failed to Load Analytics</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => fetchAnalytics(daysRange, false)} className="btn btn-primary">
          Retry Aggregation
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
      
      {/* Top Header & Range Control Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem 1.75rem',
        borderRadius: '14px',
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
              Platform Analytics & Observability
            </h2>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted, #64748b)' }}>
            Real-time business performance indicators and live system metrics
          </p>
        </div>

        {/* Action Controls (Range Selector + Modern Refresh Button) */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Time Range Pills */}
          <div style={{
            display: 'inline-flex',
            padding: '3px',
            background: 'var(--bg-page, #f1f5f9)',
            borderRadius: '10px',
            border: '1px solid var(--border-color, #e2e8f0)'
          }}>
            {[
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
                  background: daysRange === r.value ? 'var(--primary, #2563eb)' : 'transparent',
                  color: daysRange === r.value ? '#ffffff' : 'var(--text-main, #475569)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '7px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Redesigned Modern Refresh Button */}
          <button
            onClick={() => fetchAnalytics(daysRange, true)}
            disabled={isRefreshing || loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              border: '1px solid var(--primary, #2563eb)',
              backgroundColor: isRefreshing ? 'var(--primary, #2563eb)' : 'transparent',
              color: isRefreshing ? '#ffffff' : 'var(--primary, #2563eb)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isRefreshing ? '0 0 12px rgba(37,99,235,0.3)' : 'none'
            }}
          >
            <span style={{
              display: 'inline-block',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}>
              🔄
            </span>
            <span>{isRefreshing ? 'Refreshing...' : 'Live Sync'}</span>
          </button>

        </div>
      </div>

      {/* KPI Cards Row (5 Cards Cleanly Distributed) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Gross Revenue (GMV) */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #10b981', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>
            Gross Revenue (GMV)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '0.4rem' }}>
            ₹{Number(kpi.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.35rem', fontWeight: 600 }}>
            ✓ Settled & Completed
          </div>
        </div>

        {/* Card 2: Total Bookings */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #3b82f6', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>
            Total Bookings
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '0.4rem' }}>
            {kpi.totalBookings || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '0.35rem', fontWeight: 500 }}>
            {kpi.completedBookings || 0} finished ({kpi.platformFulfillmentRate || 0}%)
          </div>
        </div>

        {/* Card 3: Active Orders */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #f59e0b', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>
            Active / In-Flight
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.4rem' }}>
            {kpi.activeBookings || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '0.35rem', fontWeight: 500 }}>
            {kpi.pendingBookings || 0} awaiting assignment
          </div>
        </div>

        {/* Card 4: Registered Users */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #8b5cf6', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>
            Registered Users
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '0.4rem' }}>
            {kpi.totalUsers || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '0.35rem', fontWeight: 500 }}>
            Platform Customers
          </div>
        </div>

        {/* Card 5: Service Providers */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #ec4899', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>
            Service Pros
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '0.4rem' }}>
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
        <div className="premium-card" style={{ padding: '1.75rem', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                Revenue & Demand Trend
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.2rem 0 0 0' }}>
                Daily gross merchandise volume (₹) and scheduled jobs
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
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
        <div className="premium-card" style={{ padding: '1.75rem', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
              Booking Lifecycle Distribution
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.2rem 0 0 0' }}>
              Breakdown across active, completed, and pending jobs
            </p>
          </div>

          <div style={{ width: '100%', height: 290 }}>
            {statusBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No bookings to display</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="status"
                    stroke="#475569"
                    fontSize={11}
                    fontWeight={600}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    tickFormatter={(st) => STATUS_CONFIG[st]?.label || st}
                  />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
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
        <div className="premium-card" style={{ padding: '1.75rem', background: 'var(--card-bg, #ffffff)' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
              Service Category Popularity
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.2rem 0 0 0' }}>
              Distribution of consumer demand across service verticals
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: categoryDistribution.length > 0 ? '1fr 1fr' : '1fr', alignItems: 'center', gap: '1rem', minHeight: 260 }}>
            {categoryDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No category data available</div>
            ) : (
              <>
                <div style={{ width: '100%', height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        dataKey="bookingCount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
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
                  gap: '0.5rem',
                  maxHeight: '230px',
                  overflowY: 'auto',
                  paddingRight: '0.5rem'
                }}>
                  {categoryDistribution.map((cat, idx) => (
                    <div key={cat.categoryName} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '6px',
                      background: 'var(--bg-page, #f8fafc)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: PALETTE[idx % PALETTE.length],
                          flexShrink: 0
                        }} />
                        <span style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {cat.categoryName}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        {cat.bookingCount}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Panel 4: Live System Telemetry & Observability */}
        <div className="premium-card" style={{ padding: '1.75rem', background: 'var(--card-bg, #ffffff)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                  Live System Observability
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.2rem 0 0 0' }}>
                  Spring Boot Actuator health & JVM runtime status
                </p>
              </div>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                {actuatorHealth?.status || telemetry.status || 'HEALTHY'}
              </span>
            </div>

            {/* Heap Meter */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>JVM Memory Utilization:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {telemetry.heapUsedMb || 0} MB / {telemetry.heapMaxMb || 0} MB ({heapPct}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '9px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(heapPct, 100)}%`,
                  height: '100%',
                  background: heapPct > 80 ? '#ef4444' : heapPct > 60 ? '#f59e0b' : '#10b981',
                  borderRadius: '6px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Metric Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-page, #f8fafc)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>System Uptime</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  ⏱️ {formatUptime(telemetry.uptimeSeconds)}
                </div>
              </div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-page, #f8fafc)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CPU Processors</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  ⚙️ {telemetry.availableProcessors || 1} Cores
                </div>
              </div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-page, #f8fafc)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Java Runtime</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  ☕ JDK {telemetry.jvmVersion || '17'}
                </div>
              </div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-page, #f8fafc)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Database & Cache</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a', marginTop: '0.2rem' }}>
                  ✓ Connected
                </div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#64748b'
          }}>
            <span>
              Prometheus Scrape: <a href="/actuator/prometheus" target="_blank" rel="noreferrer" style={{ color: 'var(--primary, #2563eb)', fontWeight: 600, textDecoration: 'underline' }}>/actuator/prometheus</a>
            </span>
            <span>
              Health: <a href="/actuator/health" target="_blank" rel="noreferrer" style={{ color: 'var(--primary, #2563eb)', fontWeight: 600, textDecoration: 'underline' }}>/actuator/health</a>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
