import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Filter, Eye, RefreshCw, AlertCircle, ShoppingBag, Clock } from 'lucide-react';
import CustomSelect from '../Common/CustomSelect';

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
      case 'PLACED': return <span className="velora-badge velora-badge-info">Placed</span>;
      case 'PICKUP_ASSIGNED': return <span className="velora-badge velora-badge-warning">Pickup Assigned</span>;
      case 'PICKUP_COMPLETED': return <span className="velora-badge velora-badge-warning">Pickup Completed</span>;
      case 'PROCESSING': return <span className="velora-badge velora-badge-warning">Processing</span>;
      case 'READY_FOR_DELIVERY': return <span className="velora-badge velora-badge-warning">Ready for Delivery</span>;
      case 'DELIVERY_ASSIGNED': return <span className="velora-badge velora-badge-warning">Delivery Assigned</span>;
      case 'DELIVERED': return <span className="velora-badge velora-badge-success">Delivered</span>;
      case 'CANCELLED': return <span className="velora-badge velora-badge-error">Cancelled</span>;
      default: return <span className="velora-badge">{status}</span>;
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            System Orders
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Audit and monitor all laundry orders, fulfillment timelines, and rider coordinates.
          </p>
        </div>
        <button 
          onClick={fetchOrders} 
          className="velora-btn velora-btn-secondary" 
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
          Refresh Table
        </button>
      </div>

      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      <div style={styles.grid}>
        {/* Table & Filters */}
        <div className="velora-card animate-fadeInUp" style={{ flex: 1.4, minWidth: '320px', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)', padding: '1.5rem' }}>
          {/* Filters Bar */}
          <div style={styles.filterGrid}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-navy)', fontSize: '0.85rem' }}>Order Status</label>
              <CustomSelect
                className="velora-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ background: '#FFFFFF', padding: '8px 12px', height: '42px', fontSize: '0.85rem' }}
              >
                <option value="">All Statuses</option>
                <option value="PLACED">Placed</option>
                <option value="PICKUP_ASSIGNED">Pickup Assigned</option>
                <option value="PICKUP_COMPLETED">Pickup Completed</option>
                <option value="PROCESSING">Processing</option>
                <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
                <option value="DELIVERY_ASSIGNED">Delivery Assigned</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </CustomSelect>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-navy)', fontSize: '0.85rem' }}>Customer Email</label>
              <input
                type="text"
                className="velora-input"
                placeholder="aarav@..."
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                style={{ height: '42px', fontSize: '0.85rem', padding: '8px 12px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-navy)', fontSize: '0.85rem' }}>Merchant Email</label>
              <input
                type="text"
                className="velora-input"
                placeholder="partner@..."
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                style={{ height: '42px', fontSize: '0.85rem', padding: '8px 12px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-navy)', fontSize: '0.85rem' }}>Rider Email</label>
              <input
                type="text"
                className="velora-input"
                placeholder="rider@..."
                value={deliveryPartnerEmail}
                onChange={(e) => setDeliveryPartnerEmail(e.target.value)}
                style={{ height: '42px', fontSize: '0.85rem', padding: '8px 12px' }}
              />
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>Loading ledger...</p>
          ) : orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>No matching orders found.</p>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table className="velora-table">
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
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary-navy)', fontWeight: 600 }}>
                        #{o.orderId.substring(0, 7).toUpperCase()}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{o.customerEmail}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{o.partnerEmail}</td>
                      <td>{getStatusBadge(o.status)}</td>
                      <td>
                        <button
                          onClick={() => handleInspect(o.orderId)}
                          className="velora-btn velora-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', height: 'auto' }}
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
        <div className="velora-card animate-fadeInUp" style={{ flex: 0.9, minWidth: '320px', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '12px', margin: '0 0 1rem 0' }}>
            System Audit Ticket
          </h3>

          {selectedOrder ? (
            <div className="velora-card" style={styles.inspectCard}>
              <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem', color: 'var(--primary-teal)', margin: '0 0 12px 0', fontWeight: 700 }}>
                Audit Ref: #{selectedOrder.orderId.substring(0, 7).toUpperCase()}
              </h4>
              <div style={{ margin: '14px 0', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0 }}><strong style={{ color: 'var(--primary-navy)' }}>Customer:</strong> {selectedOrder.customerEmail}</p>
                <p style={{ margin: 0 }}><strong style={{ color: 'var(--primary-navy)' }}>Merchant Partner:</strong> {selectedOrder.partnerEmail}</p>
                <p style={{ margin: 0 }}><strong style={{ color: 'var(--primary-navy)' }}>Assigned Rider:</strong> {selectedOrder.deliveryPartnerEmail || 'Unassigned'}</p>
                <p style={{ margin: 0 }}><strong style={{ color: 'var(--primary-navy)' }}>Fulfillment Cost:</strong> ₹{selectedOrder.totalCost}</p>
              </div>

              <div style={styles.divider}></div>

              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-navy)', letterSpacing: '0.05em', marginBottom: '8px' }}>ITEMS</p>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', margin: '4px 0', color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: 600 }}>{item.quantity}x {item.itemCategory}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.serviceType.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>

              <div style={styles.divider}></div>

              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-navy)', letterSpacing: '0.05em', marginBottom: '8px' }}>TIMESTAMPS & HISTORY</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.history?.map((hist, idx) => (
                    <div key={idx} style={{ fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '12px', border: '1px solid var(--sky-blue-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '4px' }}>
                        <span>{hist.status}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <Clock size={10} /> {new Date(hist.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.75rem' }}>{hist.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <div style={{ background: 'var(--bg-secondary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center', margin: '0 auto 16px auto', color: 'var(--text-secondary)' }}>
                <ShoppingBag size={28} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '320px', margin: '0 auto', lineHeight: 1.5 }}>
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
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '16px',
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
    background: 'var(--bg-secondary)',
    border: '1px solid var(--sky-blue-light)',
    borderRadius: '16px',
    boxShadow: 'none',
  },
  divider: {
    height: '1px',
    background: 'var(--sky-blue-light)',
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
