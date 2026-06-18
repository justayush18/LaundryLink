import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Star, MessageSquare, Calendar } from 'lucide-react';

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
            fill={s <= rating ? 'var(--color-warning)' : 'none'}
            color={s <= rating ? 'var(--color-warning)' : 'var(--text-muted)'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>My Reviews</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review your feedback history given to our laundry partners.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="glass-card">
        <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Feedback History</h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <MessageSquare size={44} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <p>You haven't submitted any reviews yet.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {reviews.map((r) => (
              <div key={r.id} style={styles.reviewItem} className="glass-panel">
                <div style={styles.itemHeader}>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--accent-secondary)' }}>
                      To: {r.partnerEmail}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Order Ref: #{r.orderId.substring(0, 8)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {renderStars(r.rating)}
                    <span style={styles.time}>
                      <Calendar size={10} style={{ marginRight: '4px', display: 'inline' }} />
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
    padding: '20px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
  },
  time: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
  },
  comment: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    fontStyle: 'italic',
    paddingLeft: '8px',
    borderLeft: '2px solid var(--accent-primary)',
  },
};
