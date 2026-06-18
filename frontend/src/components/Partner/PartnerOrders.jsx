import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Eye, Filter, Calendar, ClipboardList } from 'lucide-react';
import EmptyState from '../Common/EmptyState';

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
      case 'READY_FOR_DELIVERY': return <span className="badge badge-success">Ready</span>;
      case 'DELIVERY_ASSIGNED': return <span className="badge badge-warning">Out for Delivery</span>;
      case 'DELIVERED': return <span className="badge badge-success">Delivered</span>;
      case 'CANCELLED': return <span className="badge badge-error">Cancelled</span>;
      default: return <span className="badge">{status}</span>;
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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
          Order Ledger
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
          Inspect client laundry orders, track historical fulfillment pipelines, and audit details.
        </p>
      </div>

      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      <div style={styles.grid}>
        {/* Orders Table Panel */}
        <div className="velora-card animate-fadeInUp" style={{ flex: 1.4, minWidth: '320px', padding: '2rem' }}>
          <div style={styles.filterBar}>
            <div style={styles.searchBox}>
              <Search size={16} color="var(--primary-teal)" style={{ marginLeft: '12px' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search ID or client email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', padding: '10px 12px', color: 'var(--primary-navy)', fontSize: '13px' }}
              />
            </div>

            <div style={styles.filterBox}>
              <Filter size={16} color="var(--primary-teal)" style={{ marginRight: '6px' }} />
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--primary-navy)', fontWeight: 600 }}
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
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading orders...</p>
          ) : getFilteredOrders().length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', margin: 0, fontWeight: 600 }}>No matching orders found.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Fulfillment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredOrders().map((o) => (
                    <tr key={o.orderId}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>#{o.orderId.substring(0, 8).toUpperCase()}</td>
                      <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-navy)' }}>{o.customerEmail}</td>
                      <td>{getStatusBadge(o.status)}</td>
                      <td>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="velora-btn velora-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
        <div className="velora-card animate-fadeInUp" style={{ flex: 0.9, minWidth: '320px', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
            Inspection Ticket
          </h3>

          {selectedOrder ? (
            <div style={styles.inspectCard}>
              <h4 style={{ fontFamily: 'monospace', fontSize: '13px', margin: '0 0 12px 0', color: 'var(--primary-teal)', fontWeight: 800 }}>
                TICKET: #{selectedOrder.orderId.toUpperCase()}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--primary-navy)', fontWeight: 500 }}>
                <p style={{ margin: 0 }}><strong>Customer:</strong> {selectedOrder.customerEmail}</p>
                <p style={{ margin: 0 }}><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                <p style={{ margin: 0 }}><strong>Delivery Slot:</strong> {selectedOrder.deliverySlot}</p>
              </div>

              <div style={styles.divider}></div>

              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>LAUNDRY ITEMS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '2px 0', fontWeight: 500, color: 'var(--primary-navy)' }}>
                      <span>{item.quantity}x {item.itemCategory}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.serviceType.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.divider}></div>

              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>TIMELINE LOGS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.history?.map((hist, idx) => (
                    <div key={idx} style={{ fontSize: '11px', background: '#FFFFFF', padding: '10px', borderRadius: '12px', borderLeft: '4px solid var(--primary-teal)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-navy)', fontWeight: 700 }}>
                        <span>{getStatusLabel(hist.status)}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {new Date(hist.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0, fontWeight: 500 }}>{hist.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <ClipboardList size={48} color="var(--primary-teal)" style={{ marginBottom: '1rem', opacity: 0.7 }} />
              <h4 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--primary-navy)', fontWeight: 700, margin: '0 0 8px 0' }}>No Order Selected</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '250px', margin: 0 }}>
                Select a client order and click "Inspect" to audit shipping parameters and workflow timestamps.
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
    background: 'var(--bg-secondary)',
    border: '2px solid var(--sky-blue)',
    borderRadius: '16px',
  },
  filterBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    border: '2px solid var(--sky-blue)',
    borderRadius: '16px',
    paddingLeft: '12px',
    minWidth: '160px',
  },
  inspectCard: {
    padding: '20px',
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
  },
  divider: {
    height: '2px',
    background: 'var(--sky-blue-light)',
    margin: '16px 0',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    textAlign: 'center',
  },
};
