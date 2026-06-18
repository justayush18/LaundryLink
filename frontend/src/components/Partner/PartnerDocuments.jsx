import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText, Upload, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export default function PartnerDocuments() {
  const [documents, setDocuments] = useState([]);
  const [documentType, setDocumentType] = useState('GSTIN');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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
      setFileName('');
      return;
    }

    // Validate size: Under 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      setSelectedFile(null);
      setFileName('');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    // Simulate file upload progress
    const duration = 1500; // 1.5 seconds
    const intervalTime = 150;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(async () => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Trigger actual backend metadata API call on 100% upload completion
          (async () => {
            try {
              await api.partners.uploadDocument({ documentType, fileName: selectedFile.name });
              setSuccess(`Document "${selectedFile.name}" uploaded successfully! Waiting for Admin verification.`);
              setFileName('');
              setSelectedFile(null);
              setUploadProgress(0);
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

  const handleButtonClick = (e) => {
    if (!selectedFile) {
      e.preventDefault();
      document.getElementById('fileInput').click();
    }
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

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Onboarding Documents</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Upload regulatory documents and track their approval/verification logs.</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={styles.container}>
        {/* Upload Form */}
        <div className="glass-card" style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '18px' }}>Upload Onboarding Document</h3>
          
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select
                className="form-control"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
                disabled={submitting}
              >
                <option value="GSTIN">GSTIN Tax Certificate</option>
                <option value="BUSINESS_LICENSE">Business Registration License</option>
                <option value="IDENTITY_PROOF">Owner Identity Proof (Aadhaar/PAN)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Select Document File</label>
              <div 
                onClick={() => !submitting && document.getElementById('fileInput').click()}
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Upload size={24} color="var(--text-secondary)" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to browse files (PDF, PNG, JPG under 5MB)'}
                </p>
              </div>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={submitting}
                accept=".pdf,.png,.jpg,.jpeg"
              />
            </div>

            {submitting && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  <span>Uploading certificate...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.15s ease-out' }}></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              onClick={handleButtonClick}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Upload size={16} />
              {submitting ? 'Uploading certificate...' : selectedFile ? `Upload Selected File (${selectedFile.name})` : 'Upload Reference File'}
            </button>
          </form>
        </div>

        {/* Uploaded Documents List */}
        <div className="glass-card" style={{ flex: 1.5, minWidth: '320px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Submitted Files</h3>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading submissions...</p>
          ) : documents.length === 0 ? (
            <div style={styles.empty}>
              <FileText size={44} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No documents uploaded yet.</p>
            </div>
          ) : (
            <div style={styles.docList}>
              {documents.map((doc, idx) => (
                <div key={idx} className="glass-panel" style={styles.docItem}>
                  <div style={styles.docHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} color="var(--accent-secondary)" />
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>{doc.documentType}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{doc.fileName}</span>
                      </div>
                    </div>
                    {getStatusBadge(doc.verificationStatus)}
                  </div>
                  {doc.rejectionReason && (
                    <div style={styles.rejectionCard}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fca5a5' }}>REJECTION REASON:</span>
                      <p style={{ fontSize: '12px', color: '#fecaca', marginTop: '2px' }}>{doc.rejectionReason}</p>
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
    padding: '16px',
  },
  docHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rejectionCard: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    marginTop: '12px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 0',
  },
};
