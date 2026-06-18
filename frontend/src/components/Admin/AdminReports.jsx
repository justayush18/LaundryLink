import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { TrendingUp, RefreshCw, Calendar, Award, Star } from 'lucide-react';
import StatCard from '../Common/StatCard';

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
      { name: 'Daily Rolling', val: `₹${revenue.dailyRevenue ? revenue.dailyRevenue.toFixed(0) : '0'}`, icon: Calendar, desc: 'Past 24 hours sales' },
      { name: 'Weekly Rolling', val: `₹${revenue.weeklyRevenue ? revenue.weeklyRevenue.toFixed(0) : '0'}`, icon: Calendar, desc: 'Past 7 days sales' },
      { name: 'Monthly Rolling', val: `₹${revenue.monthlyRevenue ? revenue.monthlyRevenue.toFixed(0) : '0'}`, icon: Calendar, desc: 'Past 30 days sales' },
      { name: 'Total Revenue', val: `₹${revenue.totalRevenue ? revenue.totalRevenue.toFixed(0) : '0'}`, icon: TrendingUp, desc: 'Cumulative total' },
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
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            Revenue & Performance
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Fulfillment statistics, rolling revenue metrics, and laundry partner rankings.
          </p>
        </div>
        <button 
          onClick={fetchReports} 
          className="velora-btn velora-btn-secondary" 
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
          Refresh Reports
        </button>
      </div>

      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      {loading && !revenue ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>Compiling financial ledgers...</p>
      ) : (
        <>
          {/* Revenue KPIs */}
          <div className="grid-cols-4" style={{ marginBottom: '2.5rem', gap: '1.25rem' }}>
            {getKPIs().map((kpi, idx) => (
              <StatCard
                key={idx}
                title={kpi.name}
                value={kpi.val}
                icon={kpi.icon}
                description={kpi.desc}
              />
            ))}
          </div>

          <div style={styles.dashboardRow}>
            {/* Recharts comparison graph */}
            <div className="velora-card animate-fadeInUp" style={{ flex: 1.5, minWidth: '320px', padding: '2rem', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '12px', margin: '0 0 1.5rem 0' }}>
                Merchant Performance Analytics
              </h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} fontWeight={600} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} fontWeight={600} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', borderColor: 'var(--sky-blue-light)', borderRadius: '12px', fontFamily: 'Outfit, sans-serif' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px', fontFamily: 'Outfit, sans-serif' }} />
                    <Bar dataKey="Orders" fill="var(--primary-navy)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Completed" fill="var(--primary-teal)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Revenue" fill="var(--sky-blue)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Merchant Leaderboard list */}
            <div className="velora-card animate-fadeInUp" style={{ flex: 0.9, minWidth: '320px', padding: '2rem', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '12px', margin: '0 0 1.5rem 0' }}>
                Merchant Leaderboard
              </h3>
              <div style={styles.leaderboardList}>
                {partnerStats.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem 0' }}>No partners registered.</p>
                ) : (
                  partnerStats
                    .sort((a, b) => b.totalRevenueGenerated - a.totalRevenueGenerated)
                    .map((partner, idx) => (
                      <div key={idx} className="velora-card" style={styles.leaderCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--primary-navy)' }}>#{idx + 1} {partner.businessName}</strong>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{partner.partnerEmail}</p>
                          </div>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-teal)', fontFamily: 'Outfit, sans-serif' }}>
                            ₹{partner.totalRevenueGenerated}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span>Fulfillments: <strong style={{ color: 'var(--primary-navy)' }}>{partner.completedOrders}/{partner.totalOrders}</strong></span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            Score: <Star size={12} fill="var(--accent-secondary)" color="var(--accent-secondary)" /> 
                            <strong style={{ color: 'var(--primary-navy)' }}>{partner.averageRating ? partner.averageRating.toFixed(1) : '5.0'}</strong>
                          </span>
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
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '16px',
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
    padding: '12px 16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--sky-blue-light)',
    borderRadius: '16px',
    boxShadow: 'none',
  },
};

