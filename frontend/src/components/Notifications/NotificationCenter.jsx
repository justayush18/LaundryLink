import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Bell, Check, Mail, MessageSquare, AlertCircle } from 'lucide-react';

export default function NotificationCenter({ unreadCount, setUnreadCount }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.notifications.getHistory();
      if (data && data.value) {
        setNotifications(data.value);
        setUnreadCount(data.unreadNotifications || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Setup periodic polling every 15 seconds to fetch new events
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown on click outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.notifications.markRead(id);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'ORDER_STATUS':
        return <span className="badge badge-info" style={styles.badge}>Order</span>;
      case 'PAYMENT':
        return <span className="badge badge-success" style={styles.badge}>Payment</span>;
      case 'DELIVERY':
        return <span className="badge badge-warning" style={styles.badge}>Delivery</span>;
      case 'REVIEW_REMINDER':
        return <span className="badge badge-error" style={styles.badge}>Review</span>;
      default:
        return <span className="badge" style={styles.badge}>{type}</span>;
    }
  };

  const formatTime = (epochSeconds) => {
    if (!epochSeconds) return '';
    const date = new Date(epochSeconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div ref={dropdownRef} style={styles.container}>
      <button onClick={handleToggle} style={styles.bellButton} title="Notifications">
        <Bell size={20} color={unreadCount > 0 ? 'var(--accent-secondary)' : 'var(--text-secondary)'} />
        {unreadCount > 0 && (
          <span style={styles.badgeCount}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="glass-card" style={styles.dropdown}>
          <div style={styles.header}>
            <h3 style={{ fontSize: '16px' }}>Notifications</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {unreadCount} unread
            </span>
          </div>

          <div style={styles.list}>
            {loading && notifications.length === 0 ? (
              <p style={styles.emptyText}>Loading...</p>
            ) : notifications.length === 0 ? (
              <p style={styles.emptyText}>No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    ...styles.item,
                    borderLeft: n.read ? '3px solid transparent' : '3px solid var(--accent-primary)',
                    background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                  }}
                >
                  <div style={styles.itemHeader}>
                    {getTypeBadge(n.type)}
                    <span style={styles.time}>{formatTime(n.createdAt)}</span>
                  </div>
                  <p style={styles.message}>{n.message}</p>
                  
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      style={styles.readButton}
                      title="Mark as read"
                    >
                      <Check size={14} style={{ marginRight: '4px' }} />
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
  },
  bellButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'var(--transition-smooth)',
  },
  badgeCount: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    background: 'var(--color-error)',
    color: '#fff',
    fontSize: '9px',
    fontWeight: 'bold',
    borderRadius: '10px',
    padding: '2px 5px',
    minWidth: '16px',
    textAlign: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '45px',
    right: 0,
    width: '340px',
    maxHeight: '450px',
    padding: '16px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '8px',
  },
  list: {
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  emptyText: {
    textAlign: 'center',
    padding: '24px 0',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  item: {
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'var(--transition-smooth)',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    fontSize: '9px',
    padding: '2px 6px',
  },
  time: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  message: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: 1.4,
  },
  readButton: {
    alignSelf: 'flex-end',
    background: 'none',
    border: 'none',
    color: 'var(--accent-secondary)',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'var(--transition-smooth)',
  },
};
