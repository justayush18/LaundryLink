import React, { useState, useEffect } from 'react';
import { api, getFriendlyErrorMessage } from '../../services/api';
import { ClipboardList, Navigation, ChevronRight } from 'lucide-react';

export default function DeliveryTasks() {
  const [dashboard, setDashboard] = useState({ pendingPickups: [], pendingDeliveries: [], assignedTasks: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('rider_online');
    return saved !== 'false';
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.deliveries.getDashboard();
      setDashboard(data || { pendingPickups: [], pendingDeliveries: [], assignedTasks: [] });
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleClaim = async (orderId) => {
    if (!isOnline) {
      setError('To claim tasks, please toggle your availability to "Online" on the dashboard.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.orders.assignDelivery(orderId, {});
      setSuccess('Task successfully claimed! Appears on your Active dashboard.');
      setTimeout(() => setSuccess(''), 4000);
      fetchTasks();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
          Tasks Claim Board
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
          Browse available customer laundry runs and self-assign pickups and deliveries.
        </p>
      </div>

      {!isOnline && (
        <div className="alert alert-warning animate-pulse" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '16px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }} />
          <span>You are currently <strong>OFFLINE</strong>. Please go to the Dashboard to change availability if you wish to claim tasks.</span>
        </div>
      )}

      {success && <div className="alert alert-success animate-fadeInUp">{success}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading runs...</p>
      ) : (
        <div style={styles.grid}>
          {/* Pickups Board */}
          <div className="velora-card animate-fadeInUp" style={{ ...styles.boardColumn, padding: '2rem' }}>
            <div style={styles.columnHeader}>
              <ClipboardList size={18} color="var(--primary-teal)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                Available Pickups
              </h3>
              <span className="badge badge-info" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                {dashboard.pendingPickups?.length || 0}
              </span>
            </div>
            
            <div style={styles.taskList}>
              {dashboard.pendingPickups?.length === 0 ? (
                <p style={styles.emptyText}>No pickups pending right now.</p>
              ) : (
                dashboard.pendingPickups.map((p) => (
                  <div key={p.orderId} className="velora-card card-hover" style={styles.taskCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={styles.ref}>REF: #{p.orderId.substring(0, 7).toUpperCase()}</span>
                      <span style={{ fontSize: '12px', color: 'var(--primary-teal)', fontWeight: 800 }}>Payout: ₹{p.totalCost}</span>
                    </div>
                    <p style={styles.address}><strong>From:</strong> {p.pickupAddress}</p>
                    <p style={styles.slot}>⏱ {p.pickupSlot}</p>
                    
                    <button
                      onClick={() => handleClaim(p.orderId)}
                      className="velora-btn velora-btn-primary animate-pulse"
                      style={styles.claimBtn}
                      disabled={submitting || !isOnline}
                    >
                      Claim Pickup <ChevronRight size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deliveries Board */}
          <div className="velora-card animate-fadeInUp" style={{ ...styles.boardColumn, padding: '2rem' }}>
            <div style={styles.columnHeader}>
              <Navigation size={18} color="var(--primary-teal)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                Available Deliveries
              </h3>
              <span className="badge badge-info" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                {dashboard.pendingDeliveries?.length || 0}
              </span>
            </div>

            <div style={styles.taskList}>
              {dashboard.pendingDeliveries?.length === 0 ? (
                <p style={styles.emptyText}>No deliveries pending right now.</p>
              ) : (
                dashboard.pendingDeliveries.map((d) => (
                  <div key={d.orderId} className="velora-card card-hover" style={styles.taskCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={styles.ref}>REF: #{d.orderId.substring(0, 7).toUpperCase()}</span>
                      <span style={{ fontSize: '12px', color: 'var(--primary-teal)', fontWeight: 800 }}>Payout: ₹{d.totalCost}</span>
                    </div>
                    <p style={styles.address}><strong>To:</strong> {d.deliveryAddress}</p>
                    <p style={styles.slot}>⏱ {d.deliverySlot}</p>

                    <button
                      onClick={() => handleClaim(d.orderId)}
                      className="velora-btn velora-btn-primary animate-pulse"
                      style={styles.claimBtn}
                      disabled={submitting || !isOnline}
                    >
                      Claim Delivery <ChevronRight size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  boardColumn: {
    flex: 1,
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '75vh',
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '2px solid var(--bg-secondary)',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  taskList: {
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '4px',
  },
  taskCard: {
    padding: '16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--sky-blue-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  ref: {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: '12px',
    color: 'var(--primary-navy)',
  },
  address: {
    fontSize: '12px',
    color: 'var(--primary-navy)',
    fontWeight: 600,
    margin: 0,
  },
  slot: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    margin: 0,
    fontWeight: 600,
  },
  claimBtn: {
    marginTop: '6px',
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  emptyText: {
    textAlign: 'center',
    padding: '24px 0',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: 600,
  },
};
