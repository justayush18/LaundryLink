import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WaveBackground from '../Common/WaveBackground';
import FloatingBubbles from '../Common/FloatingBubbles';
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
      const user = await register(email, password, displayName, phoneNumber, role);
      if (user.role === 'CUSTOMER') {
        navigate('/customer/dashboard');
      } else if (user.role === 'LAUNDRY_PARTNER') {
        navigate('/partner/dashboard');
      } else if (user.role === 'DELIVERY_PARTNER') {
        navigate('/delivery/dashboard');
      } else {
        navigate('/');
      }
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
      <WaveBackground variant="hero" />
      <FloatingBubbles count={12} />
      
      <div className="velora-card animate-fadeInUp" style={styles.card}>
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

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div className="form-group">
              <label className="form-label" style={styles.label}>Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Aarav Mehta"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                required
                disabled={submitting}
                style={styles.input}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={styles.label}>Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                style={styles.input}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={styles.label}>Phone Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setPhoneNumber(val);
                }}
                required
                disabled={submitting}
                style={styles.input}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={styles.label}>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                style={styles.input}
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
                      borderColor: isSelected ? 'var(--primary-teal)' : 'var(--sky-blue)',
                      background: isSelected ? 'var(--sky-blue-light)' : '#FFFFFF',
                      boxShadow: isSelected ? '0 4px 12px rgba(86, 124, 141, 0.15)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '24px', marginBottom: '4px' }}>{r.emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-navy)' }}>{r.title}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center' }}>{r.desc}</span>
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-teal)', fontWeight: 700, textDecoration: 'none' }}>
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
    background: 'var(--bg-primary)',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    padding: '3rem 2.5rem',
    background: '#FFFFFF',
    boxShadow: 'var(--shadow-lg)',
    borderRadius: '32px',
    zIndex: 2,
    border: '1px solid var(--sky-blue-light)',
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
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    margin: '0.5rem 0 0.25rem 0',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    margin: 0,
  },
  alert: {
    marginBottom: '1.5rem',
    padding: '12px',
    fontSize: '13px',
    borderRadius: '16px',
    textAlign: 'center',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  label: {
    color: 'var(--primary-navy)',
    fontWeight: 600,
  },
  input: {
    borderRadius: '16px',
    border: '2px solid var(--sky-blue)',
    background: 'var(--bg-secondary)',
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--primary-navy)',
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
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
  },
};
