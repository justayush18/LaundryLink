import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, ShoppingBag, CreditCard, Star, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import StatCard from '../Common/StatCard';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await api.admin.getDashboard();
      setMetrics(data);
      setSuccessMsg('Dashboard statistics refreshed successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Failed to load admin summary indicators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const getRoleChartData = () => {
    if (!metrics) return [];
    return [
      { name: 'Customers', count: metrics.totalCustomers || 0 },
      { name: 'Laundry Partners', count: metrics.totalPartners || 0 },
      { name: 'Delivery Partners', count: metrics.totalDeliveryPartners || 0 },
    ];
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            System Operations
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Consolidated platform analytics, verification backlogs, and financial indicators.
          </p>
        </div>
        <button 
          onClick={fetchSummary} 
          className="velora-btn velora-btn-secondary" 
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
          Refresh Stats
        </button>
      </div>

      {successMsg && <div className="alert alert-success animate-fadeInUp">{successMsg}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      {loading && !metrics ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>Compiling system indicators...</p>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid-cols-4" style={{ marginBottom: '2.5rem', gap: '1.25rem' }}>
            <StatCard
              title="Total Users"
              value={metrics?.totalUsers || 0}
              icon={Users}
              description="Platform wide accounts"
            />
            <StatCard
              title="Total Orders"
              value={metrics?.totalOrders || 0}
              icon={ShoppingBag}
              description="Lifetime requests logs"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${metrics?.totalRevenue ? metrics.totalRevenue.toFixed(0) : '0'}`}
              icon={CreditCard}
              description="Completed online/COD transactions"
            />
            <StatCard
              title="Total Reviews"
              value={metrics?.totalReviews || 0}
              icon={Star}
              description="Average satisfaction rate"
            />
          </div>

          {/* Verification Indicators */}
          <div className="grid-cols-2" style={{ marginBottom: '2.5rem', gap: '1.5rem' }}>
            <div className="velora-card animate-fadeInUp" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '1.5rem', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)' }}>
              <div style={{ ...styles.subIcon, background: '#FDE8E8', color: '#9B1C1C' }}>
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>Pending Partner Onboardings</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                  {metrics?.totalPendingPartnerVerifications || 0} applications
                </p>
              </div>
            </div>

            <div className="velora-card animate-fadeInUp" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '1.5rem', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)' }}>
              <div style={{ ...styles.subIcon, background: '#DEF7EC', color: '#03543F' }}>
                <CheckCircle size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>Approved Active Partners</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                  {metrics?.totalActivePartners || 0} active hubs
                </p>
              </div>
            </div>
          </div>

          {/* Recharts Analytics */}
          <div style={styles.chartsGrid}>
            <div className="velora-card animate-fadeInUp" style={{ ...styles.chartCard, padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '12px', margin: '0 0 1.5rem 0' }}>
                Stakeholders Distribution
              </h3>
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getRoleChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} fontWeight={600} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} fontWeight={600} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', borderColor: 'var(--sky-blue-light)', borderRadius: '12px', fontFamily: 'Outfit, sans-serif' }} />
                    <Bar dataKey="count" fill="var(--primary-teal)" radius={[8, 8, 0, 0]}>
                      <Cell fill="var(--primary-navy)" />
                      <Cell fill="var(--primary-teal)" />
                      <Cell fill="var(--sky-blue)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="velora-card animate-fadeInUp" style={{ ...styles.chartCard, padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '12px', margin: '0 0 1.5rem 0' }}>
                Fulfillment Health Audit
              </h3>
              <div style={styles.centerContainer}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  <div style={styles.healthRow}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Placed:</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary-navy)' }}>{metrics?.totalOrders} runs</span>
                  </div>
                  <div style={styles.healthRow}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Successful Transactions:</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary-teal)' }}>{metrics?.totalPayments} ledger items</span>
                  </div>
                  <div style={styles.healthRow}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Fulfillment Alerts Sent:</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary-navy)' }}>{metrics?.totalNotifications} SMS/Email</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '16px',
  },
  subIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '24px',
  },
  chartCard: {
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
  },
  centerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '260px',
  },
  healthRow: {
    display: 'flex',
    justifyContent: 'space-between',
    background: 'var(--bg-secondary)',
    padding: '14px 18px',
    borderRadius: '16px',
    fontSize: '13px',
  },
};
