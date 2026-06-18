import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User } from 'lucide-react';
import NotificationCenter from '../Notifications/NotificationCenter';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  if (!user) return null;

  // Determine breadcrumb based on URL path
  const getBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return { title: 'Dashboard', active: 'Overview' };
    }
    
    // Capitalize first segment (role context) and second segment (page name)
    const title = segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
    const active = segments[1]
      ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1).replace('-', ' ')
      : 'Overview';
      
    return { title, active };
  };

  const { title, active } = getBreadcrumbs();

  return (
    <header style={styles.header} className="glass-panel">
      <div style={styles.breadcrumb}>
        <span style={styles.breadcrumbTitle}>{title}</span>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbActive}>{active}</span>
      </div>

      <div style={styles.actions}>
        <NotificationCenter unreadCount={unreadCount} setUnreadCount={setUnreadCount} />

        <div style={styles.userProfile}>
          <div style={styles.avatar}>
            <User size={16} color="var(--text-secondary)" />
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.displayName}</span>
            <span style={styles.userEmail}>{user.email}</span>
          </div>
        </div>

        <button onClick={logout} style={styles.logoutButton} title="Sign Out">
          <LogOut size={18} />
          <span style={styles.logoutText}>Sign Out</span>
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '70px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    borderRadius: 0,
    borderBottom: '1px solid var(--border-color)',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    background: 'rgba(15, 23, 42, 0.4)',
    position: 'sticky',
    top: 0,
    zIndex: 900,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  breadcrumbTitle: {
    color: 'var(--text-muted)',
  },
  breadcrumbSeparator: {
    color: 'var(--text-muted)',
  },
  breadcrumbActive: {
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderRight: '1px solid var(--border-color)',
    paddingRight: '20px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  userEmail: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  logoutButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'var(--transition-smooth)',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
  },
  logoutText: {
    display: 'inline',
  },
};

// Handle mobile viewport hiding text labels
const styleSheet = document.styleSheets[0];
try {
  styleSheet.insertRule(`
    @media (max-width: 640px) {
      span {
        display: none;
      }
    }
  `, styleSheet.cssRules.length);
} catch (e) {}
