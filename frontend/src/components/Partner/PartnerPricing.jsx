import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DollarSign, Save, RefreshCw } from 'lucide-react';
import VeloraMascot from '../Common/VeloraMascot';

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
    setError('');
    try {
      const data = await api.partners.getPricing();
      if (data && data.rateCard && data.rateCard.length > 0) {
        setRateCard(data.rateCard);
      }
    } catch (err) {
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
      // Clean rateCard payload to ensure it only has itemCategory, serviceType, price
      const cleanRateCard = rateCard.map(r => ({
        itemCategory: r.itemCategory,
        serviceType: r.serviceType,
        price: parseFloat(r.price) || 0
      }));

      const res = await api.partners.updatePricing({ rateCard: cleanRateCard });
      if (res && res.rateCard) {
        setRateCard(res.rateCard);
      }
      setSuccess('Pricing rate card updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update pricing');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'SHIRT': return 'Shirt / Daily Top';
      case 'PANTS': return 'Pants / Trouser';
      case 'SUIT': return 'Formal Suit Set';
      case 'BLANKET': return 'Bed Blanket / Duvet';
      default: return cat;
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px 0' }}>
          Pricing & Rates
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
          Configure pricing for your services, item categories, and specialized laundry treatments.
        </p>
      </div>

      {success && <div className="alert alert-success animate-fadeInUp">{success}</div>}
      {error && <div className="alert alert-error animate-fadeInUp">{error}</div>}

      <div style={styles.container}>
        <div className="velora-card animate-fadeInUp" style={{ flex: 1.2, maxWidth: '650px', padding: '2rem' }}>
          <div style={styles.cardHeader}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={20} color="var(--primary-teal)" />
              Service pricing rate card
            </h3>
            <button onClick={fetchPricing} className="velora-btn velora-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} disabled={loading}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading rates...</p>
          ) : (
            <form onSubmit={handleSave}>
              <div style={styles.ratesContainer}>
                {rateCard.map((rate, idx) => (
                  <div key={idx} style={styles.rateRow}>
                    <div style={styles.rateInfo}>
                      <span style={styles.category}>{getCategoryLabel(rate.itemCategory)}</span>
                      <span className="badge badge-info" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '10px' }}>
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
                        style={styles.priceInput}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="velora-btn velora-btn-primary animate-pulse"
                disabled={submitting}
                style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
              >
                <Save size={16} />
                {submitting ? 'Saving changes...' : 'Save Rate Card'}
              </button>
            </form>
          )}
        </div>

        <div className="velora-card animate-fadeInUp" style={{ flex: 0.8, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <VeloraMascot state={error ? 'thinking' : submitting ? 'loading' : 'happy'} size={140} style={{ marginBottom: '1rem' }} />
          <h4 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--primary-navy)', fontWeight: 800, margin: '0 0 6px 0', fontSize: '1.1rem' }}>
            Pricing Guidelines
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5, margin: 0, maxWidth: '220px' }}>
            Set competitive rates for daily items like shirts and pants to attract more local pickup requests!
          </p>
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
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid var(--bg-secondary)',
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
    background: 'var(--bg-secondary)',
    borderRadius: '16px',
  },
  rateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  category: {
    fontWeight: 700,
    fontSize: '14px',
    color: 'var(--primary-navy)',
    width: '140px',
  },
  priceInputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  currency: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--primary-navy)',
  },
  priceInput: {
    width: '90px',
    padding: '8px 12px',
    textAlign: 'right',
    borderRadius: '12px',
    border: '2px solid var(--sky-blue)',
    background: '#FFFFFF',
    fontWeight: 700,
    color: 'var(--primary-navy)'
  }
};
