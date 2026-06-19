import React, { useState, useEffect } from 'react';
import { api, getFriendlyErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Truck, CheckCircle2, Clock, MapPin, Navigation, 
  TrendingUp, Activity, Percent, Star
} from 'lucide-react';
import StatCard from '../Common/StatCard';
import EmptyState from '../Common/EmptyState';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({ 
    assignedTasks: [], 
    activeDeliveries: [], 
    upcomingPickups: [], 
    completedDeliveries: [],
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    dailyCancellations: 0,
    online: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('assigned');
  
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('rider_online');
    return saved === 'true';
  });

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [totalOnlineSeconds, setTotalOnlineSeconds] = useState(() => {
    const saved = localStorage.getItem('rider_total_online_seconds');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [sessionCompletions, setSessionCompletions] = useState(() => {
    const saved = localStorage.getItem('rider_session_completions');
    return saved ? parseInt(saved, 10) : 0;
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.deliveries.getDashboard();
      if (data) {
        setDashboard(data);
        setIsOnline(data.online);
        localStorage.setItem('rider_online', data.online ? 'true' : 'false');
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    let intervalId;
    if (isOnline) {
      let startTimeStr = localStorage.getItem('rider_online_start_time');
      if (!startTimeStr) {
        startTimeStr = String(Date.now());
        localStorage.setItem('rider_online_start_time', startTimeStr);
      }
      const startTime = parseInt(startTimeStr, 10);

      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSessionSeconds(elapsed >= 0 ? elapsed : 0);
      };
      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOnline]);

  const handleUpdateStatus = async (orderId, status, notes) => {
    try {
      setError('');
      setSuccess('');
      await api.orders.updateStatus(orderId, { status, notes });
      setSuccess(`Task successfully updated to ${getStatusLabel(status)}!`);
      setTimeout(() => setSuccess(''), 4000);

      if (isOnline && (status === 'PICKED_UP' || status === 'DELIVERED')) {
        const newCompletions = sessionCompletions + 1;
        setSessionCompletions(newCompletions);
        localStorage.setItem('rider_session_completions', String(newCompletions));
      }

      fetchDashboard();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  const handleAcceptTask = async (orderId) => {
    try {
      setError('');
      setSuccess('');
      await api.deliveries.acceptTask(orderId);
      setSuccess('Task accepted successfully!');
      setTimeout(() => setSuccess(''), 4000);
      fetchDashboard();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  const handleCancelTask = async (orderId) => {
    try {
      setError('');
      setSuccess('');
      await api.deliveries.cancelTask(orderId);
      setSuccess('Task cancelled and returned to assignment queue.');
      setTimeout(() => setSuccess(''), 4000);
      fetchDashboard();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  const handleToggleOnline = async () => {
    try {
      setError('');
      setSuccess('');
      if (isOnline) {
        if (sessionCompletions < 1) {
          setError('To go offline, please complete at least one pickup or delivery task first. Thank you for your hard work!');
          setTimeout(() => setError(''), 5000);
          return;
        }

        await api.deliveries.updateAvailability(false);
        const startTime = localStorage.getItem('rider_online_start_time');
        let elapsed = 0;
        if (startTime) {
          elapsed = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
        }
        const newTotal = totalOnlineSeconds + elapsed;
        setTotalOnlineSeconds(newTotal);
        localStorage.setItem('rider_total_online_seconds', String(newTotal));
        
        localStorage.removeItem('rider_online_start_time');
        localStorage.removeItem('rider_session_completions');
        setSessionSeconds(0);
        setSessionCompletions(0);

        setIsOnline(false);
        localStorage.setItem('rider_online', 'false');
        setSuccess('Rider availability status set to OFFLINE');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        await api.deliveries.updateAvailability(true);
        setIsOnline(true);
        localStorage.setItem('rider_online', 'true');
        localStorage.setItem('rider_online_start_time', String(Date.now()));
        localStorage.setItem('rider_session_completions', '0');
        setSessionSeconds(0);
        setSessionCompletions(0);
        setSuccess('Rider availability status set to ONLINE');
        setTimeout(() => setSuccess(''), 4000);
      }
      fetchDashboard();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  const formatDuration = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PLACED': return 'Placed';
      case 'ACCEPTED': return 'Accepted';
      case 'PICKUP_ASSIGNED': return 'Pickup Claimed';
      case 'PICKED_UP': return 'Picked Up';
      case 'PROCESSING': return 'Processing';
      case 'READY_FOR_DELIVERY': return 'Ready';
      case 'DELIVERY_ASSIGNED': return 'Delivery Claimed';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status.replace('_', ' ');
    }
  };

  const getTabList = () => {
    switch (activeTab) {
      case 'assigned': return dashboard.assignedTasks || [];
      case 'pickups': return dashboard.upcomingPickups || [];
      case 'active': return dashboard.activeDeliveries || [];
      case 'completed': return dashboard.completedDeliveries || [];
      default: return [];
    }
  };

  const activeRunsCount = (dashboard.activeDeliveries?.length || 0) + (dashboard.upcomingPickups?.length || 0);
  const totalCompleted = dashboard.completedDeliveries?.length || 0;
  
  const todayEarnings = dashboard.todayEarnings || 0;
  const weeklyEarnings = dashboard.weeklyEarnings || 0;
  const monthlyEarnings = dashboard.monthlyEarnings || 0;
  const totalEarnings = dashboard.totalEarnings || 0;
  const dailyCancellations = dashboard.dailyCancellations || 0;

  const successRate = totalCompleted > 0 ? '97.5' : '100';
  const averageRating = totalCompleted > 0 ? '4.9' : '5.0';

  return (
    <div className="main-content">
      {/* Welcome Row */}
      <div style={styles.welcomeRow}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            Welcome back, {user.displayName}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Fulfill active customer laundry pickup and delivery runs.
          </p>
        </div>
        <div style={styles.availabilityToggle}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', marginRight: '8px' }}>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '700', 
              color: isOnline ? '#03543F' : 'var(--text-secondary)' 
            }}>
              Availability: {isOnline ? 'Online' : 'Offline'}
            </span>
            {isOnline && (
              <span style={{ fontSize: '11px', color: 'var(--primary-teal)', fontWeight: 600 }}>
                Session: {formatDuration(sessionSeconds)}
              </span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Online: {formatDuration(totalOnlineSeconds + (isOnline ? sessionSeconds : 0))}
            </span>
          </div>
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
          title="Assigned Tasks"
          value={dashboard.assignedTasks?.length || 0}
          icon={Clock}
          description="Awaiting acceptance"
        />
        <StatCard
          title="Upcoming Pickups"
          value={dashboard.upcomingPickups?.length || 0}
          icon={Navigation}
          description="Accepted pickup tasks"
        />
        <StatCard
          title="Active Deliveries"
          value={dashboard.activeDeliveries?.length || 0}
          icon={Truck}
          description="Runs in progress"
        />
        <StatCard
          title="Completed Deliveries"
          value={dashboard.completedDeliveries?.length || 0}
          icon={CheckCircle2}
          description="Successfully completed"
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
              <span style={styles.performanceLabel}>Cancellations Today</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Activity size={14} color={dailyCancellations >= 2 ? "#EF4444" : "#D97706"} />
                <span style={styles.performanceVal}>{dailyCancellations} / 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Dashboard Container */}
      <div className="velora-card animate-fadeInUp" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
          Delivery Dashboard Navigation
        </h3>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('assigned')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'assigned' ? 'var(--primary-teal)' : 'transparent',
              color: activeTab === 'assigned' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Assigned Tasks ({dashboard.assignedTasks?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('pickups')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'pickups' ? 'var(--primary-teal)' : 'transparent',
              color: activeTab === 'pickups' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Upcoming Pickups ({dashboard.upcomingPickups?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'active' ? 'var(--primary-teal)' : 'transparent',
              color: activeTab === 'active' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Active Deliveries ({dashboard.activeDeliveries?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'completed' ? 'var(--primary-teal)' : 'transparent',
              color: activeTab === 'completed' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Completed ({dashboard.completedDeliveries?.length || 0})
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading assignments...</p>
        ) : getTabList().length === 0 ? (
          <EmptyState
            title={`No ${activeTab} tasks`}
            description={`You have no tasks in ${activeTab} category right now.`}
            mascotState="thinking"
          />
        ) : (
          <div style={styles.runsContainer}>
            {getTabList().map((task) => (
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
                      <strong>{['PICKUP_ASSIGNED', 'PLACED', 'ACCEPTED'].includes(task.status) ? 'Pickup Address' : 'Delivery Address'}:</strong>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {['PICKUP_ASSIGNED', 'PLACED', 'ACCEPTED'].includes(task.status) ? task.pickupAddress : task.deliveryAddress}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--primary-teal)', marginTop: '8px', marginBottom: 0, paddingLeft: '22px', fontWeight: 700 }}>
                    ⏱ Slot: {['PICKUP_ASSIGNED', 'PLACED', 'ACCEPTED'].includes(task.status) ? task.pickupSlot : task.deliverySlot}
                  </p>
                </div>

                <div style={styles.actions}>
                  {activeTab === 'assigned' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      <button
                        onClick={() => handleAcceptTask(task.orderId)}
                        className="velora-btn velora-btn-primary animate-pulse"
                        style={{ width: '100%', padding: '10px', fontSize: '12px' }}
                      >
                        Accept Task
                      </button>
                      {dailyCancellations >= 2 ? (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '10px', 
                          background: '#FDE8E8', 
                          color: '#EF4444', 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          borderRadius: '12px',
                          border: '1px solid #F8B4B4'
                        }}>
                          Daily cancellation limit reached (2/2).
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCancelTask(task.orderId)}
                          className="velora-btn velora-btn-secondary"
                          style={{ width: '100%', padding: '10px', fontSize: '12px', borderColor: '#EF4444', color: '#EF4444' }}
                        >
                          Cancel Task
                        </button>
                      )}
                    </div>
                  )}

                  {activeTab === 'pickups' && (
                    <button
                      onClick={() => handleUpdateStatus(task.orderId, 'PICKED_UP', 'Laundry picked up by delivery rider.')}
                      className="velora-btn velora-btn-primary animate-pulse"
                      style={{ width: '100%', padding: '10px', fontSize: '12px' }}
                    >
                      Mark Picked Up
                    </button>
                  )}

                  {activeTab === 'active' && (
                    <div style={{ width: '100%' }}>
                      {task.status === 'DELIVERY_ASSIGNED' ? (
                        <button
                          onClick={() => handleUpdateStatus(task.orderId, 'DELIVERED', 'Laundry delivered successfully.')}
                          className="velora-btn velora-btn-primary animate-pulse"
                          style={{ width: '100%', padding: '10px', fontSize: '12px' }}
                        >
                          Mark Delivered
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', width: '100%', display: 'block', fontWeight: 600 }}>
                          Fulfillment in progress at Laundry hub
                        </span>
                      )}
                    </div>
                  )}

                  {activeTab === 'completed' && (
                    <span style={{ fontSize: '12px', color: 'var(--primary-teal)', fontStyle: 'italic', textAlign: 'center', width: '100%', display: 'block', fontWeight: 600 }}>
                      Delivered successfully.
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
