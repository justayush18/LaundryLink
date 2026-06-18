import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { FileText, Upload, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';
import VeloraMascot from '../Common/VeloraMascot';

export default function PartnerDocuments() {
  const [documents, setDocuments] = useState([]);
  const [documentType, setDocumentType] = useState('GSTIN');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.partners.getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.warn('Failed to load documents, using fallback seeded state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;

    // Validate type: PDF, JPG, PNG
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const hasAllowedExtension = file.name.endsWith('.pdf') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png');
    if (!allowedTypes.includes(file.type) && !hasAllowedExtension) {
      setError('Only PDF, JPG, and PNG files are allowed.');
      setSelectedFile(null);
      return;
    }

    // Validate size: Under 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    // Simulate file upload progress
    const duration = 1500;
    const intervalTime = 150;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(async () => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          (async () => {
            try {
              await api.partners.uploadDocument({ documentType, fileName: selectedFile.name });
              setSuccess(`Document "${selectedFile.name}" uploaded successfully! Waiting for Admin verification.`);
              setSelectedFile(null);
              setUploadProgress(0);
              if (fileInputRef.current) fileInputRef.current.value = '';
              setTimeout(() => setSuccess(''), 4000);
              fetchDocuments();
            } catch (err) {
              setError(err.message || 'Failed to upload document');
              setUploadProgress(0);
            } finally {
              setSubmitting(false);
            }
          })();
          return 100;
        }
        return Math.min(prev + step, 100);
      });
    }, intervalTime);
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge badge-warning">PENDING</span>;
    switch (status.toUpperCase()) {
      case 'VERIFIED':
      case 'APPROVED':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={10} /> Verified
          </span>
        );
      case 'PENDING_VERIFICATION':
      case 'PENDING':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={10} /> Under Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="badge badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={10} /> Rejected
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getDocTypeLabel = (type) => {
    switch (type) {
      case 'GSTIN': return 'GSTIN Tax Certificate';
      case 'BUSINESS_LICENSE': return 'Business License';
      case 'IDENTITY_PROOF': return 'Identity Proof (PAN/Aadhaar)';
      default: return type;
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
          Onboarding Documents
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
          Upload verification documents and audit credentials to activate your partner service.
        </p>
      </div>

      {success && <div className="alert alert-success animate-fadeInUp">{success}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      <div style={styles.container}>
        {/* Upload Form */}
        <div className="velora-card animate-fadeInUp" style={{ flex: 1, minWidth: '300px', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
            Upload Verification Document
          </h3>
          
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--primary-navy)', fontWeight: 600 }}>Document Type</label>
              <select
                className="form-control"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                style={{ background: '#FFFFFF', borderRadius: '14px', border: '2px solid var(--sky-blue)', padding: '8px 12px', cursor: 'pointer' }}
                disabled={submitting}
              >
                <option value="GSTIN">GSTIN Tax Certificate</option>
                <option value="BUSINESS_LICENSE">Business Registration License</option>
                <option value="IDENTITY_PROOF">Owner Identity Proof (Aadhaar/PAN)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ color: 'var(--primary-navy)', fontWeight: 600 }}>Select File</label>
              
              {/* Drag-and-drop style zone */}
              <div 
                onClick={() => !submitting && fileInputRef.current.click()}
                style={{
                  border: '2px dashed var(--sky-blue)',
                  borderRadius: '20px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: 'var(--bg-secondary)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Upload size={24} color="var(--primary-teal)" />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
                  Click to browse files (PDF, PNG, JPG under 5MB)
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={submitting}
                accept=".pdf,.png,.jpg,.jpeg"
              />

              {/* Selected File Card */}
              {selectedFile && (
                <div style={styles.selectedFileCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="var(--primary-teal)" />
                    <span style={{ fontSize: '12px', color: 'var(--primary-navy)', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                      {selectedFile.name}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button type="button" onClick={handleClearFile} style={styles.clearFileBtn} disabled={submitting}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {submitting && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  <span>Uploading file...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--sky-blue-light)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary-teal)', transition: 'width 0.15s ease-out' }}></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="velora-btn velora-btn-primary animate-pulse"
              disabled={submitting || !selectedFile}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '14px' }}
            >
              <Upload size={16} />
              {submitting ? 'Uploading...' : 'Submit File for Review'}
            </button>
          </form>
        </div>

        {/* Uploaded Documents List */}
        <div className="velora-card animate-fadeInUp" style={{ flex: 1.5, minWidth: '320px', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
            Submitted Files Log
          </h3>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading submissions...</p>
          ) : documents.length === 0 ? (
            <EmptyState
              title="No files submitted"
              description="Upload your registration certificate or business license to start verifying your account."
              mascotState="thinking"
            />
          ) : (
            <div style={styles.docList}>
              {documents.map((doc, idx) => (
                <div key={idx} style={styles.docItem}>
                  <div style={styles.docHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={20} color="var(--primary-teal)" />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 2px 0' }}>
                          {getDocTypeLabel(doc.documentType)}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{doc.fileName}</span>
                      </div>
                    </div>
                    {getStatusBadge(doc.verificationStatus)}
                  </div>
                  {doc.rejectionReason && (
                    <div style={styles.rejectionCard}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#9B1C1C', textTransform: 'uppercase' }}>Rejection Reason:</span>
                      <p style={{ fontSize: '12px', color: '#9B1C1C', marginTop: '2px', marginBottom: 0, fontWeight: 500 }}>{doc.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))}
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
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  docItem: {
    padding: '16px 18px',
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
  },
  docHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedFileCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    border: '2px solid var(--sky-blue-light)',
    padding: '8px 12px',
    borderRadius: '16px',
    marginTop: '10px',
  },
  clearFileBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectionCard: {
    background: '#FDE8E8',
    border: '1px solid #F8B4B4',
    borderRadius: '12px',
    padding: '8px 12px',
    marginTop: '12px',
  },
};
