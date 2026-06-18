import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Eye, Filter, Calendar } from 'lucide-react';

export default function PartnerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.orders.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      setError('Failed to fetch orders ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getFilteredOrders = () => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Order Ledger</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Inspect client laundry orders, track historical flows, and filter details.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={styles.grid}>
        {/* Orders Table Panel */}
        <div className="glass-card" style={{ flex: 1.4, minWidth: '320px' }}>
          <div style={styles.filterBar}>
            <div style={styles.searchBox}>
              <Search size={16} color="var(--text-muted)" style={{ marginLeft: '10px' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search ID or client email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', padding: '8px' }}
              />
            </div>

            <div style={styles.filterBox}>
              <Filter size={16} color="var(--text-muted)" style={{ marginRight: '6px' }} />
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PLACED">Placed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="PROCESSING">Processing</option>
                <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>Loading orders...</p>
          ) : getFilteredOrders().length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No matching orders found.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Fulfillment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredOrders().map((o) => (
                    <tr key={o.orderId}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>#{o.orderId.substring(0, 8)}</td>
                      <td style={{ fontSize: '13px' }}>{o.customerEmail}</td>
                      <td>{getStatusBadge(o.status)}</td>
                      <td>
                        <button
                          onClick={() => setSelectedOrder(o)}
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

        {/* Inspect Panel */}
        <div className="glass-card" style={{ flex: 0.9, minWidth: '320px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Inspection Ticket</h3>

          {selectedOrder ? (
            <div className="glass-panel" style={styles.inspectCard}>
              <h4 style={{ fontFamily: 'monospace', fontSize: '14px', marginBottom: '12px', color: 'var(--accent-secondary)' }}>
                Ticket ID: #{selectedOrder.orderId.substring(0, 8)}
              </h4>
              <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Customer Email:</strong> {selectedOrder.customerEmail}</p>
              <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}</p>
              <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Slot:</strong> {selectedOrder.deliverySlot}</p>

              <div style={styles.divider}></div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>LAUNDRY ITEMS</p>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '2px 0' }}>
                    <span>{item.quantity}x {item.itemCategory}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.serviceType.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>

              <div style={styles.divider}></div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>TIMELINE LOGS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.history?.map((hist, idx) => (
                    <div key={idx} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.01)', padding: '6px', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-primary)', fontWeight: 600 }}>
                        <span>{hist.status}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {new Date(hist.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{hist.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <ClipboardList size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Select an order and click "Inspect" to view its full details, address, and status timestamps.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    flex: 1.5,
    minWidth: '200px',
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
  },
  filterBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    paddingLeft: '10px',
    minWidth: '160px',
  },
  inspectCard: {
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.5)',
  },
  divider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '16px 0',
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
