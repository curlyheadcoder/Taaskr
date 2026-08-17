import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Page Views
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ServiceDetails from './pages/ServiceDetails';
import BookingFlow from './pages/BookingFlow';
import CustomerDashboard from './pages/CustomerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        
        {/* Main Content Area */}
        <div style={{ flex: 1, paddingBottom: '3rem' }}>
          <Routes>
            {/* Public Access Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
        </div>
      </div>
    </Router>
  );
}
