import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
      setError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card" style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.brand}>Velora</h1>
          <p style={styles.subtitle}>Welcome back! Sign in to continue</p>
        </div>

        {error && (
          <div className="alert alert-error" style={styles.alert}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-secondary)', fontWeight: 500 }}>
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
    background: 'radial-gradient(ellipse at bottom, #111827 0%, #0b0f19 100%)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 32px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  brand: {
    fontSize: '32px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  alert: {
    marginBottom: '20px',
    padding: '12px',
    fontSize: '13px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
  },
};
