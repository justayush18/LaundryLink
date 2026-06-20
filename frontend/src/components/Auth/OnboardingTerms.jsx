import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Truck, 
  UserCheck, 
  HelpCircle, 
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function OnboardingTerms() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    setError('');
    try {
      // Call backend to save acceptance timestamp and version
      const updatedUser = await api.users.acceptTerms('v1.0');
      
      // Update AuthContext state and LocalStorage
      const fullUser = { ...user, termsAccepted: true, termsAcceptanceTimestamp: updatedUser.termsAcceptanceTimestamp, termsAcceptedVersion: 'v1.0' };
      setUser(fullUser);
      localStorage.setItem('user', JSON.stringify(fullUser));
      
      // Redirect to correct dashboard
      if (user.role === 'CUSTOMER') navigate('/customer/dashboard');
      else if (user.role === 'LAUNDRY_PARTNER') navigate('/partner/dashboard');
      else if (user.role === 'DELIVERY_PARTNER') navigate('/delivery/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to submit acceptance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="glass-panel animate-fadeInUp">
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <ShieldCheck size={28} color="var(--primary-teal)" />
          </div>
          <h1 style={styles.title}>Welcome to Velora</h1>
          <p style={styles.subtitle}>Please review and accept our operational terms & policies to continue to your account.</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {/* Content Box */}
        <div style={styles.scrollArea}>
          
          {/* 1. ROLE-SPECIFIC POLICIES */}
          {user.role === 'CUSTOMER' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🛍️ Customer Policies</h2>
              
              <div style={styles.item}>
                <h3 style={styles.itemTitle}>1. Smart Delivery Window</h3>
                <p style={styles.text}>
                  Delivery estimates are computed dynamically based on the laundry partner's operating hours, selected service SLA, and order placement times:
                </p>
                <div style={styles.exampleBox}>
                  <strong>Example A:</strong> Order placed at 10:00 AM with a 6-hour SLA will show a delivery estimate of <strong>Today before 4:00 PM</strong>.<br/>
                  <strong>Example B:</strong> Order placed at 8:00 PM with a partner closing at 9:00 PM will show a delivery estimate of <strong>Tomorrow before 2:00 PM</strong>.
                </div>
              </div>

              <div style={styles.item}>
                <h3 style={styles.itemTitle}>2. Cancellation & Refunds</h3>
                <p style={styles.text}>
                  Customers receive <strong>3 free cancellations per month</strong>. If this limit is exceeded, cancellation charges are automatically deducted from refund amounts based on order progress:
                </p>
                <ul style={styles.list}>
                  <li><strong>Order Accepted by Partner:</strong> 15% cancellation fee</li>
                  <li><strong>Rider Assigned:</strong> 25% cancellation fee</li>
                  <li><strong>Rider Reached Pickup:</strong> 50% cancellation fee</li>
                  <li><strong>Clothes Picked Up:</strong> 75% cancellation fee</li>
                  <li><strong>Laundry Processing Started:</strong> Strictly non-refundable</li>
                </ul>
              </div>

              <div style={styles.item}>
                <h3 style={styles.itemTitle}>3. Fair Usage Policy</h3>
                <p style={styles.text}>
                  To maintain service reliability, customers must avoid repeated mock bookings, abuse of cancellation thresholds, or fraudulent disputes. Violations may result in temporary account restrictions.
                </p>
              </div>
            </div>
          )}

          {user.role === 'LAUNDRY_PARTNER' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🏪 Laundry Partner Terms & Guidelines</h2>
              
              <div style={styles.item}>
                <h3 style={styles.itemTitle}>1. Operating Hours & Service SLAs</h3>
                <p style={styles.text}>
                  Partners are required to configure and maintain accurate opening times, closing times, and service SLA parameters. Customer delivery times are automatically computed off these configurations.
                </p>
              </div>

              <div style={styles.item}>
                <h3 style={styles.itemTitle}>2. Order Commitments & Ratings</h3>
                <p style={styles.text}>
                  Once an order is accepted, it must be processed within the declared SLA time. Excessive delays directly degrade merchant reputation scores, which may result in lower placement on listings.
                </p>
              </div>

              <div style={styles.item}>
                <h3 style={styles.itemTitle}>3. Service Quality Expectations</h3>
                <p style={styles.text}>
                  Merchants must handle customer items with extreme care. Damage, losses, or hygiene standard violations will require direct customer compensation and review logs.
                </p>
              </div>

              <div style={styles.item}>
                <h3 style={styles.itemTitle}>4. Pricing Transparency</h3>
                <p style={styles.text}>
                  Rate cards must be kept up-to-date and transparent. Hidden fees, extra service levies, or surcharge billing are strictly prohibited on the platform.
                </p>
              </div>

              <div style={styles.item}>
                <h3 style={styles.itemTitle}>5. Customer Billing Channels</h3>
                <p style={styles.text}>
                  All financial transactions must run through the platform. Partners are prohibited from requesting direct customer settlements or cash transfers outside platform invoices.
                </p>
              </div>
            </div>
          )}

          {user.role === 'DELIVERY_PARTNER' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🚴 Delivery Rider Guidelines</h2>
              
              <div style={styles.item}>
                <h3 style={styles.itemTitle}>1. Automated Task Assignment</h3>
                <p style={styles.text}>
                  Assignments are automatically allocated by the platform dispatch engine based on rider location proximity, online status, and active workload. Manual picking or swapping of deliveries is not supported.
                </p>
              </div>

              <div style={styles.item}>
                <h3 style={styles.itemTitle}>2. Daily Rejection & Cancellation Limits</h3>
                <p style={styles.text}>
                  Riders can cancel or reject a maximum of <strong>2 assigned tasks per day</strong>. After reaching this threshold, further rejections are blocked, and riders must complete assignments to remain online.
                </p>
              </div>

              <div style={styles.item}>
                <h3 style={styles.itemTitle}>3. Garment Handling & Timeliness</h3>
                <p style={styles.text}>
                  Riders bear full responsibility for clothing safety during transit. Orders must be packed inside dust bags, protected from rain/dust, and completed within the estimated timeframes.
                </p>
              </div>

              <div style={styles.item}>
                <h3 style={styles.itemTitle}>4. Active Workload Status</h3>
                <p style={styles.text}>
                  Riders should only switch their status to 'Online' when they are actively available to accept tasks. Remaining online while inactive degrades dispatch dispatching efficiency.
                </p>
              </div>
            </div>
          )}

          {/* 2. GENERAL PLATFORM-WIDE POLICIES */}
          <div style={styles.section} className="border-top">
            <h2 style={styles.sectionTitle}>🌐 Platform-Wide Policies</h2>

            <div style={styles.item}>
              <h3 style={styles.itemTitle}>1. Credentials Security</h3>
              <p style={styles.text}>
                Users are solely responsible for protecting their accounts and passwords. Profile sharing or distributing system logins to third parties is strictly prohibited.
              </p>
            </div>

            <div style={styles.item}>
              <h3 style={styles.itemTitle}>2. Professional & Respectful Conduct</h3>
              <p style={styles.text}>
                Velora maintains a zero-tolerance policy toward harassment, verbal abuse, or hostile conduct. This applies equally across customers, laundry partners, delivery riders, and administrators.
              </p>
            </div>

            <div style={styles.item}>
              <h3 style={styles.itemTitle}>3. Fraud Prevention & Suspensions</h3>
              <p style={styles.text}>
                Any accounts engaged in fake orders, refund rigging, or system manipulation will face immediate and permanent platform bans.
              </p>
            </div>

            <div style={styles.item}>
              <h3 style={styles.itemTitle}>4. Policy Revisions</h3>
              <p style={styles.text}>
                Velora reserves the right to update these operational parameters and policies. Users are encouraged to view terms updates periodically in their navigation panels.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Accept Row */}
        <div style={styles.footer}>
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={accepted} 
              onChange={(e) => setAccepted(e.target.checked)}
              style={styles.checkbox}
              disabled={loading}
            />
            <span style={styles.checkboxText}>I have read and understood the Terms & Policies.</span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="velora-btn velora-btn-primary"
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '12px', 
              fontSize: '14px', 
              fontWeight: 800,
              opacity: accepted ? 1 : 0.6
            }}
          >
            {loading ? 'Processing Agreement...' : 'Continue to Dashboard'}
          </button>
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
    padding: '2rem 1.5rem',
    background: 'var(--bg-primary)',
    boxSizing: 'border-box'
  },
  card: {
    width: '100%',
    maxWidth: '640px',
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
    borderRadius: '24px',
    boxShadow: 'var(--shadow-xl)',
    padding: '2.5rem',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  logoCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(86, 124, 141, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px auto'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: 1.5
  },
  scrollArea: {
    maxHeight: '340px',
    overflowY: 'auto',
    border: '2px solid var(--sky-blue)',
    borderRadius: '16px',
    padding: '1.25rem',
    background: 'var(--bg-secondary)',
    marginBottom: '2rem',
    boxSizing: 'border-box'
  },
  section: {
    marginBottom: '1.75rem'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    margin: '0 0 1rem 0',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--sky-blue-light)'
  },
  item: {
    marginBottom: '1.25rem'
  },
  itemTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--primary-teal)',
    fontFamily: 'Outfit, sans-serif',
    margin: '0 0 6px 0'
  },
  text: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: 1.5
  },
  list: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    margin: '6px 0 0 0',
    paddingLeft: '20px',
    lineHeight: 1.6
  },
  exampleBox: {
    fontSize: '0.78rem',
    color: 'var(--primary-navy)',
    background: '#FFFFFF',
    borderLeft: '3px solid var(--primary-teal)',
    padding: '10px 12px',
    borderRadius: '4px 8px 8px 4px',
    marginTop: '8px',
    lineHeight: 1.5
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    userSelect: 'none'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: 'var(--primary-teal)',
    cursor: 'pointer'
  },
  checkboxText: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif'
  }
};
