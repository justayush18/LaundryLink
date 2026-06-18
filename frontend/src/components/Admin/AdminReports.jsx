import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, RefreshCw, Calendar, Award } from 'lucide-react';

export default function AdminReports() {
  const [revenue, setRevenue] = useState(null);
  const [partnerStats, setPartnerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const revData = await api.admin.getRevenueReport();
      setRevenue(revData);

      const stats = await api.admin.getPartnerAnalytics();
      setPartnerStats(stats || []);
    } catch (err) {
      setError('Failed to fetch rolling revenue indicators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getKPIs = () => {
    if (!revenue) return [];
    return [
      { name: 'Daily Rolling', val: `₹${revenue.dailyRevenue ? revenue.dailyRevenue.toFixed(0) : '0'}`, icon: Calendar },
      { name: 'Weekly Rolling', val: `₹${revenue.weeklyRevenue ? revenue.weeklyRevenue.toFixed(0) : '0'}`, icon: Calendar },
      { name: 'Monthly Rolling', val: `₹${revenue.monthlyRevenue ? revenue.monthlyRevenue.toFixed(0) : '0'}`, icon: Calendar },
      { name: 'Total Revenue', val: `₹${revenue.totalRevenue ? revenue.totalRevenue.toFixed(0) : '0'}`, icon: TrendingUp },
    ];
  };

  const getChartData = () => {
    return partnerStats.map((p) => ({
      name: p.businessName,
      Orders: p.totalOrders,
      Completed: p.completedOrders,
      Revenue: p.totalRevenueGenerated,
    }));
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Revenue & Performance Reports</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Fulfillment statistics, rolling revenue metrics, and laundry partner rankings.</p>
        </div>
        <button onClick={fetchReports} className="btn btn-outline" disabled={loading}>
          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh Reports
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && !revenue ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>Compiling financial ledgers...</p>
      ) : (
        <>
          {/* Revenue KPIs */}
          <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
            {getKPIs().map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="glass-card" style={styles.kpiCard}>
                  <div style={styles.kpiIcon}>
                    <Icon size={20} color="var(--accent-secondary)" />
                  </div>
                  <div>
                    <h3 style={styles.kpiVal}>{kpi.val}</h3>
                    <p style={styles.kpiLabel}>{kpi.name}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.dashboardRow}>
            {/* Recharts comparison graph */}
            <div className="glass-card" style={{ flex: 1.5, minWidth: '320px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Merchant Performance Analytics
              </h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '6px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                    <Bar dataKey="Orders" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Completed" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Revenue" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Merchant Leaderboard list */}
            <div className="glass-card" style={{ flex: 0.9, minWidth: '320px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Merchant Leaderboard
              </h3>
              <div style={styles.leaderboardList}>
                {partnerStats.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No partners registered.</p>
                ) : (
                  partnerStats
                    .sort((a, b) => b.totalRevenueGenerated - a.totalRevenueGenerated)
                    .map((partner, idx) => (
                      <div key={idx} className="glass-panel" style={styles.leaderCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '14px' }}>#{idx + 1} {partner.businessName}</strong>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{partner.partnerEmail}</p>
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-success)' }}>
                            ₹{partner.totalRevenueGenerated}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span>Fulfillments: {partner.completedOrders}/{partner.totalOrders}</span>
                          <span>Score: ⭐ {partner.averageRating ? partner.averageRating.toFixed(1) : '5.0'}</span>
                        </div>
                      </div>
                    ))
                )}
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
    background: 'rgba(99, 102, 241, 0.1)',
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
  dashboardRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  leaderCard: {
    padding: '12px',
  },
};
