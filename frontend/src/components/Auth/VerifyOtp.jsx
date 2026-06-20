import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import WaveBackground from '../Common/WaveBackground';
import FloatingBubbles from '../Common/FloatingBubbles';
import VeloraMascot from '../Common/VeloraMascot';
import { Mail, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';

export default function VerifyOtp() {
  const { user, loading: authLoading, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailPreFilled, setEmailPreFilled] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    const storedEmail = sessionStorage.getItem('pendingEmail');
    if (user && user.email) {
      setEmail(user.email);
      setEmailPreFilled(true);
      setError('');
    } else if (storedEmail) {
      setEmail(storedEmail);
      setEmailPreFilled(true);
      setError('');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      const data = await api.auth.verifyOtp(email, otpCode);
      
      // Update local storage and context
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      sessionStorage.removeItem('pendingEmail');

      // Navigate to correct route
      if (!data.user.termsAccepted && data.user.role !== 'ADMIN') {
        navigate('/onboarding');
      } else {
        if (data.user.role === 'CUSTOMER') navigate('/customer/dashboard');
        else if (data.user.role === 'LAUNDRY_PARTNER') navigate('/partner/dashboard');
        else if (data.user.role === 'DELIVERY_PARTNER') navigate('/delivery/dashboard');
        else navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address first to resend code.');
      return;
    }
    if (countdown > 0 || resending) return;
    if (resendCount >= 3) {
      setError('Maximum of 3 resends allowed. Please try again later.');
      return;
    }

    setError('');
    setInfo('');
    setResending(true);

    try {
      await api.auth.resendOtp(email);
      setResendCount(prev => prev + 1);
      setCountdown(30);
      setInfo('A new verification code has been dispatched to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    logout();
    sessionStorage.removeItem('pendingEmail');
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div style={styles.container}>
        <WaveBackground variant="hero" />
        <div className="velora-card" style={styles.card}>
          <div style={{ textAlign: 'center', color: 'var(--primary-navy)' }}>
            <p>Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <WaveBackground variant="hero" />
      <FloatingBubbles count={8} />

      <div className="velora-card animate-fadeInUp" style={styles.card}>
        {/* Back navigation */}
        <button 
          onClick={handleBackToLogin} 
          style={styles.backButton}
          title="Back to login"
        >
          <ArrowLeft size={16} />
          <span>Login</span>
        </button>

        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <KeyRound size={28} color="var(--primary-teal)" />
          </div>
          <h1 style={styles.brand}>Verify Email</h1>
          {emailPreFilled ? (
            <p style={styles.subtitle}>
              Enter the 6-digit code sent to <strong style={{ color: 'var(--primary-navy)' }}>{email}</strong>.
              <button 
                type="button" 
                onClick={() => setEmailPreFilled(false)} 
                style={styles.changeEmailBtn}
              >
                Change
              </button>
            </p>
          ) : (
            <p style={styles.subtitle}>
              Enter your registered email address and verification code.
            </p>
          )}
        </div>

        {error && (
          <div className="alert alert-error" style={styles.alert}>
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="alert alert-success" style={styles.alert}>
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={handleVerify}>
          {!emailPreFilled && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ color: 'var(--primary-navy)' }}>
                Email Address
              </label>
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
          )}

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ color: 'var(--primary-navy)', textAlign: 'center', display: 'block' }}>
              Verification Code
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="123456"
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 6) setOtpCode(val);
              }}
              required
              disabled={submitting}
              maxLength={6}
              style={styles.otpInput}
            />
          </div>

          <button
            type="submit"
            className="velora-btn velora-btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700, justifyContent: 'center' }}
            disabled={submitting || otpCode.length !== 6}
          >
            {submitting ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div style={styles.resendRow}>
          {resendCount >= 3 ? (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Resend limit reached (3/3)
            </span>
          ) : countdown > 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Resend code in <strong style={{ color: 'var(--primary-teal)' }}>{countdown}s</strong>
            </span>
          ) : (
            <button 
              onClick={handleResend} 
              disabled={resending}
              style={styles.resendBtn}
            >
              <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
              <span>{resending ? 'Resending...' : 'Resend Verification Code'}</span>
            </button>
          )}
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
    maxWidth: '420px',
    padding: '3rem 2.25rem',
    background: '#FFFFFF',
    boxShadow: 'var(--shadow-lg)',
    borderRadius: '32px',
    zIndex: 2,
    border: '1px solid var(--sky-blue-light)',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: '24px',
    left: '24px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '1rem',
  },
  logoCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(86, 124, 141, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  brand: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    margin: 0,
    lineHeight: 1.5,
  },
  alert: {
    marginBottom: '1.5rem',
    padding: '12px',
    fontSize: '13px',
    borderRadius: '16px',
    textAlign: 'center',
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: '8px',
    fontSize: '24px',
    fontWeight: 800,
    fontFamily: 'Outfit, sans-serif',
    borderRadius: '16px',
    border: '2px solid var(--sky-blue)',
    background: 'var(--bg-secondary)',
    padding: '10px',
    color: 'var(--primary-navy)',
  },
  resendRow: {
    textAlign: 'center',
    marginTop: '2rem',
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary-teal)',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontFamily: 'Outfit, sans-serif',
  },
  changeEmailBtn: {
    marginLeft: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--primary-teal)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'underline',
    fontFamily: 'Outfit, sans-serif',
  },
  input: {
    borderRadius: '16px',
    border: '2px solid var(--sky-blue)',
    background: 'var(--bg-secondary)',
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
  },
};
