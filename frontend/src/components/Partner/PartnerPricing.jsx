import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DollarSign, Save, RefreshCw } from 'lucide-react';

export default function PartnerPricing() {
  const [rateCard, setRateCard] = useState([
    { itemCategory: 'SHIRT', serviceType: 'WASH_AND_FOLD', price: 45.0 },
    { itemCategory: 'SHIRT', serviceType: 'DRY_CLEAN', price: 85.0 },
    { itemCategory: 'PANTS', serviceType: 'WASH_AND_FOLD', price: 50.0 },
    { itemCategory: 'PANTS', serviceType: 'DRY_CLEAN', price: 90.0 },
    { itemCategory: 'SUIT', serviceType: 'DRY_CLEAN', price: 350.0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const data = await api.partners.getPricing();
      if (data && data.rateCard && data.rateCard.length > 0) {
        setRateCard(data.rateCard);
      }
    } catch (err) {
      // Keep default seeded state as fallback
      console.warn('Failed to load pricing from API, using seeded fallback values');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handlePriceChange = (index, value) => {
    const newRates = [...rateCard];
    newRates[index].price = parseFloat(value) || 0;
    setRateCard(newRates);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.partners.updatePricing({ rateCard });
      setSuccess('Pricing rate card updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update pricing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Pricing & Rates</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure prices for different item categories and washing services.</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="glass-card" style={{ maxWidth: '650px' }}>
        <div style={styles.cardHeader}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="var(--accent-secondary)" />
            Service Pricing Rate Card
          </h3>
          <button onClick={fetchPricing} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} disabled={loading}>
            <RefreshCw size={12} style={{ marginRight: '4px' }} /> Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>Loading rates...</p>
        ) : (
          <form onSubmit={handleSave}>
            <div style={styles.ratesContainer}>
              {rateCard.map((rate, idx) => (
                <div key={idx} style={styles.rateRow} className="glass-panel">
                  <div style={styles.rateInfo}>
                    <span style={styles.category}>{rate.itemCategory}</span>
                    <span className="badge badge-info" style={styles.serviceBadge}>
                      {rate.serviceType.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div style={styles.priceInputGroup}>
                    <span style={styles.currency}>₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={rate.price}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      min="0"
                      step="1"
                      required
                      disabled={submitting}
                      style={{ width: '100px', padding: '8px', textAlign: 'right' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} />
              {submitting ? 'Saving changes...' : 'Save Rate Card'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '14px',
    marginBottom: '20px',
  },
  ratesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 18px',
  },
  rateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  category: {
    fontWeight: 'bold',
    fontSize: '15px',
    width: '80px',
  },
  serviceBadge: {
    fontSize: '10px',
  },
  priceInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  currency: {
    fontSize: '16px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
};
