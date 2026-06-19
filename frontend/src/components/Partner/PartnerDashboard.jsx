import React, { useState, useEffect } from 'react';
import { api, getFriendlyErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Star, CheckCircle, Award } from 'lucide-react';
import StatCard from '../Common/StatCard';
import EmptyState from '../Common/EmptyState';

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
      const prof = await api.partners.getProfile();
      setProfile(prof);
      
      const allOrders = await api.orders.getMyOrders(); 
      setOrders(allOrders || []);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
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
      setSuccess(`Order updated to ${getStatusLabel(newStatus)}!`);
      setTimeout(() => setSuccess(''), 4000);
      fetchPartnerDashboard();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PLACED': return 'Placed';
      case 'ACCEPTED': return 'Accepted';
      case 'PICKUP_ASSIGNED': return 'Pickup Assigned';
      case 'PICKED_UP': return 'Picked Up';
      case 'PROCESSING': return 'Processing';
      case 'READY_FOR_DELIVERY': return 'Ready';
      case 'DELIVERY_ASSIGNED': return 'Out for Delivery';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            {profile ? profile.businessName : 'Laundry Partner Panel'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Manage rate cards, verify documents, and fulfill customer laundry tasks.
          </p>
        </div>
        {profile && getOnboardingBadge(profile.onboardingStatus)}
      </div>

      {success && <div className="alert alert-success animate-fadeInUp">{success}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      {/* Cancellation Policy Banner/Status */}
      {profile && (
        <div className="velora-card animate-fadeInUp" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--sky-blue-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
                Monthly Cancellation Allowance
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
                You have a free allowance of 10 cancellations per month. Exceeding this incurs a financial penalty of <strong>₹{profile.cancellationPenaltyPerOrder.toFixed(2)}</strong> per order.
              </p>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                Cancellation Rate: <strong style={{ color: 'var(--primary-navy)' }}>{profile.cancellationPercentage.toFixed(1)}%</strong>
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                  {profile.monthlyCancellationsUsed}/10
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>
                  Used This Month
                </span>
              </div>
              
              {/* Warning Badges */}
              {profile.monthlyCancellationsUsed >= 10 ? (
                <span className="badge badge-error animate-pulse" style={{ fontSize: '11px', padding: '6px 12px', fontWeight: 700 }}>
                  Allowance Exceeded (Penalty: ₹{profile.cancellationPenaltyOwed.toFixed(2)} owed)
                </span>
              ) : profile.monthlyCancellationsUsed >= 8 ? (
                <span className="badge badge-warning" style={{ fontSize: '11px', padding: '6px 12px', fontWeight: 700 }}>
                  Approaching Limit
                </span>
              ) : (
                <span className="badge badge-success" style={{ fontSize: '11px', padding: '6px 12px', fontWeight: 700 }}>
                  Healthy Status
                </span>
              )}
            </div>
          </div>

          {/* Cancellation History Ledger */}
          {profile.cancellationHistory && profile.cancellationHistory.length > 0 && (
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--sky-blue-light)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-navy)', margin: '0 0 10px 0' }}>
                Cancellation History
              </h4>
              <div className="table-container" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--sky-blue-light)' }}>
                      <th style={{ textAlign: 'left', padding: '6px', color: 'var(--primary-navy)' }}>Order ID</th>
                      <th style={{ textAlign: 'left', padding: '6px', color: 'var(--primary-navy)' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '6px', color: 'var(--primary-navy)' }}>Reason</th>
                      <th style={{ textAlign: 'right', padding: '6px', color: 'var(--primary-navy)' }}>Penalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.cancellationHistory.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '6px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-navy)' }}>
                          #{item.orderId.substring(0, 7).toUpperCase()}
                        </td>
                        <td style={{ padding: '6px', color: 'var(--text-secondary)' }}>
                          {new Date(item.cancelledAt * 1000).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '6px', color: 'var(--text-secondary)' }}>
                          {item.reason}
                        </td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: item.penaltyApplied > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                          {item.penaltyApplied > 0 ? `₹${item.penaltyApplied.toFixed(2)}` : 'Free'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '2.5rem', gap: '1.25rem' }}>
        <StatCard
          title="Active Workload"
          value={getActiveOrders().length}
          icon={ShoppingBag}
          description="Awaiting washing/ironing"
        />
        <StatCard
          title="Reputation Rating"
          value={profile ? (profile.reputationScore ? profile.reputationScore.toFixed(1) : '5.0') : '5.0'}
          icon={Star}
          description="Average customer rating"
        />
        <StatCard
          title="Completed Orders"
          value={orders.filter(o => o.status === 'DELIVERED').length}
          icon={CheckCircle}
          description="Lifetime fulfillments"
        />
        <StatCard
          title="Customer Reviews"
          value={profile ? profile.totalReviews : 0}
          icon={Award}
          description="Total reviews received"
        />
      </div>

      {/* Fulfillments Board */}
      <div className="velora-card animate-fadeInUp" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
          Active Laundry Fulfillment Board
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading operations...</p>
        ) : getActiveOrders().length === 0 ? (
          <EmptyState
            title="No active orders"
            description="Your operations board is clear. New customer laundry schedules will appear here."
            mascotState="sleeping"
          />
        ) : (
          <div style={styles.orderGrid}>
            {getActiveOrders().map((order) => (
              <div key={order.orderId} className="velora-card card-hover" style={styles.orderCard}>
                <div style={styles.cardHeader}>
                  <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-navy)' }}>
                    #{order.orderId.substring(0, 7).toUpperCase()}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {new Date(order.createdAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ margin: '1rem 0' }}>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                    Order Items
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {order.items?.map((item, idx) => (
                      <p key={idx} style={{ fontSize: '13px', margin: 0, fontWeight: 500, color: 'var(--primary-navy)' }}>
                        {item.quantity}x {item.itemCategory} ({item.serviceType.replace('_', ' ')})
                      </p>
                    ))}
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 800, marginTop: '10px', marginBottom: 0, color: 'var(--primary-teal)' }}>
                    Payout: ₹{order.totalCost}
                  </p>
                </div>

                <div style={styles.addressSection}>
                  <p style={{ fontSize: '12px', color: 'var(--primary-navy)', margin: 0, fontWeight: 500 }}>
                    📍 <strong>Address:</strong> {order.pickupAddress}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0, fontWeight: 600 }}>
                    🕒 {order.pickupSlot}
                  </p>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.cardActions}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    <p style={{ fontSize: '12px', margin: 0, color: 'var(--primary-navy)', fontWeight: 600 }}>
                      Current Status: <span className="badge badge-info">{getStatusLabel(order.status)}</span>
                    </p>
                    
                    {order.status === 'PLACED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'ACCEPTED', 'Accepted by Laundry Partner.')}
                        className="velora-btn velora-btn-primary animate-pulse"
                        style={styles.actionBtn}
                      >
                        Accept Order
                      </button>
                    )}

                    {order.status === 'PICKED_UP' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'PROCESSING', 'Laundry is now processing.')}
                        className="velora-btn velora-btn-secondary"
                        style={styles.actionBtn}
                      >
                        Start Processing
                      </button>
                    )}

                    {order.status === 'PROCESSING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'READY_FOR_DELIVERY', 'Laundry clean & folded. Ready for delivery.')}
                        className="velora-btn velora-btn-primary animate-pulse"
                        style={styles.actionBtn}
                      >
                        Mark Ready for Pickup
                      </button>
                    )}

                    {['ACCEPTED', 'PROCESSING', 'READY_FOR_DELIVERY'].includes(order.status) && (
                      <button
                        onClick={() => {
                          const reason = prompt("Please enter the reason for cancellation:");
                          if (reason !== null && reason.trim() !== '') {
                            handleUpdateStatus(order.orderId, 'CANCELLED', reason);
                          } else if (reason !== null) {
                            alert("Cancellation reason is required.");
                          }
                        }}
                        className="velora-btn velora-btn-secondary"
                        style={{ ...styles.actionBtn, marginTop: '8px', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                      >
                        Cancel Order
                      </button>
                    )}

                    {!['PLACED', 'PICKED_UP', 'PROCESSING'].includes(order.status) && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', fontWeight: 600 }}>
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
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  orderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '8px',
  },
  orderCard: {
    padding: '20px',
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid var(--bg-secondary)',
    paddingBottom: '8px',
  },
  addressSection: {
    background: 'var(--bg-secondary)',
    padding: '12px',
    borderRadius: '16px',
    margin: '10px 0',
  },
  divider: {
    height: '2px',
    background: 'var(--bg-secondary)',
    margin: '12px 0',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'center',
  },
  actionBtn: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 700,
  },
};
