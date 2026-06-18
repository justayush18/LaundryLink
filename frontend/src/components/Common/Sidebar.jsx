import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Star,
  DollarSign,
  FileText,
  ClipboardList,
  Truck,
  Users,
  Building2,
  TrendingUp,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  const getLinks = () => {
    switch (user.role) {
      case 'CUSTOMER':
        return [
          { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/customer/orders', label: 'My Orders', icon: ShoppingBag },
          { to: '/customer/payments', label: 'My Payments', icon: CreditCard },
          { to: '/customer/reviews', label: 'Reviews', icon: Star },
        ];
      case 'LAUNDRY_PARTNER':
        return [
          { to: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/partner/orders', label: 'Orders', icon: ShoppingBag },
          { to: '/partner/pricing', label: 'Pricing & Rates', icon: DollarSign },
          { to: '/partner/documents', label: 'Documents', icon: FileText },
        ];
      case 'DELIVERY_PARTNER':
        return [
          { to: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/delivery/tasks', label: 'Tasks Board', icon: ClipboardList },
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/users', label: 'Users', icon: Users },
          { to: '/admin/partners', label: 'Partners', icon: Building2 },
          { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
          { to: '/admin/payments', label: 'Payments', icon: CreditCard },
          { to: '/admin/reports', label: 'Reports', icon: TrendingUp },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside style={styles.sidebar} className="glass-panel">
      <div style={styles.brandContainer}>
        <span style={styles.brand}>LaundryLink</span>
        {user && (
          <span className="badge badge-info" style={styles.roleBadge}>
            {user.role.replace('_', ' ')}
          </span>
        )}
      </div>

      <nav style={styles.nav}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                ...styles.link,
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderColor: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              })}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    height: '100vh',
    position: 'sticky',
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    borderRadius: 0,
    borderRight: '1px solid var(--border-color)',
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    background: 'rgba(15, 23, 42, 0.6)',
  },
  brandContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 8px 24px 8px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '24px',
  },
  brand: {
    fontSize: '22px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: '6px',
    fontSize: '10px',
    padding: '2px 8px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    fontWeight: 500,
    borderLeft: '3px solid transparent',
    transition: 'var(--transition-smooth)',
    cursor: 'pointer',
  },
};
