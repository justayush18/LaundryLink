import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ClipboardList, Navigation, CheckCircle2, ChevronRight } from 'lucide-react';

export default function DeliveryTasks() {
  const [dashboard, setDashboard] = useState({ pendingPickups: [], pendingDeliveries: [], assignedTasks: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.deliveries.getDashboard();
      setDashboard(data || { pendingPickups: [], pendingDeliveries: [], assignedTasks: [] });
    } catch (err) {
      setError('Failed to load tasks database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleClaim = async (orderId) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      // In Phase 5, PUT /api/v1/orders/{orderId}/assign-delivery handles self-assignment from JWT context!
      // Payload request object is not mandatory or is empty (e.g. {})
      await api.orders.assignDelivery(orderId, {});
      setSuccess('Task successfully claimed! Appears on your Active dashboard.');
      setTimeout(() => setSuccess(''), 4000);
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Fulfillment assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Tasks Claim Board</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Browse and self-assign available laundry pickups and deliveries.</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading runs...</p>
      ) : (
        <div style={styles.grid}>
          {/* Pickups Board */}
          <div className="glass-card" style={styles.boardColumn}>
            <div style={styles.columnHeader}>
              <ClipboardList size={18} color="var(--accent-secondary)" />
              <h3 style={{ fontSize: '16px' }}>Available Pickups</h3>
              <span className="badge badge-info">{dashboard.pendingPickups?.length || 0}</span>
            </div>
            
            <div style={styles.taskList}>
              {dashboard.pendingPickups?.length === 0 ? (
                <p style={styles.emptyText}>No pickups pending.</p>
              ) : (
                dashboard.pendingPickups.map((p) => (
                  <div key={p.orderId} className="glass-panel" style={styles.taskCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={styles.ref}>Ref: #{p.orderId.substring(0, 8)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>₹{p.totalCost}</span>
                    </div>
                    <p style={styles.address}><strong>From:</strong> {p.pickupAddress}</p>
                    <p style={styles.slot}>⏱ {p.pickupSlot}</p>
                    
                    <button
                      onClick={() => handleClaim(p.orderId)}
                      className="btn btn-secondary"
                      style={styles.claimBtn}
                      disabled={submitting}
                    >
                      Claim Pickup <ChevronRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deliveries Board */}
          <div className="glass-card" style={styles.boardColumn}>
            <div style={styles.columnHeader}>
              <Navigation size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '16px' }}>Available Deliveries</h3>
              <span className="badge badge-info">{dashboard.pendingDeliveries?.length || 0}</span>
            </div>

            <div style={styles.taskList}>
              {dashboard.pendingDeliveries?.length === 0 ? (
                <p style={styles.emptyText}>No deliveries pending.</p>
              ) : (
                dashboard.pendingDeliveries.map((d) => (
                  <div key={d.orderId} className="glass-panel" style={styles.taskCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={styles.ref}>Ref: #{d.orderId.substring(0, 8)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>₹{d.totalCost}</span>
                    </div>
                    <p style={styles.address}><strong>To:</strong> {d.deliveryAddress}</p>
                    <p style={styles.slot}>⏱ {d.deliverySlot}</p>

                    <button
                      onClick={() => handleClaim(d.orderId)}
                      className="btn btn-primary"
                      style={styles.claimBtn}
                      disabled={submitting}
                    >
                      Claim Delivery <ChevronRight size={14} />
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
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  taskList: {
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '6px',
  },
  taskCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  ref: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '13px',
  },
  address: {
    fontSize: '13px',
    color: 'var(--text-primary)',
  },
  slot: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  claimBtn: {
    marginTop: '8px',
    padding: '6px',
    fontSize: '12px',
  },
  emptyText: {
    textAlign: 'center',
    padding: '24px 0',
    color: 'var(--text-secondary)',
    fontSize: '13px',
  },
};
