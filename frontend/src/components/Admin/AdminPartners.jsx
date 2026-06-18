import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Eye, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getPartners();
      setPartners(data || []);
      if (selectedPartner) {
        // Refresh selected partner
        const updated = data.find(p => p.email === selectedPartner.email);
        if (updated) handleInspectPartner(updated.email);
      }
    } catch (err) {
      setError('Failed to fetch laundry partners registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleInspectPartner = async (email) => {
    setDetailedLoading(true);
    setError('');
    try {
      const detailed = await api.admin.getPartner(email);
      setSelectedPartner(detailed);
    } catch (err) {
      setError('Failed to fetch partner details');
    } finally {
      setDetailedLoading(false);
    }
  };

  const handleUpdateStatus = async (email, status) => {
    setError('');
    setSuccess('');
    try {
      await api.admin.updatePartnerStatus(email, status);
      setSuccess(`Partner status updated to ${status}!`);
      setTimeout(() => setSuccess(''), 4000);
      fetchPartners();
    } catch (err) {
      setError(err.message || 'Status change failed');
    }
  };

  const handleVerifyDoc = async (email, docId, status) => {
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    setVerifyLoading(true);
    setError('');
    setSuccess('');
    try {
      const verifyReq = { status, rejectionReason: status === 'REJECTED' ? rejectionReason : null };
      await api.admin.verifyDocument(email, docId, verifyReq);
      setSuccess(`Document ${status} successfully!`);
      setRejectionReason('');
      setTimeout(() => setSuccess(''), 4000);
      fetchPartners();
    } catch (err) {
      setError(err.message || 'Document verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge">PENDING</span>;
    switch (status.toUpperCase()) {
      case 'ACTIVE': return <span className="badge badge-success">Active</span>;
      case 'INACTIVE': return <span className="badge badge-error">Inactive</span>;
      case 'PENDING': return <span className="badge badge-warning">Pending</span>;
      case 'PENDING_VERIFICATION': return <span className="badge badge-warning">On Review</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Laundry Partners</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review merchant business documents, toggle onboarding states, and audit hub scores.</p>
        </div>
        <button onClick={fetchPartners} className="btn btn-outline" disabled={loading}>
          <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh Partners
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={styles.grid}>
        {/* Partners Table */}
        <div className="glass-card" style={{ flex: 1.2, minWidth: '320px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Registered Merchants</h3>

          {loading && partners.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading merchants...</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Status</th>
                    <th>Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => (
                    <tr key={p.email}>
                      <td>
                        <strong>{p.businessName}</strong>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.email}</p>
                      </td>
                      <td>{getStatusBadge(p.onboardingStatus)}</td>
                      <td>
                        <button
                          onClick={() => handleInspectPartner(p.email)}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Documents Verification Panel */}
        <div className="glass-card" style={{ flex: 1.8, minWidth: '320px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Merchant Compliance Auditing</h3>

          {detailedLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Compiling registry profiles...</p>
          ) : selectedPartner ? (
            <div style={styles.detailContainer}>
              <div style={styles.detailHeader}>
                <div>
                  <h4 style={{ fontSize: '18px' }}>{selectedPartner.businessName}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hub: {selectedPartner.serviceHubAddress}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hub State:</label>
                  <select
                    className="form-control"
                    value={selectedPartner.onboardingStatus}
                    onChange={(e) => handleUpdateStatus(selectedPartner.email, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>

              <div style={{ margin: '16px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <p><strong>Business Description:</strong> {selectedPartner.description}</p>
                <p style={{ marginTop: '4px' }}>
                  <strong>Reputation:</strong> ⭐ {selectedPartner.reputationScore ? selectedPartner.reputationScore.toFixed(1) : '5.0'} • {selectedPartner.totalReviews || 0} reviews
                </p>
              </div>

              <div style={styles.divider}></div>

              {/* Uploaded Documents List for Audit */}
              <div>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)' }}>Compliance Certificates Uploads</h4>
                {selectedPartner.documents?.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No compliance certificates uploaded yet.</p>
                ) : (
                  <div style={styles.docList}>
                    {selectedPartner.documents?.map((doc, idx) => (
                      <div key={idx} className="glass-panel" style={styles.docCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div>
                            <strong style={{ fontSize: '13px' }}>{doc.documentType}</strong>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>File: {doc.fileName}</p>
                          </div>
                          {doc.verificationStatus === 'VERIFIED' ? (
                            <span className="badge badge-success">Verified</span>
                          ) : doc.verificationStatus === 'REJECTED' ? (
                            <span className="badge badge-error">Rejected</span>
                          ) : (
                            <span className="badge badge-warning">Awaiting Audit</span>
                          )}
                        </div>

                        {/* Audit Controls for pending verification docs */}
                        {doc.verificationStatus === 'PENDING_VERIFICATION' && (
                          <div style={styles.auditControls}>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Reason for rejection (if rejecting)"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleVerifyDoc(selectedPartner.email, doc.documentId, 'VERIFIED')}
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '11px' }}
                                disabled={verifyLoading}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyDoc(selectedPartner.email, doc.documentId, 'REJECTED')}
                                className="btn btn-danger"
                                style={{ padding: '6px 12px', fontSize: '11px' }}
                                disabled={verifyLoading}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <AlertTriangle size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Select a merchant and click "View" to check their compliance profile, inspect documents, and verify uploads.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  detailContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
  },
  divider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '16px 0',
  },
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  docCard: {
    padding: '12px',
    background: 'rgba(15, 23, 42, 0.4)',
  },
  auditControls: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
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
