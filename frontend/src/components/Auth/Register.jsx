import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VeloraMascot from '../Common/VeloraMascot';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [securityPin, setSecurityPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!/^[A-Za-z\s]+$/.test(displayName)) {
      setError('Full Name must only contain letters and spaces.');
      setSubmitting(false);
      return;
    }

    if (phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      setError('Phone Number must be exactly 10 digits.');
      setSubmitting(false);
      return;
    }

    if (role !== 'CUSTOMER') {
      if (securityPin.length !== 12 || !/^\d{12}$/.test(securityPin)) {
        setError('Security Authorization PIN must be exactly 12 digits.');
        setSubmitting(false);
        return;
      }
    }

    try {
      await register(email, password, displayName, phoneNumber, role);
      sessionStorage.setItem('pendingEmail', email);
      navigate('/verify-email');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const roles = [
    { id: 'CUSTOMER', title: 'Customer', desc: 'Order laundry services', emoji: '👕' },
    { id: 'LAUNDRY_PARTNER', title: 'Laundry Partner', desc: 'Provide washing services', emoji: '🧼' },
    { id: 'DELIVERY_PARTNER', title: 'Rider', desc: 'Deliver laundry orders', emoji: '🛵' }
  ];

  return (
    <div style={styles.container}>
      {/* Full-screen background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="auth-video-bg"
        style={styles.videoBg}
        aria-hidden="true"
      >
        <source src="/videos/auth-bg.mp4" type="video/mp4" />
      </video>

      <div className="animate-fadeInUp" style={styles.card}>
        <div style={styles.header}>
          <VeloraMascot state={error ? 'thinking' : submitting ? 'loading' : 'celebrating'} size={80} />
          <h1 style={styles.brand}>Velora</h1>
          <p style={styles.subtitle}>Create your account to get started</p>
        </div>

        {error && (
          <div className="alert alert-error animate-pulse" style={styles.alert}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={styles.formGrid}>
            <div className="form-group">
              <label className="form-label" style={styles.label}>Full Name</label>
              <input
                type="text"
                className="form-control auth-dark-input"
                placeholder="Aarav Mehta"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                required
                disabled={submitting}
                style={styles.input}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={styles.label}>Email Address</label>
              <input
                type="email"
                className="form-control auth-dark-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                style={styles.input}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={styles.label}>Phone Number</label>
              <input
                type="tel"
                className="form-control auth-dark-input"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setPhoneNumber(val);
                }}
                required
                disabled={submitting}
                style={styles.input}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={styles.label}>Password</label>
              <input
                type="password"
                className="form-control auth-dark-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                style={styles.input}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: '1.5rem 0 1.5rem 0' }}>
            <label className="form-label" style={{ ...styles.label, marginBottom: '0.75rem' }}>Join as</label>
            <div style={styles.roleGrid}>
              {roles.map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    disabled={submitting}
                    style={{
                      ...styles.roleCard,
                      borderColor: isSelected ? '#67e8f9' : 'rgba(255,255,255,0.22)',
                      background: isSelected ? 'rgba(103, 232, 249, 0.18)' : 'rgba(255,255,255,0.08)',
                      boxShadow: isSelected ? '0 4px 20px rgba(103,232,249,0.25)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '24px', marginBottom: '4px' }}>{r.emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{r.title}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {role !== 'CUSTOMER' && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={styles.label}>
                Security Authorization PIN (12-digit PIN)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter 12-digit security code"
                value={securityPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 12) setSecurityPin(val);
                }}
                required
                disabled={submitting}
                style={styles.input}
              />
              <small style={{ display: 'block', color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.75rem' }}>
                Only authorized Laundry Partners and Riders with a security clearance code can register.
              </small>
            </div>
          )}

          <button
            type="submit"
            className="velora-btn velora-btn-primary animate-pulse"
            style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700 }}
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#67e8f9', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
    /* Fallback gradient for mobile / no-video */
    background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3a5c 50%, #0d4f5c 100%)',
  },
  videoBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
    pointerEvents: 'none',
  },
  overlay: {
    display: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    padding: '3rem 2.5rem',
    background: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 8px 48px rgba(0,0,0,0.40), 0 1.5px 0 rgba(255,255,255,0.12) inset',
    borderRadius: '32px',
    zIndex: 2,
    border: '1.5px solid rgba(255, 255, 255, 0.18)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  brand: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#FFFFFF',
    fontFamily: 'Outfit, sans-serif',
    margin: '0.5rem 0 0.25rem 0',
    textShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: '14px',
    margin: 0,
  },
  alert: {
    marginBottom: '1.5rem',
    padding: '12px',
    fontSize: '13px',
    borderRadius: '16px',
    textAlign: 'center',
    background: 'rgba(220,38,38,0.18)',
    border: '1px solid rgba(220,38,38,0.35)',
    color: '#FCA5A5',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  label: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: 600,
  },
  input: {
    borderRadius: '16px',
    border: '1.5px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.10)',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#FFFFFF',
    outline: 'none',
    backdropFilter: 'blur(8px)',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
  },
  roleCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    borderRadius: '20px',
    border: '1.5px solid rgba(255,255,255,0.22)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'rgba(255,255,255,0.08)',
    color: '#FFFFFF',
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
  },
};
