import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ClipboardList, Clock, Check, X, ShieldAlert, ArrowDown } from 'lucide-react';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.orders.getMyOrders();
      setOrders(data || []);
      if (selectedOrder) {
        // Refresh selected order details if open
        const updated = data.find(o => o.orderId === selectedOrder.orderId);
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
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading(true);
    try {
      await api.orders.updateStatus(orderId, { status: 'CANCELLED', notes: 'Cancelled by customer' });
      fetchOrders();
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const selectOrderDetails = async (order) => {
    try {
      // In Phase 5, GET /api/v1/orders/{orderId} returns full details with history transitions
      const detailed = await api.orders.getOrder(order.orderId);
      setSelectedOrder(detailed);
    } catch (err) {
      setSelectedOrder(order); // Fallback to list object
    }
  };

  const getStatusStep = (status) => {
    const steps = ['PLACED', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'DELIVERED'];
    return steps.indexOf(status);
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>My Orders</h1>
        <p style={{ color: 'var(--text-secondary)' }}>View and track your active and historical laundry orders.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={styles.dashboardGrid}>
        {/* Orders List */}
        <div className="glass-card" style={{ flex: 1.2, minWidth: '320px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Orders History</h3>
          
          {loading && orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No orders placed yet.</p>
          ) : (
            <div style={styles.ordersList}>
              {orders.map((o) => (
                <div
                  key={o.orderId}
                  onClick={() => selectOrderDetails(o)}
                  style={{
                    ...styles.orderItem,
                    borderColor: selectedOrder?.orderId === o.orderId ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: selectedOrder?.orderId === o.orderId ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                  }}
                  className="glass-panel"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                      ID: #{o.orderId.substring(0, 8)}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(o.createdAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      ₹{o.totalCost} • {o.items?.length || 0} items
                    </span>
                    {o.status === 'DELIVERED' ? (
                      <span className="badge badge-success">Delivered</span>
                    ) : o.status === 'CANCELLED' ? (
                      <span className="badge badge-error">Cancelled</span>
                    ) : (
                      <span className="badge badge-warning">{o.status.replace('_', ' ')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Order Details & Tracking */}
        <div className="glass-card" style={{ flex: 1.8, minWidth: '320px' }}>
          {selectedOrder ? (
            <div>
              <div style={styles.detailHeader}>
                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>
                    Order Details
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Full ID: {selectedOrder.orderId}
                  </span>
                </div>
                {selectedOrder.status === 'PLACED' && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.orderId)}
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    disabled={actionLoading}
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              {/* Items Card */}
              <div style={styles.detailCard} className="glass-panel">
                <h4 style={{ fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  Laundry Items Checklist
                </h4>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span>{item.quantity}x {item.itemCategory} ({item.serviceType.replace('_', ' ')})</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Fulfillment check</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <span>Total Cost:</span>
                  <span style={{ color: 'var(--accent-secondary)' }}>₹{selectedOrder.totalCost}</span>
                </div>
              </div>

              {/* Delivery Parameters */}
              <div style={styles.detailCard} className="glass-panel">
                <h4 style={{ fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  Pickup & Delivery Slots
                </h4>
                <div style={styles.grid2}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PICKUP FROM</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedOrder.pickupAddress}</p>
                    <p style={{ fontSize: '12px', color: 'var(--accent-secondary)', marginTop: '4px' }}>⏱ {selectedOrder.pickupSlot}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DELIVER TO</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{selectedOrder.deliveryAddress}</p>
                    <p style={{ fontSize: '12px', color: 'var(--accent-secondary)', marginTop: '4px' }}>⏱ {selectedOrder.deliverySlot}</p>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              {selectedOrder.status !== 'CANCELLED' && (
                <div style={styles.detailCard} className="glass-panel">
                  <h4 style={{ fontSize: '14px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
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
                              background: isDone ? 'var(--accent-secondary)' : 'var(--bg-secondary)',
                              borderColor: isDone ? 'var(--accent-secondary)' : 'var(--border-color)',
                            }}
                          >
                            {isDone && <Check size={10} color="#000" />}
                          </div>
                          <span style={{ fontSize: '12px', color: isDone ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '4px' }}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Logs */}
              <div style={styles.detailCard} className="glass-panel">
                <h4 style={{ fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  Fulfillment History Log
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedOrder.history?.map((hist, idx) => (
                    <div key={idx} style={styles.historyLog}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--accent-secondary)' }}>{hist.status}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {new Date(hist.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {hist.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <ClipboardList size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Select an order from the list to view its full details and track status logs.</p>
            </div>
          )}
        </div>
      </div>
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
    maxHeight: '70vh',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  orderItem: {
    padding: '16px',
    cursor: 'pointer',
    borderLeft: '4px solid transparent',
    transition: 'var(--transition-smooth)',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  detailCard: {
    padding: '16px',
    marginBottom: '16px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  timeline: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    padding: '0 8px',
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
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 'var(--radius-sm)',
    borderLeft: '3px solid var(--border-color)',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    textAlign: 'center',
  },
};
