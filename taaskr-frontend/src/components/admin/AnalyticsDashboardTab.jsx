import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RefreshCw, TrendingUp, DollarSign, Calendar, Users, Briefcase } from 'lucide-react';
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
  const [data, setData] = useState(null);
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
      const res = await api.admin.getAnalytics(days);
      setData(res);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Unable to connect to analytics engine');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(daysRange, false);
  }, [daysRange]);

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
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
        <p style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>Aggregating Platform Intelligence & Revenue Metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="premium-card" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 style={{ color: 'var(--error, #ef4444)', marginBottom: '0.75rem' }}>Failed to Load Analytics</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => fetchAnalytics(daysRange, false)} className="btn btn-primary">
          Retry Aggregation
        </button>
      </div>
    );
  }

  const kpi = data?.kpiSummary || {};
  const revenueTrends = data?.revenueTrends || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const statusBreakdown = data?.statusBreakdown || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Header & Range Control Bar */}
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
            <TrendingUp size={22} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Dashboard Analytics
            </h2>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time business performance indicators, revenue velocity & booking analytics
          </p>
        </div>

        {/* Action Controls: Time Range Pills & Redesigned Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          
          {/* Time Range Pills including 24H */}
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
                  padding: '0.45rem 0.85rem',
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

          {/* Clean Modern Refresh Button with Lucide Icon */}
          <button
            onClick={() => fetchAnalytics(daysRange, true)}
            disabled={isRefreshing || loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.15rem',
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
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
          </button>

        </div>
      </div>

      {/* KPI Cards Row (5 Cards Cleanly Distributed) */}
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
                Gross merchandise volume (₹) and scheduled jobs timeline
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

    </div>
  );
}
