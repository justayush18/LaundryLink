import React, { useState, useEffect } from 'react';
import { api, getFriendlyErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, CreditCard, Star, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import PlaceOrderWizard from './PlaceOrderWizard';
import CheckoutModal from './CheckoutModal';
import StatCard from '../Common/StatCard';
import EmptyState from '../Common/EmptyState';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [checkoutTotalCost, setCheckoutTotalCost] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const myOrders = await api.orders.getMyOrders();
      const sortedOrders = (myOrders || []).sort((a, b) => b.createdAt - a.createdAt);
      setOrders(sortedOrders);
      if (user && user.role) {
        const profile = await api.users.getProfile(user.role);
        setProfileData(profile);
      }
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePayNow = (orderId, totalCost) => {
    setCheckoutOrderId(orderId);
    setCheckoutTotalCost(totalCost);
    setCheckoutOpen(true);
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

      {/* Cancellation Policy Allowance and Stats 
      {profileData && (
        <div className="velora-card animate-fadeInUp" style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, #FFFFFF 0%, var(--sky-blue-light) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--primary-teal)', borderTopRightRadius: '20px', borderBottomRightRadius: '20px' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
              Free Monthly Cancellation Allowance
            </h4>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              Every customer gets 3 free cancellations per month. After exceeding, progressive progress-based charges apply.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif' }}>
                {profileData.monthlyCancellationsCount} / 3
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cancellations Used</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-teal)', fontFamily: 'Outfit, sans-serif' }}>
                {profileData.remainingFreeCancellations}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Remaining Free</span>
            </div>
          </div>
        </div>
      )}*/}

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
            actionLabel="Place Your Order"
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
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>#{order.orderId.substring(0, 7).toUpperCase()}</td>
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

      {/* Place Order Modal */}
      <PlaceOrderWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onOrderPlaced={() => {
          setIsWizardOpen(false);
          fetchDashboardData();
        }}
      />

      {/* Checkout Payment Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        orderId={checkoutOrderId}
        totalCost={checkoutTotalCost}
        onPaymentComplete={() => {
          setSuccessMsg('Fulfillment payment request successfully updated.');
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
