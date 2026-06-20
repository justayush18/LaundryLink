import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Star,
  DollarSign,
  FileText,
  ClipboardList,
  Users,
  Building2,
  TrendingUp,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import NotificationCenter from '../Notifications/NotificationCenter';
import VeloraMascot from './VeloraMascot';

export default function FloatingNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopProfileRef = useRef(null);
  const mobileProfileRef = useRef(null);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/login');
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      const clickedOutsideDesktop = !desktopProfileRef.current || !desktopProfileRef.current.contains(event.target);
      const clickedOutsideMobile = !mobileProfileRef.current || !mobileProfileRef.current.contains(event.target);
      
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Define links based on user role
  const getLinks = () => {
    if (!user) {
      // Public landing page links
      return [
        { to: '/#features', label: 'Features' },
        { to: '/#how-it-works', label: 'How It Works' },
        { to: '/#pricing', label: 'Pricing' },
      ];
    }

    switch (user.role) {
      case 'CUSTOMER':
        return [
          { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/customer/orders', label: 'Orders', icon: ShoppingBag },
          { to: '/customer/order-history', label: 'History', icon: ClipboardList },
          { to: '/customer/payments', label: 'Payments', icon: CreditCard },
          { to: '/customer/reviews', label: 'Reviews', icon: Star },
          { to: '/terms', label: 'Policies', icon: FileText },
        ];
      case 'LAUNDRY_PARTNER':
        return [
          { to: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/partner/orders', label: 'Orders', icon: ShoppingBag },
          { to: '/partner/pricing', label: 'Rates', icon: DollarSign },
          { to: '/partner/documents', label: 'Documents', icon: FileText },
          { to: '/terms', label: 'Policies', icon: FileText },
        ];
      case 'DELIVERY_PARTNER':
        return [
          { to: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/delivery/tasks', label: 'Tasks', icon: ClipboardList },
          { to: '/terms', label: 'Policies', icon: FileText },
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/users', label: 'Users', icon: Users },
          { to: '/admin/partners', label: 'Partners', icon: Building2 },
          { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
          { to: '/admin/payments', label: 'Payments', icon: CreditCard },
          { to: '/admin/reports', label: 'Reports', icon: TrendingUp },
          { to: '/terms', label: 'Policies', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const handleLogoClick = () => {
    if (user) {
      if (user.role === 'CUSTOMER') navigate('/customer/dashboard');
      else if (user.role === 'LAUNDRY_PARTNER') navigate('/partner/dashboard');
      else if (user.role === 'DELIVERY_PARTNER') navigate('/delivery/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <>
      {/* DESKTOP FLOATING NAV */}
      <header className="floating-nav-desktop animate-slideIn">
        <div className="nav-container">
          {/* Logo */}
          <div onClick={handleLogoClick} className="nav-logo" style={{ cursor: 'pointer' }}>
            <VeloraMascot size={28} state="happy" />
            <span className="logo-text">Velora</span>
            {user && (
              <span className="nav-role-badge">
                {user.role.replace('_', ' ')}
              </span>
            )}
          </div>


          {/* Navigation Links */}
          <nav className="nav-links">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  {Icon && <Icon size={16} className="nav-icon" />}
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="nav-actions">
            {user ? (
              <>
                <NotificationCenter unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
                
                {/* Profile Dropdown */}
                <div ref={desktopProfileRef} className="profile-dropdown-container">
                  <button onClick={() => setProfileOpen(!profileOpen)} className="profile-trigger">
                    <div className="profile-avatar">
                      <User size={16} />
                    </div>
                    <span className="profile-name">{user.displayName}</span>
                    <ChevronDown size={14} className={`chevron-icon ${profileOpen ? 'open' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="profile-dropdown-menu animate-fadeInUp">
                      <div className="dropdown-header">
                        <span className="dropdown-user-name">{user.displayName}</span>
                        <span className="dropdown-user-email">{user.email}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      <button onClick={handleLogout} className="dropdown-logout-btn">
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <button onClick={() => navigate('/login')} className="velora-btn velora-btn-secondary">
                  Login
                </button>
                <button onClick={() => navigate('/register')} className="velora-btn velora-btn-primary animate-pulse">
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM FLOATING NAV */}
      {user && (
        <nav className="floating-nav-mobile animate-slideIn">
          <div className="mobile-nav-container">
            {links.slice(0, 5).map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                >
                  {Icon && <Icon size={20} />}
                  <span className="mobile-nav-label">{link.label}</span>
                </NavLink>
              );
            })}
            
            {/* More / Profile button for Mobile */}
            <div ref={mobileProfileRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)} 
                className={`mobile-nav-item ${profileOpen ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', width: '100%' }}
              >
                <User size={20} />
                <span className="mobile-nav-label">Profile</span>
              </button>

              {profileOpen && (
                <div className="profile-dropdown-menu mobile-dropdown animate-fadeInUp" style={{ bottom: '70px', top: 'auto', right: '10px' }}>
                  <div className="dropdown-header">
                    <span className="dropdown-user-name">{user.displayName}</span>
                    <span className="dropdown-user-email">{user.email}</span>
                    <span className="dropdown-user-role">{user.role.replace('_', ' ')}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div style={{ padding: '8px 16px' }}>
                    <NotificationCenter unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-logout-btn" style={{ width: '100%', textAlign: 'left' }}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* MOBILE HEADER FOR UNAUTHENTICATED HOMEPAGE */}
      {!user && (
        <header className="mobile-public-header">
          <div className="nav-container">
            <div onClick={handleLogoClick} className="nav-logo" style={{ cursor: 'pointer' }}>
              <VeloraMascot size={24} state="happy" />
              <span className="logo-text" style={{ fontSize: '1.25rem' }}>Velora</span>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="menu-toggle">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mobile-menu-overlay animate-fadeInUp">
              {links.map((link) => (
                <a 
                  key={link.to} 
                  href={link.to} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-menu-link"
                >
                  {link.label}
                </a>
              ))}
              <div className="dropdown-divider" style={{ margin: '1rem 0' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 1rem' }}>
                <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="velora-btn velora-btn-secondary" style={{ width: '100%' }}>
                  Login
                </button>
                <button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} className="velora-btn velora-btn-primary" style={{ width: '100%' }}>
                  Get Started
                </button>
              </div>
            </div>
          )}
        </header>
      )}
    </>
  );
}
