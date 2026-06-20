import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DollarSign, Save, RefreshCw, Trash2, Plus } from 'lucide-react';
import VeloraMascot from '../Common/VeloraMascot';
import CustomSelect from '../Common/CustomSelect';

const STANDARD_CATEGORIES = ['SHIRT', 'PANTS', 'SUIT', 'JACKET', 'BLANKET', 'CURTAINS', 'SAREE', 'DRESS'];
const STANDARD_SERVICES = ['WASH_AND_FOLD', 'DRY_CLEAN', 'WASH_AND_IRON', 'STEAM_PRESS', 'PREMIUM_DRY_CLEAN', 'STAIN_REMOVAL'];

const CATEGORY_OPTIONS = [
  { value: 'SHIRT', label: 'Shirt / Daily Top' },
  { value: 'PANTS', label: 'Pants / Trouser' },
  { value: 'SUIT', label: 'Formal Suit Set' },
  { value: 'JACKET', label: 'Jacket / Coat' },
  { value: 'BLANKET', label: 'Bed Blanket / Duvet' },
  { value: 'CURTAINS', label: 'Curtains / Drapes' },
  { value: 'SAREE', label: 'Saree' },
  { value: 'DRESS', label: 'Dress' },
  { value: 'CUSTOM', label: 'Other (Write manually)' },
];

const SERVICE_OPTIONS = [
  { value: 'WASH_AND_FOLD', label: 'Wash & Fold' },
  { value: 'DRY_CLEAN', label: 'Dry Clean' },
  { value: 'WASH_AND_IRON', label: 'Wash & Iron' },
  { value: 'STEAM_PRESS', label: 'Steam Press' },
  { value: 'PREMIUM_DRY_CLEAN', label: 'Premium Dry Clean' },
  { value: 'STAIN_REMOVAL', label: 'Stain Removal' },
  { value: 'CUSTOM', label: 'Other (Write manually)' },
];

