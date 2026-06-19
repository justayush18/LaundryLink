import React, { useState, useEffect } from 'react';
import { api, getFriendlyErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Star, ShoppingBag, XCircle, CheckCircle2, Clock } from 'lucide-react';
import ReviewModal from './ReviewModal';
import EmptyState from '../Common/EmptyState';

export default function CustomerOrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review Modal States
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState('');
  const [reviewPartnerEmail, setReviewPartnerEmail] = useState('');
  
  // Tab control: 'completed' | 'cancelled'
  const [activeTab, setActiveTab] = useState('completed');

  const fetchOrdersHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.orders.getMyOrders();
      const sortedData = (data || []).sort((a, b) => b.createdAt - a.createdAt);
      setOrders(sortedData);
      const reviews = await api.reviews.getHistory();
      const reviewedIds = new Set((reviews || []).map(r => r.orderId));
      setReviewedOrderIds(reviewedIds);
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersHistory();
  }, []);

  const handleOpenReview = (orderId, partnerEmail) => {
    setReviewOrderId(orderId);
    setReviewPartnerEmail(partnerEmail);
    setIsReviewOpen(true);
  };

  const getCompletedOrders = () => {
    return orders.filter(o => o.status === 'DELIVERED');
  };

  const getCancelledOrders = () => {
    return orders.filter(o => o.status === 'CANCELLED');
  };

  return (
    <div className="main-content">
      {/* Title Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
          Order History
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
          Inspect your past laundry fulfillment cycles, completed orders, and cancellation fee breakdowns.
        </p>
      </div>

      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      {/* Tabs Menu */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            ...styles.tabButton,
            color: activeTab === 'completed' ? 'var(--primary-teal)' : 'var(--text-secondary)',
            borderBottomColor: activeTab === 'completed' ? 'var(--primary-teal)' : 'transparent',
            fontWeight: activeTab === 'completed' ? 800 : 600,
          }}
        >
          <CheckCircle2 size={16} />
          Completed Orders ({getCompletedOrders().length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          style={{
            ...styles.tabButton,
            color: activeTab === 'cancelled' ? 'var(--primary-teal)' : 'var(--text-secondary)',
            borderBottomColor: activeTab === 'cancelled' ? 'var(--primary-teal)' : 'transparent',
            fontWeight: activeTab === 'cancelled' ? 800 : 600,
          }}
        >
          <XCircle size={16} />
          Order Cancellation History({getCancelledOrders().length})
        </button>
      </div>

      {/* Table Content */}
      <div className="velora-card animate-fadeInUp" style={{ padding: '2rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading order records...</p>
        ) : activeTab === 'completed' ? (
          getCompletedOrders().length === 0 ? (
            <EmptyState
              title="No completed orders"
              description="You haven't completed any laundry orders yet. Keep tracking active ones!"
              mascotState="sleeping"
            />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Laundry Partner</th>
                    <th>Total Cost</th>
                    <th>Delivered Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getCompletedOrders().map((order) => (
                    <tr key={order.orderId}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                        #{order.orderId.substring(0, 7).toUpperCase()}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{order.partnerEmail}</td>
                      <td style={{ fontWeight: 700 }}>₹{order.totalCost}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {new Date(order.updatedAt * 1000).toLocaleString()}
                      </td>
                      <td>
                        {reviewedOrderIds.has(order.orderId) ? (
                          <span style={{ fontSize: '12px', color: 'var(--primary-teal)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ Reviewed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenReview(order.orderId, order.partnerEmail)}
                            className="velora-btn velora-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Star size={12} color="var(--primary-teal)" fill="var(--primary-teal)" />
                            Review Service
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          getCancelledOrders().length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, textAlign: 'center', padding: '2rem 0' }}>
              No cancelled orders found.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Laundry Partner</th>
                    <th>Cancelled Date</th>
                    <th>Cancellation Fee</th>
                    <th>Refund Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {getCancelledOrders().map((order) => (
                    <tr key={order.orderId}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                        #{order.orderId.substring(0, 7).toUpperCase()}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{order.partnerEmail}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {new Date(order.updatedAt * 1000).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 700, color: order.cancellationFee > 0 ? 'var(--color-error)' : 'var(--text-secondary)' }}>
                        ₹{order.cancellationFee != null ? order.cancellationFee.toFixed(2) : '0.00'}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                        ₹{order.refundAmount != null ? order.refundAmount.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        orderId={reviewOrderId}
        partnerEmail={reviewPartnerEmail}
        onSubmitSuccess={fetchOrdersHistory}
      />
    </div>
  );
}

const styles = {
  tabsContainer: {
    display: 'flex',
    gap: '24px',
    borderBottom: '2px solid var(--sky-blue-light)',
    marginBottom: '20px',
    paddingBottom: '2px',
  },
  tabButton: {
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '8px 4px 12px 4px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
};
