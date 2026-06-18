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
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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
        return <span className="velora-badge velora-badge-info" style={styles.badge}>Order</span>;
      case 'PAYMENT':
        return <span className="velora-badge velora-badge-success" style={styles.badge}>Payment</span>;
      case 'DELIVERY':
        return <span className="velora-badge velora-badge-warning" style={styles.badge}>Delivery</span>;
      case 'REVIEW_REMINDER':
        return <span className="velora-badge velora-badge-error" style={styles.badge}>Review</span>;
      default:
        return <span className="velora-badge" style={styles.badge}>{type}</span>;
    }
  };

  const formatTime = (epochSeconds) => {
    if (!epochSeconds) return '';
    const date = new Date(epochSeconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div ref={dropdownRef} style={styles.container}>
      <button onClick={handleToggle} style={styles.bellButton} title="Notifications">
        <Bell size={20} color={unreadCount > 0 ? 'var(--primary-teal)' : 'var(--primary-navy)'} />
        {unreadCount > 0 && (
          <span style={styles.badgeCount}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="velora-card animate-fadeInUp" style={styles.dropdown}>
          <div style={styles.header}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Notifications
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
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
                    borderLeft: n.read ? '3px solid transparent' : '3px solid var(--primary-teal)',
                    background: n.read ? 'transparent' : '#F7FAFC',
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
                      <Check size={12} style={{ marginRight: '4px' }} />
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
    background: 'var(--bg-secondary)',
    border: '1px solid var(--sky-blue-light)',
    cursor: 'pointer',
    position: 'relative',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'var(--transition-smooth)',
  },
  badgeCount: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#EF4444',
    color: '#FFFFFF',
    fontSize: '9px',
    fontWeight: 'bold',
    borderRadius: '10px',
    padding: '2px 5px',
    minWidth: '16px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
  },
  dropdown: {
    position: 'absolute',
    top: '55px',
    right: 0,
    width: '340px',
    maxHeight: '450px',
    padding: '1.25rem',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '20px',
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
    boxShadow: '0 10px 30px rgba(47, 65, 86, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--sky-blue-light)',
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
    padding: '32px 0',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  item: {
    padding: '12px',
    borderRadius: '12px',
    borderBottom: '1px solid var(--sky-blue-light)',
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
    color: 'var(--text-secondary)',
  },
  message: {
    fontSize: '0.85rem',
    color: 'var(--primary-navy)',
    lineHeight: 1.4,
    margin: 0,
  },
  readButton: {
    alignSelf: 'flex-end',
    background: 'none',
    border: 'none',
    color: 'var(--primary-teal)',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '8px',
    transition: 'var(--transition-smooth)',
    fontFamily: 'Outfit, sans-serif',
  },
};
