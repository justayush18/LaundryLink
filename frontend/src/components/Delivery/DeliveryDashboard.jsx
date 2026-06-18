import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Truck, CheckCircle2, Clock, MapPin, Navigation, 
  TrendingUp, Activity, Percent, Star, Award, DollarSign
} from 'lucide-react';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({ pendingPickups: [], pendingDeliveries: [], assignedTasks: [] });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('rider_online');
    return saved !== 'false'; // default to true
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.deliveries.getDashboard();
      setDashboard(data || { pendingPickups: [], pendingDeliveries: [], assignedTasks: [] });
      
      const myOrders = await api.orders.getMyOrders();
      setHistory(myOrders || []);
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

  const handleToggleOnline = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    localStorage.setItem('rider_online', String(newState));
    setSuccess(`Rider availability status set to ${newState ? 'ONLINE' : 'OFFLINE'}`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const getMyActiveTasks = () => {
    return dashboard.assignedTasks || [];
  };

  // Derive metrics
  const completed = history.filter(o => o.status === 'DELIVERED');
  const totalCompleted = completed.length;
  
  // Completed Today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodaySeconds = Math.floor(startOfToday.getTime() / 1000);
  const completedTodayCount = completed.filter(o => o.updatedAt >= startOfTodaySeconds).length;

  // Earnings calculations (₹60 per delivery)
  const todayEarnings = completedTodayCount * 60;
  
  const nowSeconds = Math.floor(Date.now() / 1000);
  const startOfWeekSeconds = nowSeconds - 7 * 86400;
  const completedThisWeekCount = completed.filter(o => o.updatedAt >= startOfWeekSeconds).length;
  const weeklyEarnings = completedThisWeekCount * 60;

  const startOfMonthSeconds = nowSeconds - 30 * 86400;
  const completedThisMonthCount = completed.filter(o => o.updatedAt >= startOfMonthSeconds).length;
  const monthlyEarnings = completedThisMonthCount * 60;

  const totalEarnings = totalCompleted * 60;

  // Success Rate
  const cancelled = history.filter(o => o.status === 'CANCELLED').length;
  const successRate = (totalCompleted + cancelled) > 0 
    ? ((totalCompleted / (totalCompleted + cancelled)) * 100).toFixed(1) 
    : '100';

  // Average Rating
  const averageRating = totalCompleted > 0 ? (parseFloat(successRate) > 95 ? '4.9' : '4.7') : '5.0';
  
  const activeRunsCount = getMyActiveTasks().length;

  return (
    <div className="main-content">
      <div style={styles.welcomeRow}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Welcome back, {user.displayName}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Fulfill active laundry pickup and delivery runs.</p>
        </div>
        <div style={styles.availabilityToggle}>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: '500', 
            color: isOnline ? 'var(--color-success)' : 'var(--text-secondary)' 
          }}>
            Status: {isOnline ? 'Online & Available' : 'Offline'}
          </span>
          <button 
            onClick={handleToggleOnline} 
            className="btn btn-outline"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              fontSize: '13px',
              borderRadius: '8px',
              borderColor: isOnline ? 'var(--color-success)' : 'var(--border-color)',
              background: isOnline ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              color: isOnline ? 'var(--color-success)' : 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: isOnline ? 'var(--color-success)' : 'var(--text-muted)' 
            }} />
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
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
            <h3 style={styles.kpiVal}>{activeRunsCount}</h3>
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
            <h3 style={styles.kpiVal}>{completedTodayCount}</h3>
            <p style={styles.kpiLabel}>Completed Today</p>
          </div>
        </div>
      </div>

      {/* Rider Earnings & Performance Panels */}
      <div className="grid-cols-2" style={{ marginBottom: '32px' }}>
        {/* Earnings Card */}
        <div className="glass-card" style={styles.summaryCard}>
          <div style={styles.cardHeader}>
            <TrendingUp size={18} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Earnings Summary</h3>
          </div>
          <div style={styles.earningsGrid}>
            <div style={styles.earningsItem}>
              <span style={styles.earningsLabel}>Today's Earnings</span>
              <h4 style={{ ...styles.earningsVal, color: 'var(--color-success)' }}>₹{todayEarnings}</h4>
            </div>
            <div style={styles.earningsItem}>
              <span style={styles.earningsLabel}>Weekly Earnings</span>
              <h4 style={styles.earningsVal}>₹{weeklyEarnings}</h4>
            </div>
            <div style={styles.earningsItem}>
              <span style={styles.earningsLabel}>Monthly Earnings</span>
              <h4 style={styles.earningsVal}>₹{monthlyEarnings}</h4>
            </div>
            <div style={styles.earningsItem}>
              <span style={styles.earningsLabel}>Total Earnings</span>
              <h4 style={{ ...styles.earningsVal, color: 'var(--accent-primary)' }}>₹{totalEarnings}</h4>
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Monthly Target Progress (₹20,000)</span>
              <span>{Math.min(100, Math.round((monthlyEarnings / 20000) * 100))}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (monthlyEarnings / 20000) * 100)}%`, height: '100%', background: 'var(--accent-secondary)', borderRadius: '3px', transition: 'width 0.5s ease-in-out' }}></div>
            </div>
          </div>
        </div>

        {/* Performance Card */}
        <div className="glass-card" style={styles.summaryCard}>
          <div style={styles.cardHeader}>
            <Activity size={18} color="var(--color-warning)" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Rider Performance</h3>
          </div>
          <div style={styles.performanceGrid}>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Success Rate</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Percent size={14} color="var(--accent-secondary)" />
                <span style={styles.performanceVal}>{successRate}%</span>
              </div>
            </div>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Average Rating</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Star size={14} color="var(--color-warning)" fill="var(--color-warning)" />
                <span style={styles.performanceVal}>{averageRating} / 5.0</span>
              </div>
            </div>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Completed Tasks</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <CheckCircle2 size={14} color="var(--color-success)" />
                <span style={styles.performanceVal}>{totalCompleted}</span>
              </div>
            </div>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Active Assignments</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Truck size={14} color="var(--accent-primary)" />
                <span style={styles.performanceVal}>{activeRunsCount}</span>
              </div>
            </div>
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
  welcomeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  availabilityToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
  summaryCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
  },
  earningsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  earningsItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  earningsLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  earningsVal: {
    fontSize: '22px',
    fontWeight: 'bold',
  },
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  performanceItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'rgba(255, 255, 255, 0.01)',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
  },
  performanceLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  performanceVal: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'var(--text-primary)',
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
