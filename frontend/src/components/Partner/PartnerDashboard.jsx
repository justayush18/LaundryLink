import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Star, CheckCircle, Shield, Award, Clock } from 'lucide-react';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPartnerDashboard = async () => {
    setLoading(true);
    try {
      // Fetch own profile
      const prof = await api.partners.getProfile();
      setProfile(prof);
      
      // Fetch all orders from backend and filter by own email
      const allOrders = await api.orders.getMyOrders(); 
      // Wait, in backend, /api/v1/orders/my handles filters by role automatically!
      // If caller is partner, getMyOrders returns partner-specific orders.
      setOrders(allOrders || []);
    } catch (err) {
      setError('Failed to fetch partner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerDashboard();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, notes) => {
    try {
      setError('');
      await api.orders.updateStatus(orderId, { status: newStatus, notes });
      setSuccess(`Order updated to ${newStatus.replace('_', ' ')}!`);
      setTimeout(() => setSuccess(''), 4000);
      fetchPartnerDashboard();
    } catch (err) {
      setError(err.message || 'Status transition failed');
    }
  };

  const getActiveOrders = () => {
    return orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  };

  const getOnboardingBadge = (status) => {
    if (!status) return <span className="badge badge-warning">PENDING</span>;
    switch (status.toUpperCase()) {
      case 'ACTIVE': return <span className="badge badge-success">ACTIVE</span>;
      case 'PENDING': return <span className="badge badge-warning">PENDING</span>;
      case 'PENDING_VERIFICATION': return <span className="badge badge-warning">ON REVIEW</span>;
      default: return <span className="badge badge-error">{status}</span>;
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>
            {profile ? profile.businessName : 'Laundry Partner Panel'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage rate cards, verify documents, and fulfill laundry tasks.</p>
        </div>
        {profile && getOnboardingBadge(profile.onboardingStatus)}
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* KPIs */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="glass-card" style={styles.kpi}>
          <div style={{ ...styles.kpiIcon, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 style={styles.kpiVal}>{getActiveOrders().length}</h3>
            <p style={styles.kpiLabel}>Active Workload</p>
          </div>
        </div>

        <div className="glass-card" style={styles.kpi}>
          <div style={{ ...styles.kpiIcon, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
            <Star size={20} />
          </div>
          <div>
            <h3 style={styles.kpiVal}>{profile ? (profile.reputationScore ? profile.reputationScore.toFixed(1) : '5.0') : '5.0'}</h3>
            <p style={styles.kpiLabel}>Reputation Rating</p>
          </div>
        </div>

        <div className="glass-card" style={styles.kpi}>
          <div style={{ ...styles.kpiIcon, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--color-success)' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <h3 style={styles.kpiVal}>{orders.filter(o => o.status === 'DELIVERED').length}</h3>
            <p style={styles.kpiLabel}>Completed Orders</p>
          </div>
        </div>

        <div className="glass-card" style={styles.kpi}>
          <div style={{ ...styles.kpiIcon, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-secondary)' }}>
            <Award size={20} />
          </div>
          <div>
            <h3 style={styles.kpiVal}>{profile ? profile.totalReviews : 0}</h3>
            <p style={styles.kpiLabel}>Total Customer Reviews</p>
          </div>
        </div>
      </div>

      {/* Fulfillments Board */}
      <div className="glass-card">
        <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Active Laundry Fulfillment Board</h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading operations...</p>
        ) : getActiveOrders().length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No active orders under your business right now.</p>
        ) : (
          <div style={styles.orderGrid}>
            {getActiveOrders().map((order) => (
              <div key={order.orderId} className="glass-panel" style={styles.orderCard}>
                <div style={styles.cardHeader}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    ID: #{order.orderId.substring(0, 8)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(order.createdAt * 1000).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ margin: '12px 0' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ORDER ITEMS</p>
                  {order.items?.map((item, idx) => (
                    <p key={idx} style={{ fontSize: '13px', margin: '2px 0' }}>
                      {item.quantity}x {item.itemCategory} ({item.serviceType.replace('_', ' ')})
                    </p>
                  ))}
                  <p style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '8px', color: 'var(--accent-secondary)' }}>
                    Payout: ₹{order.totalCost}
                  </p>
                </div>

                <div style={styles.addressSection}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    📍 <strong>Pickup:</strong> {order.pickupAddress}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    🕒 {order.pickupSlot}
                  </p>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.cardActions}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <p style={{ fontSize: '12px' }}>
                      Current Status: <strong style={{ color: 'var(--accent-primary)' }}>{order.status}</strong>
                    </p>
                    
                    {order.status === 'PLACED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'ACCEPTED', 'Accepted by Laundry Partner.')}
                        className="btn btn-primary"
                        style={styles.actionBtn}
                      >
                        Accept Order
                      </button>
                    )}

                    {order.status === 'PICKED_UP' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'PROCESSING', 'Laundry is now processing.')}
                        className="btn btn-secondary"
                        style={styles.actionBtn}
                      >
                        Start Processing
                      </button>
                    )}

                    {order.status === 'PROCESSING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'READY_FOR_DELIVERY', 'Laundry clean & folded. Ready for delivery.')}
                        className="btn btn-primary"
                        style={styles.actionBtn}
                      >
                        Mark Ready for Delivery
                      </button>
                    )}

                    {!['PLACED', 'PICKED_UP', 'PROCESSING'].includes(order.status) && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                        Waiting for Delivery Agent
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  kpi: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px 24px',
  },
  kpiIcon: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '2px',
  },
  kpiLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  orderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '12px',
  },
  orderCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  addressSection: {
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    margin: '10px 0',
  },
  divider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '12px 0',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'center',
  },
  actionBtn: {
    width: '100%',
    padding: '8px',
    fontSize: '13px',
  },
};
