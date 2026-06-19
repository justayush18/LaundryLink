import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Star, Calendar } from 'lucide-react';
import EmptyState from '../Common/EmptyState';

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.reviews.getHistory();
      setReviews(data || []);
    } catch (err) {
      setError('Failed to fetch reviews history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={16}
            fill={s <= rating ? '#FBBF24' : 'none'}
            color={s <= rating ? '#FBBF24' : 'var(--sky-blue)'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
          My Reviews
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
          Review your feedback history shared with our local service providers.
        </p>
      </div>

      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      <div className="velora-card animate-fadeInUp" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>
          Feedback History
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="You haven't submitted any reviews for your cleanings yet. Your voice helps us keep quality high!"
            mascotState="thinking"
          />
        ) : (
          <div style={styles.list}>
            {reviews.map((r) => (
              <div key={r.id} style={styles.reviewItem}>
                <div style={styles.itemHeader}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 4px 0' }}>
                      To: {r.partnerEmail}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>
                      Order Ref: #{r.orderId.substring(0, 7).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {renderStars(r.rating)}
                    <span style={styles.time}>
                      <Calendar size={11} style={{ marginRight: '4px' }} />
                      {new Date(r.createdAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p style={styles.comment}>"{r.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  reviewItem: {
    padding: '16px 20px',
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    borderBottom: '1px solid var(--sky-blue)',
    paddingBottom: '8px',
  },
  time: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 600,
  },
  comment: {
    fontSize: '13px',
    color: 'var(--primary-navy)',
    lineHeight: 1.5,
    fontStyle: 'italic',
    paddingLeft: '12px',
    borderLeft: '3px solid var(--primary-teal)',
    margin: 0,
    fontWeight: 500,
  },
};
