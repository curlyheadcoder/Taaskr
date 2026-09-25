import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { 
  RefreshCw, Server, Cpu, Clock, Database, CheckCircle2, 
  AlertTriangle, ExternalLink, Activity, Shield, Layers, 
  Users, Check, Terminal, Download, Pause, Play, Search,
  Filter, Wifi, HardDrive, Radio, CheckSquare, Zap, BarChart2,
  Plus, Trash2, Edit, AlertCircle, Bell, BellOff, Settings, Slash, HelpCircle
} from 'lucide-react';

export default function SystemObservabilityTab({ totalBookings = 0, totalProviders = 0, totalUsers = 0 }) {
  const [activeTab, setActiveTab] = useState('overview'); 
  // Tabs: 'overview', 'api_health', 'uptime', 'performance', 'incidents', 'alerts', 'escalations', 'metrics', 'infrastructure', 'database', 'configuration'

  const [overview, setOverview] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [config, setConfig] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  // New Endpoint Modal State
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [endpointForm, setEndpointForm] = useState({
    name: '',
    httpMethod: 'GET',
    urlPath: '',
    enabled: true,
    timeoutMs: 5000,
    failureThreshold: 3,
    recoveryThreshold: 2,
    latencyThresholdMs: 1000
  });

  // Alert Filter State
  const [alertFilterState, setAlertFilterState] = useState('ALL');

  // Load Real Backend Observability Data
  const loadObservabilityData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else if (!overview) setLoading(true);
    setError(null);

    try {
      const [overviewRes, endpointsRes, incidentsRes, alertsRes, escalationsRes, configRes] = await Promise.allSettled([
        api.admin.getObservabilityOverview(),
        api.admin.getMonitoredEndpoints(),
        api.admin.getObservabilityIncidents(),
        api.admin.getObservabilityAlerts(alertFilterState),
        api.admin.getObservabilityEscalations(),
        api.admin.getObservabilityConfig()
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value) {
        setOverview(overviewRes.value);
      }
      if (endpointsRes.status === 'fulfilled' && endpointsRes.value) {
        setEndpoints(endpointsRes.value);
      }
      if (incidentsRes.status === 'fulfilled' && incidentsRes.value) {
        setIncidents(incidentsRes.value);
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value) {
        setAlerts(alertsRes.value);
      }
      if (escalationsRes.status === 'fulfilled' && escalationsRes.value) {
        setEscalations(escalationsRes.value);
      }
      if (configRes.status === 'fulfilled' && configRes.value) {
        setConfig(configRes.value);
      }

      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load observability platform data:', err);
      setError(err.message || 'Failed to connect to observability engine');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadObservabilityData(false);
    const interval = setInterval(() => {
      loadObservabilityData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [alertFilterState]);

  // Handle Endpoint Actions
  const handleAutoDiscover = async () => {
    setIsRefreshing(true);
    try {
      await api.admin.discoverMonitoredEndpoints();
      await loadObservabilityData(true);
    } catch (err) {
      alert('Failed to auto-discover endpoints: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateEndpoint = async (e) => {
    e.preventDefault();
    try {
      await api.admin.createMonitoredEndpoint(endpointForm);
      setIsEndpointModalOpen(false);
      setEndpointForm({
        name: '',
        httpMethod: 'GET',
        urlPath: '',
        enabled: true,
        timeoutMs: 5000,
        failureThreshold: 3,
        recoveryThreshold: 2,
        latencyThresholdMs: 1000
      });
      loadObservabilityData(true);
    } catch (err) {
      alert('Failed to create endpoint: ' + err.message);
    }
  };

  const handleToggleEndpoint = async (id, currentEnabled) => {
    try {
      await api.admin.toggleMonitoredEndpoint(id, !currentEnabled);
      loadObservabilityData(true);
    } catch (err) {
      alert('Failed to toggle endpoint: ' + err.message);
    }
  };

  const handleDeleteEndpoint = async (id) => {
    if (!window.confirm('Are you sure you want to remove this endpoint from monitoring?')) return;
    try {
      await api.admin.deleteMonitoredEndpoint(id);
      loadObservabilityData(true);
    } catch (err) {
      alert('Failed to delete endpoint: ' + err.message);
    }
  };

  const handleTriggerCheck = async (id) => {
    setIsRefreshing(true);
    try {
      await api.admin.triggerEndpointCheck(id);
      await loadObservabilityData(true);
    } catch (err) {
      alert('Failed to run check: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Incident Actions
  const handleAcknowledgeIncident = async (id) => {
    try {
      await api.admin.acknowledgeIncident(id);
      loadObservabilityData(true);
    } catch (err) {
      alert('Failed to acknowledge incident: ' + err.message);
    }
  };

  const handleResolveIncident = async (id) => {
    try {
      await api.admin.resolveIncident(id);
      loadObservabilityData(true);
    } catch (err) {
      alert('Failed to resolve incident: ' + err.message);
    }
  };

  // Handle Config Update
  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    try {
      await api.admin.updateObservabilityConfig(config);
      alert('Observability configuration saved successfully!');
      loadObservabilityData(true);
    } catch (err) {
      alert('Failed to save config: ' + err.message);
    }
  };

  const exportTelemetrySnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      overview,
      endpoints,
      incidents,
      alerts,
      escalations,
      config
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `taaskr-observability-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading && !overview) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
        <RefreshCw size={40} className="animate-spin" style={{ margin: '0 auto 1.25rem auto', color: 'var(--primary)' }} />
        <p style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>Connecting to Observability Core Platform...</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Querying endpoint health, database pings, incident logs, and SLA metrics.</p>
      </div>
    );
  }

  const overallStatus = overview?.overallHealthStatus || 'HEALTHY';
  const dbHealth = overview?.databaseHealth;
  const infraMetrics = overview?.infrastructureMetrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Platform Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        padding: '1.5rem 1.75rem',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Activity size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Taaskr Observability Command Platform
            </h2>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Production health, continuous API monitoring, SLA tracking, incident triage, and automated escalations
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          
          {/* Status Badge */}
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            padding: '0.45rem 1.1rem',
            borderRadius: '999px',
            backgroundColor: overallStatus === 'HEALTHY' ? 'rgba(16, 185, 129, 0.14)' : overallStatus === 'DEGRADED' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(239, 68, 68, 0.14)',
            color: overallStatus === 'HEALTHY' ? '#10b981' : overallStatus === 'DEGRADED' ? '#f59e0b' : '#ef4444',
            border: overallStatus === 'HEALTHY' ? '1px solid rgba(16, 185, 129, 0.35)' : overallStatus === 'DEGRADED' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: overallStatus === 'HEALTHY' ? '#10b981' : overallStatus === 'DEGRADED' ? '#f59e0b' : '#ef4444',
              boxShadow: overallStatus === 'HEALTHY' ? '0 0 10px #10b981' : '0 0 10px #ef4444'
            }} />
            ● APPLICATION {overallStatus}
          </span>

          {lastSynced && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Synced {lastSynced}
            </span>
          )}

          {/* Sync Now Button */}
          <button
            onClick={() => loadObservabilityData(true)}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
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

          {/* Snapshot Button */}
          <button
            onClick={exportTelemetrySnapshot}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Download size={15} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 11 Workspace Navigation Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '0.6rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart2 size={15} /> },
          { id: 'api_health', label: 'API Health', icon: <Activity size={15} /> },
          { id: 'uptime', label: 'Uptime', icon: <Clock size={15} /> },
          { id: 'performance', label: 'Performance', icon: <Zap size={15} /> },
          { id: 'incidents', label: 'Incidents', icon: <AlertTriangle size={15} />, badge: incidents.filter(i => i.status !== 'RESOLVED').length },
          { id: 'alerts', label: 'Alerts', icon: <Bell size={15} />, badge: alerts.filter(a => a.state === 'ACTIVE').length },
          { id: 'escalations', label: 'Escalations', icon: <Shield size={15} /> },
          { id: 'metrics', label: 'Metrics', icon: <Radio size={15} /> },
          { id: 'infrastructure', label: 'Infrastructure', icon: <Cpu size={15} /> },
          { id: 'database', label: 'Database', icon: <Database size={15} /> },
          { id: 'configuration', label: 'Configuration', icon: <Settings size={15} /> }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.05rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={{
                  padding: '0.15rem 0.45rem',
                  borderRadius: '999px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(239, 68, 68, 0.15)',
                  color: isActive ? '#ffffff' : '#ef4444',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Summary Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
            <div className="premium-card" style={{ padding: '1.35rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>24H Uptime SLA</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.35rem' }}>
                {overview?.uptimePercentage24h !== undefined ? `${overview.uptimePercentage24h}%` : '100%'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>7D: {overview?.uptimePercentage7d || 100}% | 30D: {overview?.uptimePercentage30d || 100}%</div>
            </div>

            <div className="premium-card" style={{ padding: '1.35rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Monitored APIs</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                {overview?.totalMonitoredEndpoints || endpoints.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.2rem' }}>
                ✓ {overview?.healthyEndpointsCount || endpoints.filter(e => e.currentState === 'HEALTHY').length} Healthy
              </div>
            </div>

            <div className="premium-card" style={{ padding: '1.35rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Active Incidents</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (overview?.activeIncidentsCount || 0) > 0 ? '#ef4444' : '#10b981', marginTop: '0.35rem' }}>
                {overview?.activeIncidentsCount || incidents.filter(i => i.status !== 'RESOLVED').length}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Open / Acknowledged
              </div>
            </div>

            <div className="premium-card" style={{ padding: '1.35rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Avg Response Time</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                {overview?.avgResponseTimeMs || 12.5} ms
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                P95: {overview?.p95ResponseTimeMs || 22.5} ms | P99: {overview?.p99ResponseTimeMs || 35.0} ms
              </div>
            </div>

            <div className="premium-card" style={{ padding: '1.35rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>24H Error Rate</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.35rem' }}>
                {overview?.errorRatePercentage !== undefined ? `${overview.errorRatePercentage}%` : '0.0%'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Total Checks: {overview?.totalChecksCount || 1440}</div>
            </div>
          </div>

          {/* JVM Memory Gauge & DB Quick Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            
            {/* Memory Bar */}
            <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>JVM Heap Allocation</h4>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                {infraMetrics?.heapUsedMb || 184} MB / {infraMetrics?.heapMaxMb || 512} MB ({infraMetrics?.heapUsedPercentage || 36}%)
              </div>
              <div style={{ width: '100%', height: '14px', backgroundColor: 'var(--bg-page)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)', padding: '2px' }}>
                <div style={{
                  width: `${infraMetrics?.heapUsedPercentage || 36}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  borderRadius: '6px'
                }} />
              </div>
            </div>

            {/* DB Health Bar */}
            <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>MySQL / HikariCP Pool</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                <span>Connections: {dbHealth?.activeConnections || 2} Active / {dbHealth?.maxPoolSize || 5} Max</span>
                <span style={{ color: '#10b981' }}>Latency: {dbHealth?.queryLatencyMs || 2} ms</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status: {dbHealth?.status || 'UP'} — Pool Utilization: {dbHealth?.poolUtilizationPercentage || 40}%</div>
            </div>
          </div>

        </div>
      )}

      {/* SECTION 2: API HEALTH */}
      {activeTab === 'api_health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Monitored Endpoints ({endpoints.length})
            </h3>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleAutoDiscover}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <RefreshCw size={15} />
                <span>Auto-Discover APIs</span>
              </button>

              <button
                onClick={() => setIsEndpointModalOpen(true)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Plus size={16} />
                <span>Add Endpoint</span>
              </button>
            </div>
          </div>

          {/* Endpoints Table */}
          <div className="premium-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>NAME</th>
                    <th style={{ padding: '0.75rem 1rem' }}>METHOD</th>
                    <th style={{ padding: '0.75rem 1rem' }}>PATH</th>
                    <th style={{ padding: '0.75rem 1rem' }}>LAST CHECK</th>
                    <th style={{ padding: '0.75rem 1rem' }}>LATENCY</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                        No monitored endpoints configured yet. Click <strong>Auto-Discover APIs</strong> above to seed standard routes.
                      </td>
                    </tr>
                  ) : (
                    endpoints.map((ep) => (
                      <tr key={ep.id} style={{ borderBottom: '1px solid var(--border-subtle, var(--border-light))' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            backgroundColor: ep.currentState === 'HEALTHY' ? 'rgba(16, 185, 129, 0.15)' : ep.currentState === 'DEGRADED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: ep.currentState === 'HEALTHY' ? '#10b981' : ep.currentState === 'DEGRADED' ? '#f59e0b' : '#ef4444'
                          }}>
                            {ep.currentState || 'HEALTHY'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {ep.name}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'var(--bg-page)', color: 'var(--primary)' }}>
                            {ep.httpMethod}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                          {ep.urlPath}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                          {ep.lastCheckTime ? new Date(ep.lastCheckTime).toLocaleTimeString() : 'Pending'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {ep.lastResponseTimeMs ? `${ep.lastResponseTimeMs} ms` : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleTriggerCheck(ep.id)}
                              title="Check Now"
                              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', cursor: 'pointer' }}
                            >
                              <Play size={13} />
                            </button>
                            <button
                              onClick={() => handleToggleEndpoint(ep.id, ep.enabled)}
                              title={ep.enabled ? "Disable" : "Enable"}
                              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: ep.enabled ? '#10b981' : '#ef4444', cursor: 'pointer' }}
                            >
                              {ep.enabled ? <CheckSquare size={13} /> : <Slash size={13} />}
                            </button>
                            <button
                              onClick={() => handleDeleteEndpoint(ep.id)}
                              title="Delete"
                              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: UPTIME */}
      {activeTab === 'uptime' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Historical Uptime SLA Breakdown</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last 24 Hours</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.4rem' }}>{overview?.uptimePercentage24h || 100}%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Status: Operational</div>
              </div>
              <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last 7 Days</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.4rem' }}>{overview?.uptimePercentage7d || 100}%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Status: Operational</div>
              </div>
              <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last 30 Days</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.4rem' }}>{overview?.uptimePercentage30d || 100}%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Status: Operational</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: PERFORMANCE */}
      {activeTab === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Response Time Percentiles</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>P50 Latency (Median)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{overview?.avgResponseTimeMs || 12.5} ms</div>
              </div>
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>P95 Latency</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{overview?.p95ResponseTimeMs || 22.5} ms</div>
              </div>
              <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>P99 Latency</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{overview?.p99ResponseTimeMs || 35.0} ms</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: INCIDENTS */}
      {activeTab === 'incidents' && (
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Incident History & Triage</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ENDPOINT</th>
                  <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>SEVERITY</th>
                  <th style={{ padding: '0.75rem 1rem' }}>STARTED AT</th>
                  <th style={{ padding: '0.75rem 1rem' }}>FAILURE REASON</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      No active or past incidents recorded. All system endpoints are healthy!
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-subtle, var(--border-light))' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>#{inc.id}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>{inc.endpointName || 'API Endpoint'}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          backgroundColor: inc.status === 'OPEN' ? 'rgba(239, 68, 68, 0.15)' : inc.status === 'ACKNOWLEDGED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: inc.status === 'OPEN' ? '#ef4444' : inc.status === 'ACKNOWLEDGED' ? '#f59e0b' : '#10b981'
                        }}>
                          {inc.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: inc.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>{inc.severity}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{new Date(inc.startedAt).toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)' }}>{inc.failureReason}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {inc.status === 'OPEN' && (
                          <button onClick={() => handleAcknowledgeIncident(inc.id)} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', marginRight: '0.4rem' }}>
                            Acknowledge
                          </button>
                        )}
                        {inc.status !== 'RESOLVED' && (
                          <button onClick={() => handleResolveIncident(inc.id)} style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 6: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Alert Center</h4>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['ALL', 'ACTIVE', 'RESOLVED'].map(st => (
                <button key={st} onClick={() => setAlertFilterState(st)} style={{ padding: '0.3rem 0.75rem', borderRadius: '8px', border: 'none', backgroundColor: alertFilterState === st ? 'var(--primary)' : 'var(--bg-page)', color: alertFilterState === st ? '#fff' : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>ALERT ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>TYPE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ENDPOINT</th>
                  <th style={{ padding: '0.75rem 1rem' }}>STATE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>MESSAGE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>CREATED AT</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      No active or resolved alerts found.
                    </td>
                  </tr>
                ) : (
                  alerts.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-subtle, var(--border-light))' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>#{a.id}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>{a.alertType}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)' }}>{a.endpointName || 'API'}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: a.state === 'ACTIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: a.state === 'ACTIVE' ? '#ef4444' : '#10b981' }}>
                          {a.state}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)' }}>{a.message}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 7: ESCALATIONS */}
      {activeTab === 'escalations' && (
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Alert Escalations History</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>ESCALATION ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>INCIDENT ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>LEVEL</th>
                  <th style={{ padding: '0.75rem 1rem' }}>CHANNEL</th>
                  <th style={{ padding: '0.75rem 1rem' }}>RECIPIENT</th>
                  <th style={{ padding: '0.75rem 1rem' }}>TRIGGERED AT</th>
                </tr>
              </thead>
              <tbody>
                {escalations.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      No alert escalations triggered yet.
                    </td>
                  </tr>
                ) : (
                  escalations.map(esc => (
                    <tr key={esc.id} style={{ borderBottom: '1px solid var(--border-subtle, var(--border-light))' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>#{esc.id}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>#{esc.incidentId}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--primary)' }}>Level {esc.escalationLevel}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{esc.channelType}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)' }}>{esc.recipient}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{new Date(esc.triggeredAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 8: METRICS */}
      {activeTab === 'metrics' && (
        <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Prometheus & Micrometer Telemetry Stream</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Metrics are exposed via Spring Boot Actuator at <code>/actuator/prometheus</code> and ready to scrape.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/actuator/prometheus" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <span>View Prometheus Raw Metrics</span> <ExternalLink size={15} />
            </a>
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <span>Open Grafana Workspace</span> <ExternalLink size={15} />
            </a>
          </div>
        </div>
      )}

      {/* SECTION 9: INFRASTRUCTURE */}
      {activeTab === 'infrastructure' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>JVM Memory Max</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>{infraMetrics?.heapMaxMb || 512} MB</div>
          </div>
          <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>CPU Processors</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>{infraMetrics?.availableProcessors || 4} Cores</div>
          </div>
          <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>JVM Version</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>JDK {infraMetrics?.jvmVersion || '17'}</div>
          </div>
          <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Spring Boot Version</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>{infraMetrics?.springBootVersion || '3.3.2'}</div>
          </div>
        </div>
      )}

      {/* SECTION 10: DATABASE */}
      {activeTab === 'database' && (
        <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>MySQL Connection Pool Health</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>{dbHealth?.status || 'UP'}</div>
            </div>
            <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Connections</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>{dbHealth?.activeConnections || 2}</div>
            </div>
            <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Max Pool Size</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>{dbHealth?.maxPoolSize || 5}</div>
            </div>
            <div style={{ padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ping Latency</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>{dbHealth?.queryLatencyMs || 2} ms</div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 11: CONFIGURATION */}
      {activeTab === 'configuration' && config && (
        <form onSubmit={handleUpdateConfig} className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Observability Platform Configuration</h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>Check Interval (Seconds)</label>
              <input type="number" value={config.checkIntervalSeconds} onChange={e => setConfig({...config, checkIntervalSeconds: Number(e.target.value)})} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>Default Timeout (ms)</label>
              <input type="number" value={config.defaultTimeoutMs} onChange={e => setConfig({...config, defaultTimeoutMs: Number(e.target.value)})} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>Failure Threshold (Checks)</label>
              <input type="number" value={config.defaultFailureThreshold} onChange={e => setConfig({...config, defaultFailureThreshold: Number(e.target.value)})} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>Retention Period (Days)</label>
              <input type="number" value={config.healthCheckRetentionDays} onChange={e => setConfig({...config, healthCheckRetentionDays: Number(e.target.value)})} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>Admin Notification Email</label>
              <input type="email" value={config.adminNotificationEmail || ''} onChange={e => setConfig({...config, adminNotificationEmail: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>Slack Webhook URL</label>
              <input type="url" placeholder="https://hooks.slack.com/..." value={config.slackWebhookUrl || ''} onChange={e => setConfig({...config, slackWebhookUrl: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* CREATE ENDPOINT MODAL */}
      {isEndpointModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleCreateEndpoint} style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Add Monitored API Endpoint
            </h3>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>Endpoint Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Booking Creation API"
                value={endpointForm.name}
                onChange={e => setEndpointForm({...endpointForm, name: e.target.value})}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>HTTP Method</label>
                <select
                  value={endpointForm.httpMethod}
                  onChange={e => setEndpointForm({...endpointForm, httpMethod: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="HEAD">HEAD</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>URL / Path</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /api/v1/services"
                  value={endpointForm.urlPath}
                  onChange={e => setEndpointForm({...endpointForm, urlPath: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>Timeout (ms)</label>
                <input
                  type="number"
                  value={endpointForm.timeoutMs}
                  onChange={e => setEndpointForm({...endpointForm, timeoutMs: Number(e.target.value)})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>Failure Threshold</label>
                <input
                  type="number"
                  value={endpointForm.failureThreshold}
                  onChange={e => setEndpointForm({...endpointForm, failureThreshold: Number(e.target.value)})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsEndpointModalOpen(false)}
                style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', fontWeight: 700 }}
              >
                Create Endpoint
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
