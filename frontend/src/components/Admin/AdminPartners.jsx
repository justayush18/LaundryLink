import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Eye, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Star } from 'lucide-react';

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
    if (!status) return <span className="velora-badge">PENDING</span>;
    switch (status.toUpperCase()) {
      case 'ACTIVE': return <span className="velora-badge velora-badge-success">Active</span>;
      case 'INACTIVE': return <span className="velora-badge velora-badge-error">Inactive</span>;
      case 'PENDING': return <span className="velora-badge velora-badge-warning">Pending</span>;
      case 'PENDING_VERIFICATION': return <span className="velora-badge velora-badge-warning">On Review</span>;
      default: return <span className="velora-badge">{status}</span>;
    }
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
            Laundry Partners
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Review merchant business documents, toggle onboarding states, and audit hub scores.
          </p>
        </div>
        <button 
          onClick={fetchPartners} 
          className="velora-btn velora-btn-secondary" 
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 
          Refresh Partners
        </button>
      </div>

      {success && <div className="alert alert-success animate-fadeInUp">{success}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      <div style={styles.grid}>
        {/* Partners Table */}
        <div className="velora-card animate-fadeInUp" style={{ flex: 1.2, minWidth: '320px', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '12px', margin: '0 0 1rem 0' }}>
            Registered Merchants
          </h3>

          {loading && partners.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>Loading merchants...</p>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="velora-table">
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
                        <strong style={{ color: 'var(--primary-navy)', fontSize: '0.95rem' }}>{p.businessName}</strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{p.email}</p>
                      </td>
                      <td>{getStatusBadge(p.onboardingStatus)}</td>
                      <td>
                        <button
                          onClick={() => handleInspectPartner(p.email)}
                          className="velora-btn velora-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', height: 'auto' }}
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
        <div className="velora-card animate-fadeInUp" style={{ flex: 1.8, minWidth: '320px', background: '#FFFFFF', border: '1px solid var(--sky-blue-light)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '12px', margin: '0 0 1rem 0' }}>
            Merchant Compliance Auditing
          </h3>

          {detailedLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>Compiling registry profiles...</p>
          ) : selectedPartner ? (
            <div style={styles.detailContainer}>
              <div style={styles.detailHeader}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>
                    {selectedPartner.businessName}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Hub: {selectedPartner.serviceHubAddress}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Hub State:</label>
                  <select
                    className="velora-input"
                    value={selectedPartner.onboardingStatus}
                    onChange={(e) => handleUpdateStatus(selectedPartner.email, e.target.value)}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '0.85rem', 
                      background: '#FFFFFF', 
                      border: '1px solid var(--sky-blue-light)', 
                      cursor: 'pointer',
                      borderRadius: '12px',
                      height: 'auto',
                      width: 'auto'
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>

              <div style={{ margin: '1.25rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: '0 0 6px 0' }}><strong style={{ color: 'var(--primary-navy)' }}>Business Description:</strong> {selectedPartner.description}</p>
                <p style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <strong style={{ color: 'var(--primary-navy)' }}>Reputation:</strong> 
                  <Star size={14} fill="var(--accent-secondary)" color="var(--accent-secondary)" style={{ transform: 'translateY(-1px)' }} /> 
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-navy)' }}>
                    {selectedPartner.reputationScore ? selectedPartner.reputationScore.toFixed(1) : '5.0'}
                  </span> 
                  • {selectedPartner.totalReviews || 0} reviews
                </p>
              </div>

              <div style={styles.divider}></div>

              {/* Uploaded Documents List for Audit */}
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--primary-navy)', fontWeight: 700 }}>
                  Compliance Certificates Uploads
                </h4>
                {selectedPartner.documents?.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No compliance certificates uploaded yet.</p>
                ) : (
                  <div style={styles.docList}>
                    {selectedPartner.documents?.map((doc, idx) => (
                      <div key={idx} className="velora-card" style={styles.docCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--primary-navy)' }}>{doc.documentType}</strong>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>File: {doc.fileName}</p>
                          </div>
                          {doc.verificationStatus === 'VERIFIED' ? (
                            <span className="velora-badge velora-badge-success">Verified</span>
                          ) : doc.verificationStatus === 'REJECTED' ? (
                            <span className="velora-badge velora-badge-error">Rejected</span>
                          ) : (
                            <span className="velora-badge velora-badge-warning">Awaiting Audit</span>
                          )}
                        </div>

                        {/* Audit Controls for pending verification docs */}
                        {doc.verificationStatus === 'PENDING_VERIFICATION' && (
                          <div style={styles.auditControls}>
                            <input
                              type="text"
                              className="velora-input"
                              placeholder="Reason for rejection (if rejecting)"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', height: '38px' }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleVerifyDoc(selectedPartner.email, doc.documentId, 'VERIFIED')}
                                className="velora-btn velora-btn-primary"
                                style={{ padding: '0 16px', fontSize: '0.8rem', height: '38px' }}
                                disabled={verifyLoading}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyDoc(selectedPartner.email, doc.documentId, 'REJECTED')}
                                className="velora-btn velora-btn-secondary"
                                style={{ padding: '0 16px', fontSize: '0.8rem', height: '38px', borderColor: '#EF4444', color: '#EF4444', background: '#FEF2F2' }}
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
              <div style={{ background: 'var(--bg-secondary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center', margin: '0 auto 16px auto', color: 'var(--text-secondary)' }}>
                <AlertTriangle size={32} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '320px', margin: '0 auto', lineHeight: 1.5 }}>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    flexWrap: 'wrap',
    gap: '16px',
  },
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
    borderBottom: '1px solid var(--sky-blue-light)',
    paddingBottom: '12px',
  },
  divider: {
    height: '1px',
    background: 'var(--sky-blue-light)',
    margin: '16px 0',
  },
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  docCard: {
    padding: '16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--sky-blue-light)',
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