export default function PartnerPricing() {
  const [rateCard, setRateCard] = useState([
    { itemCategory: 'SHIRT', customItemCategory: '', serviceType: 'WASH_AND_FOLD', customServiceType: '', price: 45.0 },
    { itemCategory: 'SHIRT', customItemCategory: '', serviceType: 'DRY_CLEAN', customServiceType: '', price: 85.0 },
    { itemCategory: 'PANTS', customItemCategory: '', serviceType: 'WASH_AND_FOLD', customServiceType: '', price: 50.0 },
    { itemCategory: 'PANTS', customItemCategory: '', serviceType: 'DRY_CLEAN', customServiceType: '', price: 90.0 },
    { itemCategory: 'SUIT', customItemCategory: '', serviceType: 'DRY_CLEAN', customServiceType: '', price: 350.0 },
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
        const mapped = data.rateCard.map(r => {
          const isStandardCat = STANDARD_CATEGORIES.includes(r.itemCategory.toUpperCase());
          const isStandardSvc = STANDARD_SERVICES.includes(r.serviceType.toUpperCase());
          return {
            itemCategory: isStandardCat ? r.itemCategory.toUpperCase() : 'CUSTOM',
            customItemCategory: isStandardCat ? '' : r.itemCategory,
            serviceType: isStandardSvc ? r.serviceType.toUpperCase() : 'CUSTOM',
            customServiceType: isStandardSvc ? '' : r.serviceType,
            price: r.price
          };
        });
        setRateCard(mapped);
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

  const handleFieldChange = (index, field, value) => {
    const newRates = [...rateCard];
    newRates[index][field] = value;
    setRateCard(newRates);
  };

  const handleAddRate = () => {
    setRateCard([
      ...rateCard,
      { itemCategory: 'SHIRT', customItemCategory: '', serviceType: 'WASH_AND_FOLD', customServiceType: '', price: 50.0 }
    ]);
  };

  const handleRemoveRate = (index) => {
    setRateCard(rateCard.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validate manual text fields and prices
    for (let i = 0; i < rateCard.length; i++) {
      const r = rateCard[i];
      if (r.itemCategory === 'CUSTOM' && !r.customItemCategory?.trim()) {
        setError('Please enter a custom category name for all manual entries.');
        setSubmitting(false);
        return;
      }
      if (r.serviceType === 'CUSTOM' && !r.customServiceType?.trim()) {
        setError('Please enter a custom service name for all manual entries.');
        setSubmitting(false);
        return;
      }
      if (r.price < 0) {
        setError('Price must be greater than or equal to 0.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const cleanRateCard = rateCard.map(r => {
        const cat = r.itemCategory === 'CUSTOM' ? r.customItemCategory : r.itemCategory;
        const svc = r.serviceType === 'CUSTOM' ? r.customServiceType : r.serviceType;
        return {
          itemCategory: cat.trim().toUpperCase(),
          serviceType: svc.trim().toUpperCase(),
          price: parseFloat(r.price) || 0
        };
      });

      const res = await api.partners.updatePricing({ rateCard: cleanRateCard });
      if (res && res.rateCard) {
        const mapped = res.rateCard.map(rc => {
          const isStandardCat = STANDARD_CATEGORIES.includes(rc.itemCategory.toUpperCase());
          const isStandardSvc = STANDARD_SERVICES.includes(rc.serviceType.toUpperCase());
          return {
            itemCategory: isStandardCat ? rc.itemCategory.toUpperCase() : 'CUSTOM',
            customItemCategory: isStandardCat ? '' : rc.itemCategory,
            serviceType: isStandardSvc ? rc.serviceType.toUpperCase() : 'CUSTOM',
            customServiceType: isStandardSvc ? '' : rc.serviceType,
            price: rc.price
          };
        });
        setRateCard(mapped);
      }
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
        <div className="velora-card animate-fadeInUp" style={{ flex: 1.2, maxWidth: '750px', padding: '2rem' }}>
          <div style={styles.cardHeader}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={20} color="var(--primary-teal)" />
              Service pricing rate card
            </h3>
            <button type="button" onClick={fetchPricing} className="velora-btn velora-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} disabled={loading}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading rates...</p>
          ) : (
            <form onSubmit={handleSave}>
              <div style={styles.ratesContainer}>
                {rateCard.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem' }}>No rate entries. Click below to add one!</p>
                ) : (
                  rateCard.map((rate, idx) => (
                    <div key={idx} style={styles.rateRowEditable}>
                      <div style={styles.rateRowMain}>
                        <CustomSelect
                          className="form-control"
                          value={rate.itemCategory}
                          onChange={(e) => handleFieldChange(idx, 'itemCategory', e.target.value)}
                          style={styles.dropdown}
                          disabled={submitting}
                        >
                          {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </CustomSelect>

                        <CustomSelect
                          className="form-control"
                          value={rate.serviceType}
                          onChange={(e) => handleFieldChange(idx, 'serviceType', e.target.value)}
                          style={styles.dropdown}
                          disabled={submitting}
                        >
                          {SERVICE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </CustomSelect>
                        
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

                        <button
                          type="button"
                          onClick={() => handleRemoveRate(idx)}
                          style={styles.removeBtn}
                          disabled={submitting}
                          title="Remove rate item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Conditional manual text fields */}
                      {(rate.itemCategory === 'CUSTOM' || rate.serviceType === 'CUSTOM') && (
                        <div style={styles.customFieldsRow}>
                          {rate.itemCategory === 'CUSTOM' && (
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Write category name (e.g. Bed Sheet)"
                              value={rate.customItemCategory || ''}
                              onChange={(e) => handleFieldChange(idx, 'customItemCategory', e.target.value)}
                              style={styles.customInput}
                              disabled={submitting}
                              required
                            />
                          )}
                          {rate.serviceType === 'CUSTOM' && (
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Write service name (e.g. Dyeing)"
                              value={rate.customServiceType || ''}
                              onChange={(e) => handleFieldChange(idx, 'customServiceType', e.target.value)}
                              style={styles.customInput}
                              disabled={submitting}
                              required
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={handleAddRate}
                  className="velora-btn velora-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700 }}
                  disabled={submitting}
                >
                  <Plus size={14} /> Add Rate Card Item
                </button>

                <button
                  type="submit"
                  className="velora-btn velora-btn-primary animate-pulse"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
                >
                  <Save size={16} />
                  {submitting ? 'Saving changes...' : 'Save Rate Card'}
                </button>
              </div>
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
    borderBottom: '2px solid var(--bg-primary)',
    paddingBottom: '14px',
    marginBottom: '20px',
  },
  ratesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rateRowEditable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '14px',
    background: 'var(--bg-primary)',
    borderRadius: '16px',
    border: '1px solid var(--sky-blue-light)',
  },
  rateRowMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  dropdown: {
    flex: 2,
    borderRadius: '12px',
    border: '2px solid var(--sky-blue)',
    background: '#FFFFFF',
    padding: '8px 12px',
    fontWeight: 600,
    color: 'var(--primary-navy)',
    fontFamily: 'Outfit, sans-serif',
    minWidth: '130px',
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
    width: '85px',
    padding: '8px 12px',
    textAlign: 'right',
    borderRadius: '12px',
    border: '2px solid var(--sky-blue)',
    background: '#FFFFFF',
    fontWeight: 700,
    color: 'var(--primary-navy)',
  },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-error)',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
  customFieldsRow: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  customInput: {
    flex: 1,
    borderRadius: '12px',
    border: '2px solid var(--sky-blue)',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    background: '#FFFFFF',
  }
};
