import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, CreditCard, Star, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import PlaceOrderWizard from './PlaceOrderWizard';
import ReviewModal from './ReviewModal';
import StatCard from '../Common/StatCard';
import EmptyState from '../Common/EmptyState';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState('');
  const [reviewPartnerEmail, setReviewPartnerEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const myOrders = await api.orders.getMyOrders();
      setOrders(myOrders || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePayNow = async (orderId, totalCost) => {
    try {
      const initReq = { orderId, paymentMethod: 'RAZORPAY' };
      const payment = await api.payments.initiate(initReq);
      
      const processReq = { transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(), simulateSuccess: true };
      await api.payments.process(payment.paymentId, processReq);
      
      setSuccessMsg(`Payment of ₹${totalCost} processed successfully! Invoice generated.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleOpenReview = (orderId, partnerEmail) => {
    setReviewOrderId(orderId);
    setReviewPartnerEmail(partnerEmail);
    setIsReviewOpen(true);
  };

  const getActiveOrders = () => {
    return orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  };

  const getCompletedOrders = () => {
    return orders.filter(o => o.status === 'DELIVERED');
  };

  const getSpentAmount = () => {
    return orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.totalCost, 0);
  };

  const getStatusBadge = (status) => {
    let badgeClass = 'badge-info';
    let text = status;

    switch (status) {
      case 'PLACED':
        badgeClass = 'badge-info';
        text = 'Placed';
        break;
      case 'ACCEPTED':
        badgeClass = 'badge-info';
        text = 'Accepted';
        break;
      case 'PICKUP_ASSIGNED':
        badgeClass = 'badge-warning';
        text = 'Pickup Assigned';
        break;
      case 'PICKED_UP':
        badgeClass = 'badge-warning';
        text = 'Picked Up';
        break;
      case 'PROCESSING':
        badgeClass = 'badge-warning';
        text = 'Processing';
        break;
      case 'READY_FOR_DELIVERY':
        badgeClass = 'badge-success';
        text = 'Ready';
        break;
      case 'DELIVERY_ASSIGNED':
        badgeClass = 'badge-warning';
        text = 'Out for Delivery';
        break;
      case 'DELIVERED':
        badgeClass = 'badge-success';
        text = 'Delivered';
        break;
      case 'CANCELLED':
        badgeClass = 'badge-error';
        text = 'Cancelled';
        break;
    }

    return <span className={`badge ${badgeClass}`}>{text}</span>;
  };

  return (
    <div className="main-content">
      {/* Welcome Row */}
      <div style={styles.welcomeRow}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            Hello, {user.displayName}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Let's get your garments fresh and clean today.
          </p>
        </div>
        <button onClick={() => setIsWizardOpen(true)} className="velora-btn velora-btn-primary animate-pulse">
          + Place New Order
        </button>
      </div>

      {successMsg && <div className="alert alert-success animate-fadeInUp">{successMsg}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      {/* KPI Cards Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '2.5rem', gap: '1.25rem' }}>
        <StatCard
          title="Active Orders"
          value={getActiveOrders().length}
          icon={Clock}
          description="In progress laundry trackings"
        />
        <StatCard
          title="Completed Orders"
          value={getCompletedOrders().length}
          icon={CheckCircle2}
          description="Successfully cleaned"
        />
        <StatCard
          title="Total Spent"
          value={`₹${getSpentAmount()}`}
          icon={CreditCard}
          description="Lifetime spent"
        />
        <StatCard
          title="Total Placed"
          value={orders.length}
          icon={ShoppingBag}
          description="Total orders history"
        />
      </div>

      {/* Active Orders List */}
      <div className="velora-card animate-fadeInUp" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
          Active Laundry Trackings
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading tracking details...</p>
        ) : getActiveOrders().length === 0 ? (
          <EmptyState
            title="No active orders"
            description="Your wardrobe looks dry. Schedule a fresh pickup to clean your clothes."
            actionLabel="Place Your First Order"
            onAction={() => setIsWizardOpen(true)}
            mascotState="thinking"
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Laundry Partner</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Pickup Slot</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getActiveOrders().map((order) => (
                  <tr key={order.orderId}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{order.orderId.substring(0, 8).toUpperCase()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{order.partnerEmail}</td>
                    <td style={{ fontWeight: 700 }}>₹{order.totalCost}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.pickupSlot}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!order.paymentId && (
                          <button
                            onClick={() => handlePayNow(order.orderId, order.totalCost)}
                            className="velora-btn velora-btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Pay Now
                          </button>
                        )}
                        {order.paymentId && (
                          <span style={{ fontSize: '12px', color: 'var(--primary-teal)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ Paid (Pending Delivery)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently Completed Orders */}
      <div className="velora-card animate-fadeInUp" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
          Recently Completed
        </h3>
        
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
        ) : getCompletedOrders().length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, textAlign: 'center', padding: '1.5rem 0' }}>No completed orders found.</p>
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
                {getCompletedOrders().slice(0, 5).map((order) => (
                  <tr key={order.orderId}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{order.orderId.substring(0, 8).toUpperCase()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{order.partnerEmail}</td>
                    <td style={{ fontWeight: 700 }}>₹{order.totalCost}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(order.updatedAt * 1000).toLocaleString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenReview(order.orderId, order.partnerEmail)}
                        className="velora-btn velora-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Star size={12} color="var(--primary-teal)" fill="var(--primary-teal)" />
                        Review Service
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Place Order Modal */}
      <PlaceOrderWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onOrderPlaced={() => {
          setIsWizardOpen(false);
          fetchDashboardData();
        }}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        orderId={reviewOrderId}
        partnerEmail={reviewPartnerEmail}
        onReviewSubmitted={() => {
          setSuccessMsg('Thank you! Review submitted successfully.');
          setTimeout(() => setSuccessMsg(''), 5000);
          fetchDashboardData();
        }}
      />
    </div>
  );
}

const styles = {
  welcomeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  }
};
