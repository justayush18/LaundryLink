import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ClipboardList, Check, Trash2 } from 'lucide-react';
import VeloraMascot from '../Common/VeloraMascot';
import EmptyState from '../Common/EmptyState';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalData, setCancelModalData] = useState(null); // { orderId, estimate }

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.orders.getMyOrders();
      const sortedData = (data || []).sort((a, b) => b.createdAt - a.createdAt);
      setOrders(sortedData);
      if (selectedOrder) {
        const updated = sortedData.find(o => o.orderId === selectedOrder.orderId);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      setError('Failed to fetch orders list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    try {
      setActionLoading(true);
      const estimate = await api.orders.getCancellationEstimate(orderId);
      setCancelModalData({ orderId, estimate });
    } catch (err) {
      alert(err.message || 'Failed to calculate cancellation charges');
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
      fetchOrders();
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'CANCELLED' }));
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const selectOrderDetails = async (order) => {
    try {
      const detailed = await api.orders.getOrder(order.orderId);
      setSelectedOrder(detailed);
    } catch (err) {
      setSelectedOrder(order);
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

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
          My Orders
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
          Track and manage your active and past laundry fulfillment cycles.
        </p>
      </div>

      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      <div style={styles.dashboardGrid}>
        {/* Orders List */}
        <div className="velora-card animate-fadeInUp" style={{ flex: 1.2, minWidth: '320px', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
            Orders History
          </h3>
          
          {loading && orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading orders...</p>
          ) : orders.length === 0 ? (
            <EmptyState 
              title="No orders placed yet" 
              description="Your order history is empty. Go ahead and schedule your first laundry pick up!"
              mascotState="sleeping"
            />
          ) : (
            <div style={styles.ordersList}>
              {orders.map((o) => {
                const isSelected = selectedOrder?.orderId === o.orderId;
                return (
                  <div
                    key={o.orderId}
                    onClick={() => selectOrderDetails(o)}
                    style={{
                      ...styles.orderItem,
                      borderColor: isSelected ? 'var(--primary-teal)' : 'var(--sky-blue-light)',
                      background: isSelected ? 'var(--sky-blue-light)' : '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-navy)' }}>
                        #{o.orderId.substring(0, 7).toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {new Date(o.createdAt * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        ₹{o.totalCost} • {o.items?.length || 0} items
                      </span>
                      <span className={`badge ${o.status === 'DELIVERED' ? 'badge-success' : o.status === 'CANCELLED' ? 'badge-error' : 'badge-info'}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Order Details & Tracking */}
        <div className="velora-card animate-fadeInUp" style={{ flex: 1.8, minWidth: '320px', padding: '2rem' }}>
          {selectedOrder ? (
            <div>
              <div style={styles.detailHeader}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
                    Order Details
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>
                    ID: #{selectedOrder.orderId.substring(0, 7).toUpperCase()}
                  </span>
                </div>
                {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.orderId)}
                    className="velora-btn velora-btn-danger"
                    style={{ padding: '8px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    disabled={actionLoading}
                  >
                    <Trash2 size={13} />
                    Cancel Order
                  </button>
                )}
              </div>

              {/* Items Card */}
              <div style={styles.detailCard}>
                <h4 style={styles.cardSectionTitle}>
                  Laundry Checklist
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--primary-navy)', fontWeight: 500 }}>
                      <span>{item.quantity}x {item.itemCategory} ({item.serviceType.replace('_', ' ')})</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Pending care</span>
                    </div>
                  ))}
                </div>
                <div style={styles.totalRow}>
                  <span>Total Cost:</span>
                  <span style={{ color: 'var(--primary-teal)', fontWeight: 800 }}>₹{selectedOrder.totalCost}</span>
                </div>
              </div>

              {/* Delivery Parameters */}
              <div style={styles.detailCard}>
                <h4 style={styles.cardSectionTitle}>
                  Pickup & Delivery Slots
                </h4>
                <div style={styles.grid2}>
                  <div>
                    <p style={styles.slotLabel}>PICKUP FROM</p>
                    <p style={styles.slotAddress}>{selectedOrder.pickupAddress}</p>
                    <p style={styles.slotTime}>⏱ {selectedOrder.pickupSlot}</p>
                  </div>
                  <div>
                    <p style={styles.slotLabel}>DELIVER TO</p>
                    <p style={styles.slotAddress}>{selectedOrder.deliveryAddress}</p>
                    <p style={styles.slotTime}>⏱ {selectedOrder.deliverySlot}</p>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              {selectedOrder.status !== 'CANCELLED' && (
                <div style={styles.detailCard}>
                  <h4 style={styles.cardSectionTitle}>
                    Status Timeline
                  </h4>
                  <div style={styles.timeline}>
                    {['Placed', 'Accepted', 'Pickup', 'Picked Up', 'Processing', 'Ready', 'Delivery', 'Delivered'].map((label, idx) => {
                      const activeStep = getStatusStep(selectedOrder.status);
                      const isDone = idx <= activeStep;
                      return (
                        <div key={label} style={styles.timelineStep}>
                          <div
                            style={{
                              ...styles.stepDot,
                              background: isDone ? 'var(--primary-teal)' : '#FFFFFF',
                              borderColor: isDone ? 'var(--primary-teal)' : 'var(--sky-blue)',
                            }}
                          >
                            {isDone && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: isDone ? 'var(--primary-navy)' : 'var(--text-secondary)', marginTop: '6px' }}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Logs */}
              <div style={styles.detailCard}>
                <h4 style={styles.cardSectionTitle}>
                  Fulfillment History Log
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.history?.map((hist, idx) => (
                    <div key={idx} style={styles.historyLog}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                        <span style={{ color: 'var(--primary-teal)' }}>{getStatusLabel(hist.status)}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {new Date(hist.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                        {hist.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <VeloraMascot state="thinking" size={120} style={{ marginBottom: '1rem' }} />
              <h4 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--primary-navy)', fontWeight: 700, margin: '0 0 8px 0' }}>No Order Selected</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', maxWidth: '300px', margin: 0, lineHeight: 1.5 }}>Select an order from the history panel to view live tracking details and status updates.</p>
            </div>
          )}
        </div>
      </div>

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
  dashboardGrid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '65vh',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  orderItem: {
    padding: '14px 16px',
    cursor: 'pointer',
    borderRadius: '16px',
    border: '2px solid',
    transition: 'all 0.2s ease',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid var(--bg-secondary)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  detailCard: {
    padding: '16px',
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
    marginBottom: '16px',
  },
  cardSectionTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    borderBottom: '1px solid var(--sky-blue)',
    paddingBottom: '8px',
    marginBottom: '12px',
    marginTop: 0,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    fontWeight: 700,
    fontSize: '13px',
    borderTop: '1px solid var(--sky-blue)',
    paddingTop: '8px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  slotLabel: {
    fontSize: '9px',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    margin: '0 0 4px 0',
  },
  slotAddress: {
    fontSize: '12px',
    color: 'var(--primary-navy)',
    fontWeight: 600,
    margin: '0 0 4px 0',
  },
  slotTime: {
    fontSize: '11px',
    color: 'var(--primary-teal)',
    fontWeight: 700,
    margin: 0,
  },
  timeline: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    padding: '0 4px',
  },
  timelineStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    textAlign: 'center',
  },
  stepDot: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  historyLog: {
    padding: '8px 12px',
    background: '#FFFFFF',
    borderRadius: '12px',
    borderLeft: '4px solid var(--primary-teal)',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    textAlign: 'center',
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
