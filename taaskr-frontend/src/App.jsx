import React, { Component, useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AiAssistantModal from './components/AiAssistantModal';
import Footer from './components/Footer';

// Page Views (Code-Split via dynamic imports for fast initial load)
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ServiceDetails = lazy(() => import('./pages/ServiceDetails'));
const BookingFlow = lazy(() => import('./pages/BookingFlow'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

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
  }

  render() {
    if (this.state.hasError) {
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
            Something went wrong while displaying this page.
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '500px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            className="btn btn-primary"
          >
            Reload Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const [isServerWaking, setIsServerWaking] = useState(false);
  const isEnterpriseConsole = location.pathname.startsWith('/admin') || location.pathname.startsWith('/provider');

  useEffect(() => {
    const handleWaking = (e) => {
      setIsServerWaking(!!e.detail?.waking);
    };
    window.addEventListener('taaskr-server-waking', handleWaking);
    return () => window.removeEventListener('taaskr-server-waking', handleWaking);
  }, []);

  useEffect(() => {
    document.body.classList.remove('theme-user', 'theme-provider', 'theme-admin');
    if (location.pathname.startsWith('/admin')) {
      document.body.classList.add('theme-admin');
      document.title = 'Taaskr Operations Console';
    } else if (location.pathname.startsWith('/provider')) {
      document.body.classList.add('theme-provider');
      document.title = 'Taaskr Pro Partner Portal';
    } else {
      document.body.classList.add('theme-user');
      document.title = 'Taaskr — On-Demand Services Marketplace';
    }
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isServerWaking && (
        <div style={{
          backgroundColor: '#F59E0B',
          color: '#78350F',
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</span>
          <span>Connecting to cloud backend... Free-tier server is spinning up. Thank you for your patience!</span>
        </div>
      )}
      <Navbar />
      
      {/* Main Content Area */}
      <div style={{ flex: 1, paddingBottom: isEnterpriseConsole ? '0' : '3rem' }}>
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Public Access Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
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
