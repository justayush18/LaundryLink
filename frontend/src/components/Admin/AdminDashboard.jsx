import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, ShoppingBag, CreditCard, Star, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getDashboard();
      setMetrics(data);
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

  const getMetricsSummary = () => {
    if (!metrics) return [];
    return [
      { name: 'Total Users', val: metrics.totalUsers, icon: Users, bg: 'rgba(99, 102, 241, 0.15)', col: 'var(--accent-primary)' },
      { name: 'Total Orders', val: metrics.totalOrders, icon: ShoppingBag, bg: 'rgba(6, 182, 212, 0.15)', col: 'var(--accent-secondary)' },
      { name: 'Total Revenue', val: `₹${metrics.totalRevenue ? metrics.totalRevenue.toFixed(0) : '0'}`, icon: CreditCard, bg: 'rgba(34, 197, 94, 0.15)', col: 'var(--color-success)' },
      { name: 'Total Reviews', val: metrics.totalReviews, icon: Star, bg: 'rgba(245, 158, 11, 0.15)', col: 'var(--color-warning)' },
    ];
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>System Operations</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Consolidated system analytics, verification tasks, and financial metrics.</p>
        </div>
        <button onClick={fetchSummary} className="btn btn-outline" disabled={loading}>
          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh Stats
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && !metrics ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>Compiling dashboard analytics...</p>
      ) : (
        <>
          {/* KPI Dashboard */}
          <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
            {getMetricsSummary().map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="glass-card" style={styles.kpiCard}>
                  <div style={{ ...styles.kpiIcon, background: item.bg, color: item.col }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 style={styles.kpiVal}>{item.val}</h3>
                    <p style={styles.kpiLabel}>{item.name}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actionable Sub indicators */}
          <div className="grid-cols-2" style={{ marginBottom: '32px' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ ...styles.subIcon, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px' }}>Pending Onboarding Verifications</h4>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {metrics?.totalPendingPartnerVerifications || 0} applications
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ ...styles.subIcon, background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)' }}>
                <CheckCircle size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px' }}>Active Business Partners</h4>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {metrics?.totalActivePartners || 0} active hubs
                </p>
              </div>
            </div>
          </div>

          {/* Recharts Displays */}
          <div style={styles.chartsGrid}>
            <div className="glass-card" style={styles.chartCard}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Stakeholders Distribution
              </h3>
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getRoleChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '6px' }} />
                    <Bar dataKey="count" fill="var(--accent-primary)" radius={[4, 4, 0, 0]}>
                      <Cell fill="var(--accent-primary)" />
                      <Cell fill="var(--accent-secondary)" />
                      <Cell fill="var(--color-success)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={styles.chartCard}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Order Fulfillment Health
              </h3>
              <div style={styles.centerContainer}>
                {/* Visual order state indicators */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <div style={styles.healthRow}>
                    <span>Total Placed:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{metrics?.totalOrders}</span>
                  </div>
                  <div style={styles.healthRow}>
                    <span>Successful Payments:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>{metrics?.totalPayments}</span>
                  </div>
                  <div style={styles.healthRow}>
                    <span>Notification History:</span>
                    <span style={{ fontWeight: 'bold' }}>{metrics?.totalNotifications} alerts</span>
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
    marginBottom: '32px',
  },
  kpiCard: {
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
    padding: '24px',
  },
  centerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '240px',
  },
  healthRow: {
    display: 'flex',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.02)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
  },
};
