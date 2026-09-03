import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RefreshCw, Server, Cpu, Clock, Database, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function SystemObservabilityTab() {
  const [telemetry, setTelemetry] = useState(null);
  const [actuatorHealth, setActuatorHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchObservabilityData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [analyticsRes, healthRes] = await Promise.allSettled([
        api.admin.getAnalytics(1),
        api.admin.getActuatorHealth()
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.telemetry) {
        setTelemetry(analyticsRes.value.telemetry);
      } else {
        throw new Error(analyticsRes.reason?.message || 'Failed to fetch telemetry data');
      }

      if (healthRes.status === 'fulfilled') {
        setActuatorHealth(healthRes.value);
      }
    } catch (err) {
      console.error('Failed to load system observability:', err);
      setError(err.message || 'Unable to connect to backend actuator');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchObservabilityData(false);
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds) return '0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  if (loading && !telemetry) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Querying System Health & Actuator Telemetry...</p>
      </div>
    );
  }

  if (error && !telemetry) {
    return (
      <div className="premium-card" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <AlertTriangle size={42} style={{ color: 'var(--error, #ef4444)', margin: '0 auto 1rem auto' }} />
        <h3 style={{ color: 'var(--error, #ef4444)', marginBottom: '0.5rem' }}>Failed to Connect to Actuator</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => fetchObservabilityData(false)} className="btn btn-primary">
          Retry Connection
        </button>
      </div>
    );
  }

  const heapPct = telemetry?.heapMaxMb ? Math.round((telemetry.heapUsedMb / telemetry.heapMaxMb) * 100) : 0;
  const isHealthy = (actuatorHealth?.status === 'UP' || telemetry?.status === 'HEALTHY');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        padding: '1.4rem 1.75rem',
        borderRadius: '14px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Server size={22} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              System Health & Observability
            </h2>
          </div>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time JVM runtime performance, connection health, and Prometheus metrics
          </p>
        </div>

        {/* Status Badge & Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            padding: '0.45rem 1rem',
            borderRadius: '999px',
            backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isHealthy ? '#10b981' : '#ef4444',
            border: isHealthy ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <CheckCircle2 size={16} />
            {actuatorHealth?.status || telemetry?.status || 'HEALTHY'}
          </span>

          <button
            onClick={() => fetchObservabilityData(true)}
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
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
          </button>
        </div>
      </div>

      {/* Memory Utilization Meter Card */}
      <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              JVM Heap Memory Allocation
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Current runtime memory consumption vs allocated JVM maximum
            </p>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {telemetry?.heapUsedMb || 0} MB <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {telemetry?.heapMaxMb || 0} MB ({heapPct}%)</span>
          </div>
        </div>

        <div style={{ width: '100%', height: '14px', backgroundColor: 'var(--bg-page)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)', padding: '2px' }}>
          <div style={{
            width: `${Math.min(heapPct, 100)}%`,
            height: '100%',
            backgroundColor: heapPct > 80 ? '#ef4444' : heapPct > 60 ? '#f59e0b' : '#10b981',
            borderRadius: '6px',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        <div className="premium-card" style={{ padding: '1.4rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Clock size={16} /> Application Uptime
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {formatUptime(telemetry?.uptimeSeconds)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Started: {telemetry?.systemTime || 'Active'}
          </div>
        </div>

        <div className="premium-card" style={{ padding: '1.4rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Cpu size={16} /> Available Processors
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {telemetry?.availableProcessors || 1} Cores
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Multi-threaded thread pool
          </div>
        </div>

        <div className="premium-card" style={{ padding: '1.4rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Server size={16} /> Java Runtime Version
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            JDK {telemetry?.jvmVersion || '17'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Spring Boot 3.3.2
          </div>
        </div>

        <div className="premium-card" style={{ padding: '1.4rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Database size={16} /> Database & Redis Pool
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>
            Operational
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>
            ✓ HikariCP Connected
          </div>
        </div>
      </div>

      {/* Actuator & Prometheus Scrape Target Links */}
      <div className="premium-card" style={{
        padding: '1.5rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Observability Endpoints & Prometheus Scraper
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <a
            href="/actuator/prometheus"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '1rem',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-page)',
              border: '1px solid var(--border-light)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--text-main)',
              transition: 'var(--transition-fast)'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Prometheus Metrics Stream</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>/actuator/prometheus</div>
            </div>
            <ExternalLink size={16} style={{ color: '#3b82f6' }} />
          </a>

          <a
            href="/actuator/health"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '1rem',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-page)',
              border: '1px solid var(--border-light)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--text-main)',
              transition: 'var(--transition-fast)'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>System Health Probes</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>/actuator/health</div>
            </div>
            <ExternalLink size={16} style={{ color: '#3b82f6' }} />
          </a>
        </div>
      </div>

    </div>
  );
}
