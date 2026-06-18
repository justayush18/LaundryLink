import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Truck, CheckCircle2, Clock, MapPin, Navigation } from 'lucide-react';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({ pendingPickups: [], pendingDeliveries: [], assignedTasks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.deliveries.getDashboard();
      setDashboard(data || { pendingPickups: [], pendingDeliveries: [], assignedTasks: [] });
    } catch (err) {
      setError('Failed to fetch delivery dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateStatus = async (orderId, status, notes) => {
    try {
      setError('');
      await api.orders.updateStatus(orderId, { status, notes });
      setSuccess(`Task updated to ${status}!`);
      setTimeout(() => setSuccess(''), 4000);
      fetchDashboard();
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    }
  };

  const getMyActiveTasks = () => {
    return dashboard.assignedTasks || [];
  };

  const getCompletedTasksCount = () => {
    // Standard mock count or completed tasks
    return 2;
  };

  return (
    <div className="main-content">
      <div style={styles.welcome}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Welcome back, Rider</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Fulfill active laundry pickup and delivery runs.</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* KPI Row */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="glass-card" style={styles.kpi}>
          <div style={{ ...styles.kpiIcon, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
            <Truck size={20} />
          </div>
          <div>
            <h3 style={styles.kpiVal}>{getMyActiveTasks().length}</h3>
            <p style={styles.kpiLabel}>Active Runs</p>
          </div>
        </div>

        <div className="glass-card" style={styles.kpi}>
          <div style={{ ...styles.kpiIcon, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-secondary)' }}>
            <Clock size={20} />
          </div>
          <div>
            <h3 style={styles.kpiVal}>{dashboard.pendingPickups?.length || 0}</h3>
            <p style={styles.kpiLabel}>Available Pickups</p>
          </div>
        </div>

        <div className="glass-card" style={styles.kpi}>
          <div style={{ ...styles.kpiIcon, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
            <Navigation size={20} />
          </div>
          <div>
            <h3 style={styles.kpiVal}>{dashboard.pendingDeliveries?.length || 0}</h3>
            <p style={styles.kpiLabel}>Available Deliveries</p>
          </div>
        </div>

        <div className="glass-card" style={styles.kpi}>
          <div style={{ ...styles.kpiIcon, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--color-success)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 style={styles.kpiVal}>{getCompletedTasksCount()}</h3>
            <p style={styles.kpiLabel}>Completed Today</p>
          </div>
        </div>
      </div>

      {/* My Active tasks list */}
      <div className="glass-card">
        <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Active Navigation Route List</h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading assignments...</p>
        ) : getMyActiveTasks().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
            <Truck size={40} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
            <p>You have no claimed tasks assigned to you right now. Go to the "Tasks Board" to claim runs.</p>
          </div>
        ) : (
          <div style={styles.runsContainer}>
            {getMyActiveTasks().map((task) => (
              <div key={task.orderId} className="glass-panel" style={styles.runCard}>
                <div style={styles.runHeader}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                      RUN REF: #{task.orderId.substring(0, 8)}
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Client: {task.customerEmail}
                    </p>
                  </div>
                  <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={styles.runDetails}>
                  <p style={{ fontSize: '13px', display: 'flex', gap: '6px', color: 'var(--text-primary)' }}>
                    <MapPin size={14} color="var(--accent-secondary)" />
                    {task.status === 'PICKUP_ASSIGNED' ? (
                      <span><strong>Pickup Address:</strong> {task.pickupAddress}</span>
                    ) : (
                      <span><strong>Delivery Address:</strong> {task.deliveryAddress}</span>
                    )}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', paddingLeft: '20px' }}>
                    ⏱ Slot: {task.status === 'PICKUP_ASSIGNED' ? task.pickupSlot : task.deliverySlot}
                  </p>
                </div>

                <div style={styles.actions}>
                  {task.status === 'PICKUP_ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(task.orderId, 'PICKED_UP', 'Laundry picked up by delivery rider.')}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Confirm Picked Up
                    </button>
                  )}

                  {task.status === 'DELIVERY_ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(task.orderId, 'DELIVERED', 'Laundry delivered successfully.')}
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                    >
                      Confirm Delivered
                    </button>
                  )}

                  {task.status === 'PICKED_UP' && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Fulfillment in progress at Laundry hub
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  welcome: {
    marginBottom: '32px',
  },
  kpi: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px 24px',
  },
  kpiIcon: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '2px',
  },
  kpiLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  runsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  runCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '16px',
  },
  runHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  runDetails: {
    background: 'rgba(255, 255, 255, 0.01)',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
  },
};
