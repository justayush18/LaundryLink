import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Filter, Eye, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [deliveryPartnerEmail, setDeliveryPartnerEmail] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (status) filters.status = status;
      if (customerEmail) filters.customerEmail = customerEmail;
      if (partnerEmail) filters.partnerEmail = partnerEmail;
      if (deliveryPartnerEmail) filters.deliveryPartnerEmail = deliveryPartnerEmail;

      const data = await api.admin.getOrders(filters);
      setOrders(data || []);
    } catch (err) {
      setError('Failed to fetch system orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [status, customerEmail, partnerEmail, deliveryPartnerEmail]);

  const handleInspect = async (orderId) => {
    try {
      const detailed = await api.admin.getOrder(orderId);
      setSelectedOrder(detailed);
    } catch (err) {
      setError('Failed to load order audit log details');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLACED': return <span className="badge badge-info">Placed</span>;
      case 'ACCEPTED': return <span className="badge badge-info">Accepted</span>;
      case 'PICKUP_ASSIGNED': return <span className="badge badge-warning">Pickup Assigned</span>;
      case 'PICKED_UP': return <span className="badge badge-warning">Picked Up</span>;
      case 'PROCESSING': return <span className="badge badge-warning">Processing</span>;
      case 'READY_FOR_DELIVERY': return <span className="badge badge-warning">Ready</span>;
      case 'DELIVERY_ASSIGNED': return <span className="badge badge-warning">Out for Delivery</span>;
      case 'DELIVERED': return <span className="badge badge-success">Delivered</span>;
      case 'CANCELLED': return <span className="badge badge-error">Cancelled</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>System Orders</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Audit and monitor all laundry orders, fulfillment timelines, and rider coordinates.</p>
        </div>
        <button onClick={fetchOrders} className="btn btn-outline" disabled={loading}>
          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh Table
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={styles.grid}>
        {/* Table & Filters */}
        <div className="glass-card" style={{ flex: 1.4, minWidth: '320px' }}>
          {/* Filters Bar */}
          <div style={styles.filterGrid}>
            <div className="form-group">
              <label className="form-label">Order Status</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ background: 'var(--bg-secondary)', padding: '8px' }}
              >
                <option value="">All Statuses</option>
                <option value="PLACED">Placed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="PROCESSING">Processing</option>
                <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Customer Email</label>
              <input
                type="text"
                className="form-control"
                placeholder="aarav@..."
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Merchant Email</label>
              <input
                type="text"
                className="form-control"
                placeholder="partner@..."
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rider Email</label>
              <input
                type="text"
                className="form-control"
                placeholder="rider@..."
                value={deliveryPartnerEmail}
                onChange={(e) => setDeliveryPartnerEmail(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading ledger...</p>
          ) : orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No matching orders found.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Merchant</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.orderId}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>#{o.orderId.substring(0, 8)}</td>
                      <td style={{ fontSize: '12px' }}>{o.customerEmail}</td>
                      <td style={{ fontSize: '12px' }}>{o.partnerEmail}</td>
                      <td>{getStatusBadge(o.status)}</td>
                      <td>
                        <button
                          onClick={() => handleInspect(o.orderId)}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Inspect Ticket */}
        <div className="glass-card" style={{ flex: 0.9, minWidth: '320px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>System Audit Ticket</h3>

          {selectedOrder ? (
            <div className="glass-panel" style={styles.inspectCard}>
              <h4 style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent-secondary)' }}>
                Audit Ref: #{selectedOrder.orderId}
              </h4>
              <div style={{ margin: '14px 0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p><strong>Customer:</strong> {selectedOrder.customerEmail}</p>
                <p><strong>Merchant Partner:</strong> {selectedOrder.partnerEmail}</p>
                <p><strong>Assigned Rider:</strong> {selectedOrder.deliveryPartnerEmail || 'Unassigned'}</p>
                <p><strong>Fulfillment Cost:</strong> ₹{selectedOrder.totalCost}</p>
              </div>

              <div style={styles.divider}></div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>ITEMS</p>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '2px 0' }}>
                    <span>{item.quantity}x {item.itemCategory}</span>
                    <span>{item.serviceType.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>

              <div style={styles.divider}></div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>TIMESTAMPS & HISTORY</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.history?.map((hist, idx) => (
                    <div key={idx} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.01)', padding: '6px', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        <span>{hist.status}</span>
                        <span>{new Date(hist.timestamp * 1000).toLocaleTimeString()}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{hist.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Select an order and click "Inspect" next to it to audit system logs, addresses, items, and riders.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  grid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  inspectCard: {
    padding: '16px',
    background: 'rgba(15, 23, 42, 0.5)',
  },
  divider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '14px 0',
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
