import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CreditCard, FileText, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';

export default function CustomerPayments() {
  const [orders, setOrders] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const data = await api.orders.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      setError('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const handlePayNow = async (orderId, totalCost) => {
    try {
      setError('');
      const initReq = { orderId, paymentMethod: 'RAZORPAY' };
      const payment = await api.payments.initiate(initReq);
      
      const processReq = { transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(), simulateSuccess: true };
      await api.payments.process(payment.paymentId, processReq);
      
      setSuccessMsg(`Payment of ₹${totalCost} successful!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchPaymentData();
      setSelectedInvoice(null);
    } catch (err) {
      setError(err.message || 'Payment failed');
    }
  };

  const handleViewInvoice = async (orderId) => {
    setInvoiceLoading(true);
    setError('');
    try {
      const invoice = await api.payments.getInvoice(orderId);
      setSelectedInvoice(invoice);
    } catch (err) {
      setError('Invoice not generated yet. Finish order checkout payment first.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Payments & Invoices</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Inspect billing invoices and pay for your pending laundry orders.</p>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={styles.container}>
        {/* Payments Table */}
        <div className="glass-card" style={{ flex: 1.3, minWidth: '320px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Billing Ledger</h3>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading ledger...</p>
          ) : orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions recorded.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Cost</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.orderId}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>#{o.orderId.substring(0, 8)}</td>
                      <td>₹{o.totalCost}</td>
                      <td>
                        {o.paymentId ? (
                          <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <CheckCircle2 size={14} /> Success
                          </span>
                        ) : o.status === 'CANCELLED' ? (
                          <span style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <XCircle size={14} /> Cancelled
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <Clock size={14} /> Unpaid
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!o.paymentId && o.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handlePayNow(o.orderId, o.totalCost)}
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              Pay
                            </button>
                          )}
                          {o.paymentId && (
                            <button
                              onClick={() => handleViewInvoice(o.orderId)}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileText size={12} /> Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice Viewer Panel */}
        <div className="glass-card" style={{ flex: 0.9, minWidth: '320px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Invoice Receipt</h3>

          {invoiceLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Fetching invoice details...</p>
          ) : selectedInvoice ? (
            <div style={styles.invoiceCard} className="glass-panel">
              <div style={styles.invoiceHead}>
                <span style={styles.invoiceBrand}>Velora Receipt</span>
                <span className={`badge ${selectedInvoice.invoiceStatus === 'CANCELLED' ? 'badge-error' : 'badge-success'}`}>
                  {selectedInvoice.invoiceStatus}
                </span>
              </div>

              <div style={styles.invoiceMetadata}>
                <p><strong>Invoice ID:</strong> {selectedInvoice.id}</p>
                <p><strong>Order ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedInvoice.orderId}</span></p>
                <p><strong>Payment ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedInvoice.paymentId}</span></p>
                <p><strong>Billing Date:</strong> {new Date(selectedInvoice.generatedAt * 1000).toLocaleString()}</p>
              </div>

              <div style={styles.invoiceDivider}></div>

              <div style={styles.invoiceItems}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>ITEMS CHECKLIST</p>
                {selectedInvoice.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>{item.quantity}x {item.itemCategory}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.serviceType.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>

              <div style={styles.invoiceDivider}></div>

              <div style={styles.invoiceTotal}>
                <span>Amount Paid</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
                  ₹{selectedInvoice.amount}
                </span>
              </div>

              <p style={styles.thankyou}>Thank you for choosing Velora!</p>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <CreditCard size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Click "Invoice" next to any paid transaction to inspect details or generate billing receipts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  invoiceCard: {
    padding: '24px',
    background: 'rgba(15, 23, 42, 0.6)',
  },
  invoiceHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  invoiceBrand: {
    fontFamily: 'var(--font-display)',
    fontWeight: '800',
    fontSize: '18px',
    color: 'var(--text-primary)',
  },
  invoiceMetadata: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  invoiceDivider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '16px 0',
  },
  invoiceItems: {
    margin: '12px 0',
  },
  invoiceTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold',
  },
  thankyou: {
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '24px',
    fontStyle: 'italic',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    textAlign: 'center',
  },
};
