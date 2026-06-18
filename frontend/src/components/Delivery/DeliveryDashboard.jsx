import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Truck, CheckCircle2, Clock, MapPin, Navigation, 
  TrendingUp, Activity, Percent, Star
} from 'lucide-react';
import StatCard from '../Common/StatCard';
import EmptyState from '../Common/EmptyState';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({ pendingPickups: [], pendingDeliveries: [], assignedTasks: [] });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('rider_online');
    return saved !== 'false';
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

  const completed = history.filter(o => o.status === 'DELIVERED');
  const totalCompleted = completed.length;
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodaySeconds = Math.floor(startOfToday.getTime() / 1000);
  const completedTodayCount = completed.filter(o => o.updatedAt >= startOfTodaySeconds).length;

  const todayEarnings = completedTodayCount * 60;
  
  const nowSeconds = Math.floor(Date.now() / 1000);
  const startOfWeekSeconds = nowSeconds - 7 * 86400;
  const completedThisWeekCount = completed.filter(o => o.updatedAt >= startOfWeekSeconds).length;
  const weeklyEarnings = completedThisWeekCount * 60;

  const startOfMonthSeconds = nowSeconds - 30 * 86400;
  const completedThisMonthCount = completed.filter(o => o.updatedAt >= startOfMonthSeconds).length;
  const monthlyEarnings = completedThisMonthCount * 60;

  const totalEarnings = totalCompleted * 60;

  const cancelled = history.filter(o => o.status === 'CANCELLED').length;
  const successRate = (totalCompleted + cancelled) > 0 
    ? ((totalCompleted / (totalCompleted + cancelled)) * 100).toFixed(1) 
    : '100';

  const averageRating = totalCompleted > 0 ? (parseFloat(successRate) > 95 ? '4.9' : '4.7') : '5.0';
  
  const activeRunsCount = getMyActiveTasks().length;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PICKUP_ASSIGNED': return 'Pickup Claimed';
      case 'DELIVERY_ASSIGNED': return 'Delivery Claimed';
      default: return status.replace('_', ' ');
    }
  };

  return (
    <div className="main-content">
      {/* Welcome Row */}
      <div style={styles.welcomeRow}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            Welcome back, {user.displayName} Run!
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Fulfill active customer laundry pickup and delivery runs.
          </p>
        </div>
        <div style={styles.availabilityToggle}>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: '600', 
            color: isOnline ? '#03543F' : 'var(--text-secondary)' 
          }}>
            Availability: {isOnline ? 'Online' : 'Offline'}
          </span>
          <button 
            onClick={handleToggleOnline} 
            className="velora-btn velora-btn-secondary animate-pulse"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 16px', 
              fontSize: '12px',
              borderRadius: '20px',
              borderColor: isOnline ? '#31C78D' : 'var(--sky-blue)',
              background: isOnline ? '#DEF7EC' : '#FFFFFF',
              color: isOnline ? '#03543F' : 'var(--primary-navy)',
            }}
          >
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: isOnline ? '#31C78D' : 'var(--text-secondary)' 
            }} />
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success animate-fadeInUp">{success}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      {/* KPI Row */}
      <div className="grid-cols-4" style={{ marginBottom: '2.5rem', gap: '1.25rem' }}>
        <StatCard
          title="Active Runs"
          value={activeRunsCount}
          icon={Truck}
          description="Your current claimed tasks"
        />
        <StatCard
          title="Available Pickups"
          value={dashboard.pendingPickups?.length || 0}
          icon={Clock}
          description="Awaiting rider assignment"
        />
        <StatCard
          title="Available Deliveries"
          value={dashboard.pendingDeliveries?.length || 0}
          icon={Navigation}
          description="Ready at laundry hubs"
        />
        <StatCard
          title="Completed Today"
          value={completedTodayCount}
          icon={CheckCircle2}
          description="Runs finished today"
        />
      </div>

      {/* Rider Earnings & Performance Panels */}
      <div className="grid-cols-2" style={{ marginBottom: '2.5rem', gap: '1.5rem' }}>
        {/* Earnings Card */}
        <div className="velora-card animate-fadeInUp" style={{ padding: '2rem' }}>
          <div style={styles.cardHeader}>
            <TrendingUp size={18} color="var(--primary-teal)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Earnings Summary
            </h3>
          </div>
          <div style={styles.earningsGrid}>
            <div style={styles.earningsItem}>
              <span style={styles.earningsLabel}>Today's Earnings</span>
              <h4 style={{ ...styles.earningsVal, color: '#03543F' }}>₹{todayEarnings}</h4>
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
              <h4 style={{ ...styles.earningsVal, color: 'var(--primary-teal)' }}>₹{totalEarnings}</h4>
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 700 }}>
              <span>Monthly Target Progress (₹20,000)</span>
              <span>{Math.min(100, Math.round((monthlyEarnings / 20000) * 100))}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--sky-blue-light)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (monthlyEarnings / 20000) * 100)}%`, height: '100%', background: 'var(--primary-teal)', borderRadius: '4px', transition: 'width 0.5s ease-in-out' }}></div>
            </div>
          </div>
        </div>

        {/* Performance Card */}
        <div className="velora-card animate-fadeInUp" style={{ padding: '2rem' }}>
          <div style={styles.cardHeader}>
            <Activity size={18} color="#D97706" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Rider Performance
            </h3>
          </div>
          <div style={styles.performanceGrid}>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Success Rate</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Percent size={14} color="var(--primary-teal)" />
                <span style={styles.performanceVal}>{successRate}%</span>
              </div>
            </div>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Average Rating</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Star size={14} color="#FBBF24" fill="#FBBF24" />
                <span style={styles.performanceVal}>{averageRating} / 5.0</span>
              </div>
            </div>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Completed Tasks</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <CheckCircle2 size={14} color="#31C78D" />
                <span style={styles.performanceVal}>{totalCompleted} runs</span>
              </div>
            </div>
            <div style={styles.performanceItem}>
              <span style={styles.performanceLabel}>Active Assignments</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Truck size={14} color="var(--primary-navy)" />
                <span style={styles.performanceVal}>{activeRunsCount} claimed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Active tasks list */}
      <div className="velora-card animate-fadeInUp" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
          Active Navigation Route List
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading assignments...</p>
        ) : getMyActiveTasks().length === 0 ? (
          <EmptyState
            title="No claimed runs"
            description="You have no active pickup or delivery assignments right now. Claim runs from the Tasks Board."
            mascotState="thinking"
          />
        ) : (
          <div style={styles.runsContainer}>
            {getMyActiveTasks().map((task) => (
              <div key={task.orderId} className="velora-card card-hover" style={styles.runCard}>
                <div style={styles.runHeader}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-navy)' }}>
                      RUN: #{task.orderId.substring(0, 8).toUpperCase()}
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: 600 }}>
                      Client: {task.customerEmail}
                    </p>
                  </div>
                  <span className="badge badge-warning" style={{ fontSize: '10px', fontWeight: 700 }}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                <div style={styles.runDetails}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <MapPin size={16} color="var(--primary-teal)" style={{ marginTop: '2px' }} />
                    <div style={{ fontSize: '12px', color: 'var(--primary-navy)', fontWeight: 600 }}>
                      <strong>{task.status === 'PICKUP_ASSIGNED' ? 'Pickup Address' : 'Delivery Address'}:</strong>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {task.status === 'PICKUP_ASSIGNED' ? task.pickupAddress : task.deliveryAddress}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--primary-teal)', marginTop: '8px', marginBottom: 0, paddingLeft: '22px', fontWeight: 700 }}>
                    ⏱ Slot: {task.status === 'PICKUP_ASSIGNED' ? task.pickupSlot : task.deliverySlot}
                  </p>
                </div>

                <div style={styles.actions}>
                  {task.status === 'PICKUP_ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(task.orderId, 'PICKED_UP', 'Laundry picked up by delivery rider.')}
                      className="velora-btn velora-btn-primary animate-pulse"
                      style={{ width: '100%', padding: '10px', fontSize: '12px' }}
                    >
                      Confirm Picked Up
                    </button>
                  )}

                  {task.status === 'DELIVERY_ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(task.orderId, 'DELIVERED', 'Laundry delivered successfully.')}
                      className="velora-btn velora-btn-primary animate-pulse"
                      style={{ width: '100%', padding: '10px', fontSize: '12px' }}
                    >
                      Confirm Delivered
                    </button>
                  )}

                  {task.status === 'PICKED_UP' && (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', width: '100%', display: 'block', fontWeight: 600 }}>
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
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '16px',
  },
  availabilityToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '2px solid var(--bg-secondary)',
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
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 700,
  },
  earningsVal: {
    fontSize: '22px',
    fontWeight: '800',
    fontFamily: 'Outfit, sans-serif',
  },
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  performanceItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'var(--bg-secondary)',
    padding: '12px',
    borderRadius: '16px',
  },
  performanceLabel: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  performanceVal: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--primary-navy)',
  },
  runsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  runCard: {
    padding: '20px',
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '16px',
  },
  runHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2px solid var(--bg-secondary)',
    paddingBottom: '8px',
  },
  runDetails: {
    background: 'var(--bg-secondary)',
    padding: '12px',
    borderRadius: '16px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
};
