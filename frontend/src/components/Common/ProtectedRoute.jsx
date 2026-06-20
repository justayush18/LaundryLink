import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VeloraMascot from './VeloraMascot';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <VeloraMascot state="loading" size={100} />
        <p style={{ marginTop: '16px', color: 'var(--primary-teal)', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
          Making things clean & fresh...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (user.role !== 'ADMIN' && !user.termsAccepted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'CUSTOMER') return <Navigate to="/customer/dashboard" replace />;
    if (user.role === 'LAUNDRY_PARTNER') return <Navigate to="/partner/dashboard" replace />;
    if (user.role === 'DELIVERY_PARTNER') return <Navigate to="/delivery/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
  }
};

