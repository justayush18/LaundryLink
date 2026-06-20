import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    setError(err.message || 'Invalid email or password');
  } finally {
    setSubmitting(false);
  }
};

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
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.88)' }}>Email Address</label>
            <input
              type="email"
              className="form-control auth-dark-input"
              placeholder="name123@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              style={styles.input}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.88)' }}>Password</label>
            <input
              type="password"
              className="form-control auth-dark-input"
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
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#67e8f9', fontWeight: 700, textDecoration: 'none' }}>
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
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
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
    maxWidth: '400px',
    padding: '3rem 2.25rem',
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
    marginBottom: '2rem',
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
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
  },
};

