import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Common/ProtectedRoute';
import FloatingNav from './components/Common/FloatingNav';
import Homepage from './components/Home/Homepage';

// Auth Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Customer Pages
import CustomerDashboard from './components/Customer/CustomerDashboard';
import CustomerOrders from './components/Customer/CustomerOrders';
import CustomerPayments from './components/Customer/CustomerPayments';
import CustomerReviews from './components/Customer/CustomerReviews';

// Partner Pages
import PartnerDashboard from './components/Partner/PartnerDashboard';
import PartnerOrders from './components/Partner/PartnerOrders';
import PartnerPricing from './components/Partner/PartnerPricing';
import PartnerDocuments from './components/Partner/PartnerDocuments';

// Delivery Pages
import DeliveryDashboard from './components/Delivery/DeliveryDashboard';
import DeliveryTasks from './components/Delivery/DeliveryTasks';

// Admin Pages
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminUsers from './components/Admin/AdminUsers';
import AdminPartners from './components/Admin/AdminPartners';
import AdminOrders from './components/Admin/AdminOrders';
import AdminPayments from './components/Admin/AdminPayments';
import AdminReports from './components/Admin/AdminReports';

import './App.css';

function MainLayout() {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      <FloatingNav />
      <main className="page-container">
        <Routes>
          {/* Customer Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/payments"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/reviews"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerReviews />
              </ProtectedRoute>
            }
          />

          {/* Partner Routes */}
          <Route
            path="/partner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['LAUNDRY_PARTNER']}>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/orders"
            element={
              <ProtectedRoute allowedRoles={['LAUNDRY_PARTNER']}>
                <PartnerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/pricing"
            element={
              <ProtectedRoute allowedRoles={['LAUNDRY_PARTNER']}>
                <PartnerPricing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/documents"
            element={
              <ProtectedRoute allowedRoles={['LAUNDRY_PARTNER']}>
                <PartnerDocuments />
              </ProtectedRoute>
            }
          />

          {/* Delivery Routes */}
          <Route
            path="/delivery/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/tasks"
            element={
              <ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}>
                <DeliveryTasks />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/partners"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPartners />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />

          {/* Fallback to user home based on active role */}
          <Route
            path="*"
            element={
              user ? (
                user.role === 'CUSTOMER' ? (
                  <Navigate to="/customer/dashboard" replace />
                ) : user.role === 'LAUNDRY_PARTNER' ? (
                  <Navigate to="/partner/dashboard" replace />
                ) : user.role === 'DELIVERY_PARTNER' ? (
                  <Navigate to="/delivery/dashboard" replace />
                ) : user.role === 'ADMIN' ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="*" element={<MainLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </BrowserRouter>
  );
}
