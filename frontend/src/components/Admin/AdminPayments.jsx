import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CreditCard, RefreshCw, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getPayments();
      setPayments(data || []);
    } catch (err) {
      setError('Failed to fetch transactions logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefund = async (paymentId, amount) => {
    if (!window.confirm(`Are you sure you want to refund ₹${amount} for this transaction?`)) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.admin.refundPayment(paymentId);
      setSuccess(`Transaction ₹${amount} refunded successfully!`);
      setTimeout(() => setSuccess(''), 4000);
      fetchPayments();
    } catch (err) {
      setError(err.message || 'Refund process failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="velora-badge velora-badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Success
          </span>
        );
      case 'PENDING':
        return (
          <span className="velora-badge velora-badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} style={{ animation: 'spin 2s linear infinite' }} /> Pending
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="velora-badge velora-badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RotateCcw size={12} /> Refunded
          </span>
        );
      case 'FAILED':
        return (
          <span className="velora-badge velora-badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> Failed
          </span>
        );
      default:
        return <span className="velora-badge">{status}</span>;
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            Payment Ledger
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Audit payment statuses, checkout methods, and process transaction refunds.
          </p>
        </div>
        <button 
          onClick={fetchPayments} 
          className="velora-btn velora-btn-secondary" 
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
          Refresh Ledger
        </button>
      </div>

      {success && <div className="alert alert-success animate-fadeInUp">{success}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      <div className="velora-card animate-fadeInUp" style={{ padding: '2rem', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '12px', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={20} color="var(--primary-teal)" />
          System Transactions
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>Loading logs...</p>
        ) : payments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>No transactions recorded in the system.</p>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="velora-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Txn ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.paymentId}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary-navy)', fontWeight: 600 }}>
                      #{p.paymentId.substring(0, 7).toUpperCase()}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      #{p.orderId.substring(0, 7).toUpperCase()}
                    </td>
                    <td><strong style={{ color: 'var(--primary-navy)' }}>₹{p.amount}</strong></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.paymentMethod}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {p.transactionId || 'N/A'}
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td>
                      {p.status === 'SUCCESS' && (
                        <button
                          onClick={() => handleRefund(p.paymentId, p.amount)}
                          className="velora-btn velora-btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: 'auto',
                            borderColor: '#EF4444',
                            color: '#EF4444',
                            background: '#FEF2F2',
                          }}
                          disabled={submitting}
                        >
                          <RotateCcw size={10} /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
};

// Add programmatic styles for spinner
const styleSheet = document.styleSheets[0];
try {
  styleSheet.insertRule(`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `, styleSheet.cssRules.length);
} catch (e) {}

