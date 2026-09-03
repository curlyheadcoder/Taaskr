import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

const STATUS_COLOR_MAP = {
  PENDING: '#f59e0b',
  ASSIGNED: '#3b82f6',
  ACCEPTED: '#6366f1',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444'
};

export default function AnalyticsDashboardTab() {
  const [daysRange, setDaysRange] = useState(30);
  const [data, setData] = useState(null);
  const [actuatorHealth, setActuatorHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (days = daysRange) => {
    setLoading(true);
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
      console.error('Failed to load analytics data:', err);
      setError(err.message || 'Unable to connect to analytics engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(daysRange);
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

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }}>⚡</div>
        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Aggregating platform intelligence and observability metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="premium-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--error, #ef4444)', marginBottom: '0.75rem' }}>Failed to Load Analytics</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => fetchAnalytics(daysRange)} className="btn btn-primary">
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Header & Range Filter Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        background: 'var(--card-bg, rgba(255, 255, 255, 0.05))',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Platform Analytics & System Observability
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time business performance indicators & live JVM actuator telemetry
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Time Range:</span>
          <select
            value={daysRange}
            onChange={(e) => setDaysRange(Number(e.target.value))}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-page, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button
            onClick={() => fetchAnalytics(daysRange)}
            className="btn btn-secondary btn-small"
            title="Refresh metrics"
            disabled={loading}
          >
            🔄 {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Total GMV Revenue */}
        <div className="premium-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Gross Revenue (GMV)
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            ₹{Number(kpi.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.35rem', fontWeight: 500 }}>
            ✓ Settled & Completed Orders
          </div>
        </div>

        {/* Card 2: Total Bookings */}
        <div className="premium-card" style={{ padding: '1.5rem', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total Bookings
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {kpi.totalBookings || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {kpi.completedBookings || 0} completed ({kpi.platformFulfillmentRate || 0}% rate)
          </div>
        </div>

        {/* Card 3: Active Operations */}
        <div className="premium-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Active / In-Flight
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.5rem' }}>
            {kpi.activeBookings || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {kpi.pendingBookings || 0} awaiting assignment
          </div>
        </div>

        {/* Card 4: Registered Users */}
        <div className="premium-card" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Registered Users
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {kpi.totalUsers || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Platform Customers
          </div>
        </div>

        {/* Card 5: Providers */}
        <div className="premium-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ec4899' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Service Pros
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {kpi.totalProviders || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: kpi.pendingProviderApprovals > 0 ? '#f59e0b' : '#10b981', marginTop: '0.35rem', fontWeight: 500 }}>
            {kpi.pendingProviderApprovals || 0} pending review
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        
        {/* Chart 1: Revenue & Booking Volume Area Chart */}
        <div className="premium-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Revenue & Demand Trend
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily GMV (₹) and completed bookings count</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {revenueTrends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No data in this time range</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg, #1e293b)',
                      borderColor: 'var(--border-color, #334155)',
                      borderRadius: '8px',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '0.85rem'
                    }}
                    formatter={(value, name) => [name === 'revenue' ? `₹${Number(value).toLocaleString('en-IN')}` : value, name === 'revenue' ? 'Revenue' : 'Bookings']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" name="revenue" />
                  <Area type="monotone" dataKey="bookingsCount" stroke="#6366f1" strokeWidth={2} fillOpacity={0} name="bookings" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Booking Status Funnel / Breakdown */}
        <div className="premium-card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Booking Lifecycle Distribution
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status breakdown across active, completed and pending jobs</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {statusBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No bookings to display</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                  <XAxis dataKey="status" stroke="var(--text-muted)" fontSize={10} interval={0} angle={-25} textAnchor="end" />
                  <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg, #1e293b)',
                      borderColor: 'var(--border-color, #334155)',
                      borderRadius: '8px',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <Bar dataKey="count" name="Jobs Count" radius={[6, 6, 0, 0]}>
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLOR_MAP[entry.status] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Service Category Demand Share */}
        <div className="premium-card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Service Category Popularity
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Distribution of bookings across service verticals</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            {categoryDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No category data available</div>
            ) : (
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, entry) => [
                      `${val} bookings (₹${Number(entry.payload.revenue || 0).toLocaleString('en-IN')})`,
                      entry.payload.categoryName
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live System Telemetry & Health Panel */}
        <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Live System Observability
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Spring Boot Actuator & JVM telemetry</span>
              </div>
              <span className="badge badge-completed" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                ● {actuatorHealth?.status || telemetry.status || 'UP'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Heap Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>JVM Heap Utilization:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {telemetry.heapUsedMb || 0} MB / {telemetry.heapMaxMb || 0} MB ({heapPct}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(150, 150, 150, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(heapPct, 100)}%`,
                    height: '100%',
                    background: heapPct > 80 ? '#ef4444' : heapPct > 60 ? '#f59e0b' : '#10b981',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>

              {/* Stat rows */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-page, rgba(0,0,0,0.03))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uptime</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    ⏱️ {formatUptime(telemetry.uptimeSeconds)}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-page, rgba(0,0,0,0.03))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPU Processors</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    ⚙️ {telemetry.availableProcessors || 1} Cores
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-page, rgba(0,0,0,0.03))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Java Version</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    ☕ JDK {telemetry.jvmVersion || '17'}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-page, rgba(0,0,0,0.03))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Redis & Database</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#10b981', marginTop: '0.2rem' }}>
                    ✓ Connected
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color, rgba(0,0,0,0.08))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Prometheus Scrape: <a href="/actuator/prometheus" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>/actuator/prometheus</a>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Health: <a href="/actuator/health" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>/actuator/health</a>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
