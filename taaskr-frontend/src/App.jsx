import React, { Component, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AiAssistantModal from './components/AiAssistantModal';
import Footer from './components/Footer';

// Helper for resilient Code-Splitting with auto-retry on deployment updates
const lazyWithRetry = (importFn) =>
  lazy(async () => {
    const pageAlreadyReloaded = sessionStorage.getItem('taaskr_chunk_reloaded');
    try {
      const component = await importFn();
      sessionStorage.removeItem('taaskr_chunk_reloaded');
      return component;
    } catch (error) {
      if (!pageAlreadyReloaded) {
        sessionStorage.setItem('taaskr_chunk_reloaded', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });

// Page Views (Code-Split via dynamic imports with auto-recovery for fast initial load)
const Home = lazyWithRetry(() => import('./pages/Home'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const VerifyEmail = lazyWithRetry(() => import('./pages/VerifyEmail'));
const ServiceDetails = lazyWithRetry(() => import('./pages/ServiceDetails'));
const BookingFlow = lazyWithRetry(() => import('./pages/BookingFlow'));
const CustomerDashboard = lazyWithRetry(() => import('./pages/CustomerDashboard'));
const ProviderDashboard = lazyWithRetry(() => import('./pages/ProviderDashboard'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const PartnerDashboard = lazyWithRetry(() => import('./pages/PartnerDashboard'));

function RouteLoadingFallback() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      color: 'var(--text-muted)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(245, 158, 11, 0.2)',
        borderTopColor: '#F59E0B',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.02em' }}>Loading...</p>
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Taaskr UI ErrorBoundary caught an error:', error, errorInfo);
    if (
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed')
    ) {
      const pageAlreadyReloaded = sessionStorage.getItem('taaskr_chunk_reloaded');
      if (!pageAlreadyReloaded) {
        sessionStorage.setItem('taaskr_chunk_reloaded', 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Importing a module script failed');

      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            {isChunkError ? 'New Update Available' : 'Something went wrong while displaying this page.'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '520px', lineHeight: 1.5 }}>
            {isChunkError
              ? 'A new version of Taaskr was deployed. Reloading will load the latest interface.'
              : (this.state.error?.message || 'An unexpected error occurred.')}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                sessionStorage.removeItem('taaskr_chunk_reloaded');
                window.location.reload();
              }}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('taaskr_chunk_reloaded');
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="btn btn-secondary"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const isEnterpriseConsole = location.pathname.startsWith('/admin') || location.pathname.startsWith('/provider') || location.pathname.startsWith('/partner');

  useEffect(() => {
    document.body.classList.remove('theme-user', 'theme-provider', 'theme-admin');
    if (location.pathname.startsWith('/admin')) {
      document.body.classList.add('theme-admin');
      document.title = 'Taaskr Operations Console';
    } else if (location.pathname.startsWith('/provider') || location.pathname.startsWith('/partner')) {
      document.body.classList.add('theme-provider');
      document.title = location.pathname.startsWith('/partner') ? 'Taaskr Service Partner Console' : 'Taaskr Pro Partner Portal';
    } else {
      document.body.classList.add('theme-user');
      document.title = 'Taaskr — On-Demand Services Marketplace';
    }
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      {/* Main Content Area */}
      <div style={{ flex: 1, paddingBottom: isEnterpriseConsole ? '0' : '3rem' }}>
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Public Access Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login/customer" element={<Login />} />
              <Route path="/login/provider" element={<Login />} />
              <Route path="/provider-login" element={<Login />} />
              <Route path="/login/partner" element={<Login />} />
              <Route path="/partner-login" element={<Login />} />
              <Route path="/login/admin" element={<Login />} />
              <Route path="/admin-login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-phone" element={<VerifyEmail />} />
              <Route path="/services/:serviceId" element={<ServiceDetails />} />

              {/* Protected Customer Routes */}
              <Route
                path="/booking-flow"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <BookingFlow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <BookingFlow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <BookingFlow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <CustomerDashboard initialTab="profile" />
                  </ProtectedRoute>
                }
              />

              {/* Protected Provider Dashboard */}
              <Route
                path="/provider"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER']}>
                    <ProviderDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Service Partner Console */}
              <Route
                path="/partner"
                element={
                  <ProtectedRoute allowedRoles={['SERVICE_PARTNER', 'PROVIDER']}>
                    <PartnerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Console */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Catch-All Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Global AI Diagnostic Assistant Modal */}
      <AiAssistantModal />

      {/* Global Production Footer (Customer & Public views only) */}
      {!isEnterpriseConsole && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
