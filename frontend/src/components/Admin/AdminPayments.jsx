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
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Success
          </span>
        );
      case 'PENDING':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} style={{ animation: 'spin 2s linear infinite' }} /> Pending
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="badge badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RotateCcw size={12} /> Refunded
          </span>
        );
      case 'FAILED':
        return (
          <span className="badge badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> Failed
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Payment Ledger</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Audit payment statuses, checkout methods, and process transaction refunds.</p>
        </div>
        <button onClick={fetchPayments} className="btn btn-outline" disabled={loading}>
          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh Ledger
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="glass-card">
        <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={20} color="var(--accent-secondary)" />
          System Transactions
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>Loading logs...</p>
        ) : payments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No transactions recorded in the system.</p>
        ) : (
          <div className="table-container">
            <table>
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
                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>#{p.paymentId.substring(0, 8)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>#{p.orderId.substring(0, 8)}</td>
                    <td><strong>₹{p.amount}</strong></td>
                    <td style={{ fontSize: '13px' }}>{p.paymentMethod}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {p.transactionId || 'N/A'}
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td>
                      {p.status === 'SUCCESS' && (
                        <button
                          onClick={() => handleRefund(p.paymentId, p.amount)}
                          className="btn btn-danger"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            color: 'var(--color-error)',
                            border: '1px solid',
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
    marginBottom: '24px',
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
