import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { 
  TrendingUp, RefreshCw, Calendar, DollarSign, Users, Briefcase, 
  ArrowUpRight, ArrowDownRight, Layers, CheckCircle2, Clock, AlertTriangle, Filter
} from 'lucide-react';
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
  IN_TRANSIT: { label: 'In Transit', color: '#06b6d4' },
  COMPLETED: { label: 'Completed', color: '#10b981' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444' }
};

export default function AnalyticsDashboardTab({ 
  categories = [], 
  providers = [], 
  bookings = [], 
  users = [], 
  totalRevenue = 0,
  onRefresh
}) {
  const [daysRange, setDaysRange] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [error, setError] = useState(null);

  // Fetch backend platform analytics overview
  const fetchAnalytics = async (days = daysRange, isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (onRefresh && isManual) {
        await onRefresh();
      }
      const res = await api.admin.getAnalytics(days);
      setServerData(res);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Backend analytics sync notice:', err);
      // We still have client-side reactive computation over `bookings` and `providers`
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(daysRange, false);
  }, [daysRange]);

  // Reactive Analytics Engine: Computes time-windowed metrics & series dynamically
  const dynamicAnalytics = useMemo(() => {
    const now = new Date();
    const rangeMs = daysRange * 24 * 60 * 60 * 1000;
    const rangeStartTime = new Date(now.getTime() - rangeMs);
    const prevRangeStartTime = new Date(now.getTime() - (rangeMs * 2));

    // Filter bookings by category if selected
    const categoryFilteredBookings = bookings.filter(b => {
      if (selectedCategory === 'ALL') return true;
      const catName = b.service?.category?.name || b.categoryName || 'General';
      return catName.toLowerCase() === selectedCategory.toLowerCase();
    });

    // Helper to get booking date timestamp
    const getBookingTime = (b) => {
      if (b.bookingDate) {
        const dt = new Date(b.bookingDate);
        if (!isNaN(dt.getTime())) {
          if (b.startTime) {
            const parts = b.startTime.split(':');
            dt.setHours(parseInt(parts[0] || 0), parseInt(parts[1] || 0));
          }
          return dt;
        }
      }
      if (b.createdAt) {
        const dt = new Date(b.createdAt);
        if (!isNaN(dt.getTime())) return dt;
      }
      return new Date();
    };

    // Partition bookings into current period vs previous period
    const currentPeriodBookings = [];
    const prevPeriodBookings = [];

    categoryFilteredBookings.forEach(b => {
      const bTime = getBookingTime(b);
      if (bTime >= rangeStartTime && bTime <= now) {
        currentPeriodBookings.push(b);
      } else if (bTime >= prevRangeStartTime && bTime < rangeStartTime) {
        prevPeriodBookings.push(b);
      }
    });

    // Compute period KPI metrics
    let periodRevenue = 0;
    let periodCompleted = 0;
    let periodActive = 0;
    let periodPending = 0;
    let periodCancelled = 0;

    currentPeriodBookings.forEach(b => {
      const isPaidOrCompleted = b.paymentStatus === 'PAID' || b.status === 'COMPLETED';
      const amt = Number(b.finalAmount) || 0;
      if (isPaidOrCompleted) {
        periodRevenue += amt;
      }
      if (b.status === 'COMPLETED') periodCompleted++;
      else if (['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'IN_TRANSIT'].includes(b.status)) periodActive++;
      else if (b.status === 'PENDING') periodPending++;
      else if (b.status === 'CANCELLED') periodCancelled++;
    });

    let prevRevenue = 0;
    prevPeriodBookings.forEach(b => {
      const isPaidOrCompleted = b.paymentStatus === 'PAID' || b.status === 'COMPLETED';
      if (isPaidOrCompleted) {
        prevRevenue += Number(b.finalAmount) || 0;
      }
    });

    // Growth rate
    let revenueGrowth = 0;
    if (prevRevenue > 0) {
      revenueGrowth = ((periodRevenue - prevRevenue) / prevRevenue) * 100;
    } else if (periodRevenue > 0) {
      revenueGrowth = 100;
    }

    const nonCancelled = currentPeriodBookings.length - periodCancelled;
    const fulfillmentRate = nonCancelled > 0 
      ? Math.round(((periodCompleted / nonCancelled) * 100) * 10) / 10 
      : (currentPeriodBookings.length > 0 ? 100 : 0);

    const avgOrderValue = currentPeriodBookings.length > 0 
      ? Math.round(periodRevenue / currentPeriodBookings.length) 
      : 0;

    // Lifetime metrics
    const lifetimeRevenue = totalRevenue || bookings
      .filter(b => b.paymentStatus === 'PAID' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (Number(b.finalAmount) || 0), 0);

    // Compute Trend Timeline
    let revenueTrends = [];
    if (daysRange === 1) {
      // 24 Hours breakdown by 4-hour intervals
      const timeBuckets = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
      const bucketRevenue = { '00:00': 0, '04:00': 0, '08:00': 0, '12:00': 0, '16:00': 0, '20:00': 0, '23:59': 0 };
      const bucketCounts = { '00:00': 0, '04:00': 0, '08:00': 0, '12:00': 0, '16:00': 0, '20:00': 0, '23:59': 0 };

      currentPeriodBookings.forEach(b => {
        const bTime = getBookingTime(b);
        const hour = bTime.getHours();
        let bucket = '00:00';
        if (hour >= 20) bucket = '20:00';
        else if (hour >= 16) bucket = '16:00';
        else if (hour >= 12) bucket = '12:00';
        else if (hour >= 8) bucket = '08:00';
        else if (hour >= 4) bucket = '04:00';

        bucketCounts[bucket] = (bucketCounts[bucket] || 0) + 1;
        if (b.paymentStatus === 'PAID' || b.status === 'COMPLETED') {
          bucketRevenue[bucket] = (bucketRevenue[bucket] || 0) + (Number(b.finalAmount) || 0);
        }
      });

      revenueTrends = timeBuckets.map(b => ({
        date: b,
        revenue: bucketRevenue[b] || 0,
        bookingsCount: bucketCounts[b] || 0
      }));
    } else {
      // Daily breakdown
      const daysCount = Math.min(daysRange, 30);
      const dailyMap = new Map();

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const key = daysRange === 7 
          ? d.toLocaleDateString('en-US', { weekday: 'short' }) 
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyMap.set(key, { date: key, revenue: 0, bookingsCount: 0 });
      }

      currentPeriodBookings.forEach(b => {
        const bTime = getBookingTime(b);
        const key = daysRange === 7 
          ? bTime.toLocaleDateString('en-US', { weekday: 'short' }) 
          : bTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyMap.has(key)) {
          const entry = dailyMap.get(key);
          entry.bookingsCount += 1;
          if (b.paymentStatus === 'PAID' || b.status === 'COMPLETED') {
            entry.revenue += (Number(b.finalAmount) || 0);
          }
        }
      });

      revenueTrends = Array.from(dailyMap.values());
    }

    // Status Breakdown for selected range
    const statusCountsMap = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      IN_TRANSIT: 0,
      ASSIGNED: 0,
      PENDING: 0,
      CANCELLED: 0
    };

    const targetList = currentPeriodBookings.length > 0 ? currentPeriodBookings : bookings;
    targetList.forEach(b => {
      const st = b.status || 'PENDING';
      if (statusCountsMap[st] !== undefined) {
        statusCountsMap[st]++;
      } else {
        statusCountsMap[st] = 1;
      }
    });

    const statusBreakdown = Object.entries(statusCountsMap)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({ status, count }));

    // Category Distribution for selected range
    const catMap = new Map();
    targetList.forEach(b => {
      const cName = b.service?.category?.name || b.categoryName || 'General Maintenance';
      const isPaidOrDone = b.paymentStatus === 'PAID' || b.status === 'COMPLETED';
      const amt = Number(b.finalAmount) || 0;

      if (!catMap.has(cName)) {
        catMap.set(cName, { categoryName: cName, bookingCount: 0, revenue: 0 });
      }
      const item = catMap.get(cName);
      item.bookingCount += 1;
      if (isPaidOrDone) {
        item.revenue += amt;
      }
    });

    const categoryDistribution = Array.from(catMap.values())
      .sort((a, b) => b.bookingCount - a.bookingCount);

    return {
      periodRevenue,
      periodBookings: currentPeriodBookings.length,
      periodCompleted,
      periodActive,
      periodPending,
      fulfillmentRate,
      avgOrderValue,
      revenueGrowth,
      lifetimeRevenue,
      totalBookingsAllTime: bookings.length,
      revenueTrends,
      statusBreakdown,
      categoryDistribution,
      totalProviders: providers.length,
      pendingProviders: providers.filter(p => !p.approved).length,
      totalUsers: users.length
    };
  }, [daysRange, selectedCategory, bookings, providers, users, totalRevenue]);

  // Use dynamic reactive calculations (with serverData fallback)
  const kpi = {
    periodRevenue: dynamicAnalytics.periodRevenue,
    periodBookings: dynamicAnalytics.periodBookings,
    periodCompleted: dynamicAnalytics.periodCompleted,
    periodActive: dynamicAnalytics.periodActive,
    periodPending: dynamicAnalytics.periodPending,
    fulfillmentRate: dynamicAnalytics.fulfillmentRate,
    avgOrderValue: dynamicAnalytics.avgOrderValue,
    revenueGrowth: dynamicAnalytics.revenueGrowth,
    lifetimeRevenue: dynamicAnalytics.lifetimeRevenue,
    totalBookingsAllTime: dynamicAnalytics.totalBookingsAllTime,
    totalProviders: dynamicAnalytics.totalProviders,
    pendingProviders: dynamicAnalytics.pendingProviders,
    totalUsers: dynamicAnalytics.totalUsers
  };

  const revenueTrends = dynamicAnalytics.revenueTrends;
  const categoryDistribution = dynamicAnalytics.categoryDistribution;
  const statusBreakdown = dynamicAnalytics.statusBreakdown;

  // Custom theme-aware Recharts Tooltip
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

  const rangeLabel = daysRange === 1 ? '24 Hours' : `${daysRange} Days`;

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
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              fontSize: '0.72rem',
              fontWeight: 700,
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
              Live Active
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time business performance indicators, revenue velocity & booking analytics
          </p>
        </div>

        {/* Action Controls: Time Range Pills, Category Filter & Live Sync */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          
          {/* Category Vertical Filter Dropdown */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-control"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '10px',
                height: '36px',
                minWidth: '140px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Time Range Pills: 24H, 7D, 14D, 30D, 90D */}
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
            ].map(r => {
              const isActive = daysRange === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => setDaysRange(r.value)}
                  style={{
                    border: 'none',
                    backgroundColor: isActive ? '#3b82f6' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '7px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.35)' : 'none'
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Live Sync Button with Real-Time Refresh Status */}
          <button
            onClick={() => fetchAnalytics(daysRange, true)}
            disabled={isRefreshing || loading}
            title={`Last synced at ${lastSyncedTime}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.15rem',
              borderRadius: '10px',
              border: '1px solid var(--border-hover, #475569)',
              backgroundColor: 'var(--bg-page)',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} style={{ color: '#3b82f6' }} />
            <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
          </button>

        </div>
      </div>

      {/* KPI Cards Row (5 Dynamic High-Performance Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Gross Revenue (GMV in Range) */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #10b981', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
              {rangeLabel} Revenue
            </span>
            {kpi.revenueGrowth !== 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.15rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: kpi.revenueGrowth >= 0 ? '#10b981' : '#ef4444'
              }}>
                {kpi.revenueGrowth >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(Math.round(kpi.revenueGrowth))}%
              </span>
            )}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
            ₹{Number(kpi.periodRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
            Lifetime: <strong style={{ color: '#10b981' }}>₹{Number(kpi.lifetimeRevenue || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Card 2: Total Bookings (in Range) */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #3b82f6', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
              {rangeLabel} Bookings
            </span>
            <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700 }}>
              {kpi.fulfillmentRate}% fulfilled
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
            {kpi.periodBookings || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
            {kpi.periodCompleted || 0} finished • {kpi.totalBookingsAllTime} all-time
          </div>
        </div>

        {/* Card 3: Average Order Value (AOV) */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #8b5cf6', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Avg Order Value (AOV)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.4rem' }}>
            ₹{Number(kpi.avgOrderValue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
            Basket size per booking
          </div>
        </div>

        {/* Card 4: Active / In-Flight Dispatches */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #f59e0b', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Active / In-Flight
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.4rem' }}>
            {kpi.periodActive || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
            {kpi.periodPending || 0} awaiting assignment
          </div>
        </div>

        {/* Card 5: Service Pros & Capacity */}
        <div className="premium-card" style={{ padding: '1.4rem', borderTop: '4px solid #ec4899', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Service Pros
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
            {kpi.totalProviders || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: kpi.pendingProviders > 0 ? '#f59e0b' : '#10b981', marginTop: '0.35rem', fontWeight: 600 }}>
            {kpi.pendingProviders || 0} pending review
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
                    content={<CustomTooltip formatter={(val, name) => name === 'Revenue' ? `₹${Number(val).toLocaleString('en-IN')}` : `${val} jobs`} />}
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
              Booking Lifecycle Distribution ({rangeLabel})
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Breakdown across active, completed, and pending jobs
            </p>
          </div>

          <div style={{ width: '100%', height: 290 }}>
            {statusBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No bookings in this period</div>
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
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Service Category Popularity & Revenue ({rangeLabel})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Distribution of consumer demand across service verticals
              </p>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {categoryDistribution.length} Active Verticals
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: categoryDistribution.length > 0 ? '1fr 1fr' : '1fr', alignItems: 'center', gap: '1.5rem', minHeight: 260 }}>
            {categoryDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No category data available in this timeframe</div>
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
                        {cat.bookingCount} jobs • ₹{Number(cat.revenue || 0).toLocaleString('en-IN')}
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
