import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WaveBackground from '../Common/WaveBackground';
import FloatingBubbles from '../Common/FloatingBubbles';
import VeloraMascot from '../Common/VeloraMascot';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(email, password);
      // Redirect based on user role
      if (user.role === 'CUSTOMER') {
        navigate('/customer/dashboard');
      } else if (user.role === 'LAUNDRY_PARTNER') {
        navigate('/partner/dashboard');
      } else if (user.role === 'DELIVERY_PARTNER') {
        navigate('/delivery/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        <span>
          Unauthorized. !Don't have an account?{' '}
          <Link to="/register" style={{ color: '#9B1C1C', textDecoration: 'underline', fontWeight: 800 }}>
            Create an account
          </Link>
        </span>
      );
      setTimeout(() => {
        navigate('/register');
      }, 2500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <WaveBackground variant="hero" />
      <FloatingBubbles count={10} />
      
      <div className="velora-card animate-fadeInUp" style={styles.card}>
        <div style={styles.header}>
          <VeloraMascot state={error ? 'thinking' : submitting ? 'loading' : 'happy'} size={90} style={{ marginBottom: '1rem' }} />
          <h1 style={styles.brand}>Velora</h1>
          <p style={styles.subtitle}>Welcome back! Sign in to continue</p>
        </div>

        {error && (
          <div className="alert alert-error animate-pulse" style={styles.alert}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--primary-navy)' }}>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name123@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              style={styles.input}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ color: 'var(--primary-navy)' }}>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="*********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            className="velora-btn velora-btn-primary animate-pulse"
            style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700 }}
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-teal)', fontWeight: 700, textDecoration: 'none' }}>
              Create an account
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
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '3rem 2.25rem',
    background: '#FFFFFF',
    boxShadow: 'var(--shadow-lg)',
    borderRadius: '32px',
    zIndex: 2,
    border: '1px solid var(--sky-blue-light)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
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
  input: {
    borderRadius: '16px',
    border: '2px solid var(--sky-blue)',
    background: 'var(--bg-secondary)',
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--primary-navy)',
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
  },
};
