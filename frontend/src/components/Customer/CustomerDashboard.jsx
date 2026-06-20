import React, { useState, useEffect } from 'react';
import { api, getFriendlyErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, CreditCard, Star, Clock, CheckCircle2, ArrowRight, Check, Trash2, Loader2 } from 'lucide-react';
import PlaceOrderWizard from './PlaceOrderWizard';
import CheckoutModal from './CheckoutModal';
import StatCard from '../Common/StatCard';
import EmptyState from '../Common/EmptyState';
import VeloraMascot from '../Common/VeloraMascot';

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

  // Tracking and Cancellation States
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);
  const [cancelModalData, setCancelModalData] = useState(null); // { orderId, estimate }
  const [actionLoading, setActionLoading] = useState(false);

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

      // Sync active tracking order
      if (selectedTrackingOrder) {
        const updated = sortedOrders.find(o => o.orderId === selectedTrackingOrder.orderId);
        if (updated) {
          if (updated.status === 'DELIVERED' || updated.status === 'CANCELLED') {
            setSelectedTrackingOrder(null);
          } else {
            const detailed = await api.orders.getOrder(updated.orderId);
            setSelectedTrackingOrder(detailed);
          }
        } else {
          setSelectedTrackingOrder(null);
        }
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

  const handleSelectTracking = async (order) => {
    try {
      setActionLoading(true);
      const detailed = await api.orders.getOrder(order.orderId);
      setSelectedTrackingOrder(detailed);
      setError('');
    } catch (err) {
      setSelectedTrackingOrder(order);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setActionLoading(true);
      const estimate = await api.orders.getCancellationEstimate(orderId);
      setCancelModalData({ orderId, estimate });
      setError('');
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const executeCancelOrder = async () => {
    if (!cancelModalData) return;
    const { orderId } = cancelModalData;
    try {
      setActionLoading(true);
      await api.orders.updateStatus(orderId, { status: 'CANCELLED', notes: 'Cancelled by customer' });
      setCancelModalData(null);
      setSelectedTrackingOrder(null);
      fetchDashboardData();
      setSuccessMsg('Order cancelled successfully.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = ['PLACED', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'DELIVERED'];
    return steps.indexOf(status);
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



  const getActiveOrders = () => {
    return orders.filter(o => {
      if (o.status === 'DELIVERED' || o.status === 'CANCELLED') return false;
      // Filter out unpaid online orders:
      // 1. If payment is not initiated yet
      if (!o.paymentId) return false;
      // 2. If it is online payment (not COD) and status is not SUCCESS
      if (o.paymentMethod && o.paymentMethod !== 'COD' && o.paymentStatus !== 'SUCCESS') {
        return false;
      }
      return true;
    });
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

        {loading && orders.length === 0 ? (
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
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Active Orders Table */}
            <div style={{ flex: selectedTrackingOrder ? 1.2 : 1, minWidth: '320px', transition: 'all 0.3s ease' }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Laundry Partner</th>
                      <th>Total Cost</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getActiveOrders().map((order) => {
                      const isSelected = selectedTrackingOrder?.orderId === order.orderId;
                      return (
                        <tr 
                          key={order.orderId}
                          style={{ 
                            background: isSelected ? 'var(--sky-blue-light)' : 'transparent',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSelectTracking(order)}
                        >
                          <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                            #{order.orderId.substring(0, 7).toUpperCase()}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--primary-navy)', fontSize: '13px' }}>
                            {order.partnerEmail.split('@')[0]}
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{order.totalCost}</td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                              {!order.paymentId && (
                                <button
                                  onClick={() => handlePayNow(order.orderId, order.totalCost)}
                                  className="velora-btn velora-btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '8px' }}
                                >
                                  Pay Now
                                </button>
                              )}
                              <button
                                onClick={() => handleSelectTracking(order)}
                                className="velora-btn velora-btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '8px' }}
                              >
                                Track
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Active Order Details & Timeline */}
            {selectedTrackingOrder && (
              <div 
                className="animate-fadeInUp"
                style={{ 
                  flex: 1.8, 
                  minWidth: '320px', 
                  background: 'var(--bg-primary)', 
                  padding: '1.5rem', 
                  borderRadius: '24px', 
                  border: '1px solid var(--sky-blue)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sky-blue)', paddingBottom: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', color: 'var(--primary-navy)', fontWeight: 800, fontSize: '15px' }}>
                      Fulfillment Tracker
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>
                      #{selectedTrackingOrder.orderId.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedTrackingOrder.status !== 'DELIVERED' && selectedTrackingOrder.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelOrder(selectedTrackingOrder.orderId)}
                        className="velora-btn velora-btn-danger"
                        style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--color-error)', border: 'none', color: '#FFFFFF' }}
                        disabled={actionLoading}
                      >
                        <Trash2 size={12} />
                        Cancel Order
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedTrackingOrder(null)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Items & Price */}
                <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid var(--sky-blue-light)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedTrackingOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--primary-navy)', fontWeight: 600 }}>
                        <span>{item.quantity}x {item.itemCategory} ({item.serviceType.replace('_', ' ')})</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Pending care</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--sky-blue-light)', fontWeight: 800, fontSize: '13px', color: 'var(--primary-teal)' }}>
                    <span>Total Amount:</span>
                    <span>₹{selectedTrackingOrder.totalCost}</span>
                  </div>
                </div>

                {/* Pickup & Delivery Slots */}
                <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid var(--sky-blue-light)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0' }}>PICKUP SLOT</p>
                      <p style={{ fontSize: '11px', color: 'var(--primary-navy)', fontWeight: 700, margin: 0 }}>{selectedTrackingOrder.pickupSlot}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0' }}>DELIVERY SLOT</p>
                      <p style={{ fontSize: '11px', color: 'var(--primary-teal)', fontWeight: 800, margin: 0 }}>{selectedTrackingOrder.deliverySlot}</p>
                    </div>
                  </div>
                </div>

                {/* Live Status timeline */}
                <div style={{ background: '#FFFFFF', padding: '16px 14px', borderRadius: '16px', border: '1px solid var(--sky-blue-light)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 12px 0' }}>LIVE TIMELINE</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    {['Placed', 'Accepted', 'Pickup', 'Picked Up', 'Processing', 'Ready', 'Delivery', 'Delivered'].map((label, idx) => {
                      const activeStep = getStatusStep(selectedTrackingOrder.status);
                      const isDone = idx <= activeStep;
                      return (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center' }}>
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              border: '2px solid',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isDone ? 'var(--primary-teal)' : '#FFFFFF',
                              borderColor: isDone ? 'var(--primary-teal)' : 'var(--sky-blue)',
                              zIndex: 2,
                            }}
                          >
                            {isDone && <Check size={8} color="#FFFFFF" strokeWidth={4} />}
                          </div>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: isDone ? 'var(--primary-navy)' : 'var(--text-secondary)', marginTop: '4px' }}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Log History */}
                <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid var(--sky-blue-light)', maxHeight: '140px', overflowY: 'auto' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 8px 0' }}>FULFILLMENT HISTORY LOG</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTrackingOrder.history?.map((hist, idx) => (
                      <div key={idx} style={{ padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: '3px solid var(--primary-teal)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontWeight: 700 }}>
                          <span style={{ color: 'var(--primary-teal)' }}>{getStatusLabel(hist.status)}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {new Date(hist.timestamp * 1000).toLocaleTimeString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '9.5px', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
                          {hist.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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

      {/* Cancellation Warning Modal */}
      {cancelModalData && (
        <div style={styles.modalOverlay}>
          <div className="velora-card animate-scaleIn" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                Cancel Order
              </h3>
              <button onClick={() => setCancelModalData(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', fontSize: '16px', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <VeloraMascot state="thinking" size={90} style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px', fontWeight: 600 }}>
                  {cancelModalData.estimate.message}
                </p>
                
                {/* Charges & refund breakdown card */}
                <div style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--sky-blue)',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Cancellation Penalty Rate:</span>
                    <span style={{ color: 'var(--primary-navy)', fontWeight: 700 }}>
                      {cancelModalData.estimate.cancellationChargePercentage}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Penalty Charge Fee:</span>
                    <span style={{ color: 'var(--color-error)', fontWeight: 800 }}>
                      ₹{cancelModalData.estimate.cancellationFee.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', borderTop: '1px solid var(--sky-blue-light)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Refundable Amount:</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>
                      ₹{cancelModalData.estimate.refundAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p style={{ color: 'var(--primary-navy)', fontSize: '13px', fontWeight: 800, margin: '0 0 4px 0' }}>
                  ⚠️ Do you want to continue and cancel this order?
                </p>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setCancelModalData(null)}
                className="velora-btn velora-btn-secondary"
                disabled={actionLoading}
                style={{ justifyContent: 'center', minWidth: '100px' }}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={executeCancelOrder}
                className="velora-btn velora-btn-primary"
                disabled={actionLoading}
                style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)', color: '#FFFFFF', justifyContent: 'center', minWidth: '120px' }}
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(47, 65, 86, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '440px',
    padding: '2rem',
    borderRadius: '24px',
    background: '#FFFFFF',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid var(--sky-blue-light)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid var(--bg-secondary)',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  modalBody: {
    fontSize: '14px',
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
};
