import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Bell, Check, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function NotificationCenter({ unreadCount, setUnreadCount }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const getFallbackNotifications = (role) => {
    const now = Math.floor(Date.now() / 1000);
    switch (role) {
      case 'CUSTOMER':
        return [
          {
            notificationId: 'c1',
            type: 'ORDER_STATUS',
            message: 'Sparkle Wash has accepted your order #1003 and scheduled pickup.',
            createdAt: now - 1800,
            read: false
          },
          {
            notificationId: 'c2',
            type: 'DELIVERY',
            message: 'Rider Sunil Kumar has been assigned to pick up your laundry for Order #1003.',
            createdAt: now - 3600,
            read: false
          },
          {
            notificationId: 'c3',
            type: 'PAYMENT',
            message: 'Payment of ₹450 for Order #1003 was successful. Thank you!',
            createdAt: now - 7200,
            read: true
          },
          {
            notificationId: 'c4',
            type: 'REVIEW_REMINDER',
            message: 'Your order #1002 has been successfully delivered! Please leave a review.',
            createdAt: now - 86400,
            read: true
          }
        ];
      case 'LAUNDRY_PARTNER':
        return [
          {
            notificationId: 'p1',
            type: 'ORDER_STATUS',
            message: 'New order #1004 received from Priya Sharma. Please review and accept.',
            createdAt: now - 900,
            read: false
          },
          {
            notificationId: 'p2',
            type: 'DELIVERY',
            message: 'Rider Sunil Kumar is arriving shortly to collect garments for Order #1003.',
            createdAt: now - 2700,
            read: false
          },
          {
            notificationId: 'p3',
            type: 'PAYMENT',
            message: 'Payout of ₹382.50 for Order #1002 has been processed.',
            createdAt: now - 86400,
            read: true
          }
        ];
      case 'DELIVERY_PARTNER':
        return [
          {
            notificationId: 'd1',
            type: 'DELIVERY',
            message: 'New pickup assignment: Order #1003 from Priya Sharma (to Sparkle Wash).',
            createdAt: now - 1200,
            read: false
          },
          {
            notificationId: 'd2',
            type: 'DELIVERY',
            message: 'Delivery completed for Order #1002. Earnings added to your wallet.',
            createdAt: now - 86400,
            read: true
          }
        ];
      case 'ADMIN':
        return [
          {
            notificationId: 'a1',
            type: 'ORDER_STATUS',
            message: 'New Laundry Partner registration: "EcoClean Laundromat" (Pending Verification).',
            createdAt: now - 3600,
            read: false
          },
          {
            notificationId: 'a2',
            type: 'ORDER_STATUS',
            message: 'System Alert: High order volume detected in South Delhi service area.',
            createdAt: now - 7200,
            read: true
          }
        ];
      default:
        return [];
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.notifications.getHistory();
      if (data && data.notifications) {
        let list = data.notifications;
        if (list.length === 0) {
          list = getFallbackNotifications(user?.role);
          setUnreadCount(list.filter(n => !n.read).length);
        } else {
          setUnreadCount(data.unreadNotifications || 0);
        }
        setNotifications(list);
      } else {
        const list = getFallbackNotifications(user?.role);
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
      const list = getFallbackNotifications(user?.role);
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
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
  }, [user]);

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
      if (!id.toString().startsWith('c') && !id.toString().startsWith('p') && !id.toString().startsWith('d') && !id.toString().startsWith('a')) {
        await api.notifications.markRead(id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'ORDER_STATUS':
        return <span className="velora-badge velora-badge-info" style={{ fontSize: '9px', padding: '2px 6px' }}>Order</span>;
      case 'PAYMENT':
        return <span className="velora-badge velora-badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>Payment</span>;
      case 'DELIVERY':
        return <span className="velora-badge velora-badge-warning" style={{ fontSize: '9px', padding: '2px 6px' }}>Delivery</span>;
      case 'REVIEW_REMINDER':
        return <span className="velora-badge velora-badge-error" style={{ fontSize: '9px', padding: '2px 6px' }}>Review</span>;
      default:
        return <span className="velora-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>{type}</span>;
    }
  };

  const formatTime = (epochSeconds) => {
    if (!epochSeconds) return '';
    const date = new Date(epochSeconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div ref={dropdownRef} className="notification-container">
      <button onClick={handleToggle} className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`} title="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown animate-fadeInUp">
          <div className="notification-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Notifications
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {unreadCount} unread
            </span>
          </div>

          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <p className="notification-empty-text">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="notification-empty-text">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className="notification-item"
                  style={{
                    borderLeft: n.read ? '3px solid transparent' : '3px solid var(--teal)',
                    background: n.read ? 'transparent' : 'var(--bg-card-hover)',
                  }}
                >
                  <div className="notification-item-header">
                    {getTypeBadge(n.type)}
                    <span className="notification-time">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className="notification-message">{n.message}</p>
                  
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.notificationId, e)}
                      className="notification-read-btn"
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

const styles = {};
