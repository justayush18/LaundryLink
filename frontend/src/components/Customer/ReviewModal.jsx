import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, Star } from 'lucide-react';
import VeloraMascot from '../Common/VeloraMascot';

export default function ReviewModal({ isOpen, onClose, orderId, partnerEmail, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        orderId,
        rating: parseInt(rating, 10),
        comment,
      };
      const data = await api.reviews.submit(payload);
      if (onReviewSubmitted) {
        onReviewSubmitted(data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div className="velora-card animate-fadeInUp" style={styles.modal}>
        <div style={styles.header}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
            Submit Service Review
          </h3>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error animate-pulse" style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <VeloraMascot state="happy" size={90} style={{ marginBottom: '0.75rem' }} />
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', width: '100%' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '13px', fontWeight: 600 }}>
              How was your experience with <strong>{partnerEmail}</strong>?
            </p>
            
            <div style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  style={{
                    ...styles.starBtn,
                    transform: (hoveredRating || rating) >= star ? 'scale(1.15)' : 'scale(1)'
                  }}
                >
                  <Star
                    size={32}
                    fill={star <= (hoveredRating || rating) ? '#FBBF24' : 'none'}
                    color={star <= (hoveredRating || rating) ? '#FBBF24' : 'var(--sky-blue)'}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Rating: {rating} out of 5 stars
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: '20px', width: '100%' }}>
            <label className="form-label" style={{ color: 'var(--primary-navy)', fontWeight: 600 }}>Review Comments</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Tell us what you liked or how we can improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              disabled={loading}
              style={{
                resize: 'none',
                borderRadius: '16px',
                border: '2px solid var(--sky-blue)',
                background: 'var(--bg-secondary)',
                padding: '10px 14px',
                fontSize: '14px',
                color: 'var(--primary-navy)'
              }}
            />
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} className="velora-btn velora-btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="velora-btn velora-btn-primary animate-pulse" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(47, 65, 86, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    padding: '2rem',
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
    borderRadius: '28px',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid var(--bg-secondary)',
    paddingBottom: '12px',
    marginBottom: '16px',
    width: '100%',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px',
  },
  starsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    transition: 'all 0.15s ease',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    width: '100%',
    borderTop: '2px solid var(--bg-secondary)',
    paddingTop: '16px',
    marginTop: '4px',
  },
};
