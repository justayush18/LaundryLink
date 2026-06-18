import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, ArrowRight, ArrowLeft, Calendar, MapPin, CheckCircle, Star } from 'lucide-react';
import VeloraMascot from '../Common/VeloraMascot';

export default function PlaceOrderWizard({ isOpen, onClose, onOrderPlaced }) {
  const [step, setStep] = useState(1);
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [rateCard, setRateCard] = useState([]);
  const [items, setItems] = useState([{ itemCategory: 'SHIRT', serviceType: 'WASH_AND_FOLD', quantity: 1 }]);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupSlot, setPickupSlot] = useState('Monday 09:00 - 11:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('Wednesday 14:00 - 16:00');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPartners();
      setStep(1);
      setSelectedPartner(null);
      setItems([{ itemCategory: 'SHIRT', serviceType: 'WASH_AND_FOLD', quantity: 1 }]);
      setError('');
    }
  }, [isOpen]);

  const fetchPartners = async () => {
    try {
      const data = await api.partners.list();
      if (data && Array.isArray(data)) {
        const active = data.filter(p => p.onboardingStatus === 'ACTIVE');
        setPartners(active);
      } else {
        setPartners([]);
      }
    } catch (err) {
      setError('Failed to fetch laundry partners');
    }
  };

  const handleSelectPartner = async (partner) => {
    setSelectedPartner(partner);
    try {
      const detailedPricing = await api.partners.getPartnerPricing(partner.email);
      if (detailedPricing && detailedPricing.rateCard) {
        setRateCard(detailedPricing.rateCard);
      } else {
        setRateCard([]);
      }
    } catch (err) {
      console.error("Failed to fetch partner pricing, using fallback pricing", err);
      setRateCard([]);
    }
    setStep(2);
  };

  const getPrice = (itemCategory, serviceType) => {
    if (rateCard && rateCard.length > 0) {
      const match = rateCard.find(
        r => r.itemCategory === itemCategory && r.serviceType === serviceType
      );
      if (match) return match.price;
    }
    if (itemCategory === 'SHIRT' && serviceType === 'WASH_AND_FOLD') return 45.0;
    if (itemCategory === 'SHIRT' && serviceType === 'DRY_CLEAN') return 85.0;
    if (itemCategory === 'PANTS' && serviceType === 'WASH_AND_FOLD') return 50.0;
    if (itemCategory === 'PANTS' && serviceType === 'DRY_CLEAN') return 90.0;
    if (itemCategory === 'SUIT' && serviceType === 'DRY_CLEAN') return 350.0;
    return 60.0;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (getPrice(item.itemCategory, item.serviceType) * item.quantity), 0);
  };

  const handleAddItem = () => {
    setItems([...items, { itemCategory: 'SHIRT', serviceType: 'WASH_AND_FOLD', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const orderPayload = {
        partnerEmail: selectedPartner.email,
        items: items.map(i => ({
          itemCategory: i.itemCategory,
          serviceType: i.serviceType,
          quantity: parseInt(i.quantity, 10)
        })),
        pickupAddress,
        pickupSlot,
        deliveryAddress,
        deliverySlot
      };

      const res = await api.orders.placeOrder(orderPayload);
      if (onOrderPlaced) {
        onOrderPlaced(res);
      }
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div className="velora-card animate-fadeInUp" style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🧺</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              New Laundry Order
            </h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error animate-pulse" style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '16px' }}>
            {error}
          </div>
        )}

        {/* Step Indicator */}
        {step < 4 && (
          <div style={styles.stepsBar}>
            <div style={{ ...styles.stepIndicator, color: step >= 1 ? 'var(--primary-teal)' : 'var(--text-secondary)' }}>
              <span style={step === 1 ? styles.activeStepLabel : {}}>1. Choose Partner</span>
            </div>
            <div style={{ ...styles.stepIndicator, color: step >= 2 ? 'var(--primary-teal)' : 'var(--text-secondary)' }}>
              <span style={step === 2 ? styles.activeStepLabel : {}}>2. Select Items</span>
            </div>
            <div style={{ ...styles.stepIndicator, color: step >= 3 ? 'var(--primary-teal)' : 'var(--text-secondary)' }}>
              <span style={step === 3 ? styles.activeStepLabel : {}}>3. Slots</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={styles.content}>
          {step === 1 && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '13px', fontWeight: 600 }}>
                Select a trusted service provider from our active network:
              </p>
              <div style={styles.partnersList}>
                {partners.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No active partners available right now.</p>
                ) : (
                  partners.map(p => (
                    <div 
                      key={p.email} 
                      onClick={() => handleSelectPartner(p)} 
                      className="partner-select-card"
                      style={styles.partnerItem}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ color: 'var(--primary-navy)', margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 800 }}>
                          {p.businessName}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#FBBF24', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          ★ {p.reputationScore ? p.reputationScore.toFixed(1) : '5.0'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        {p.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>📍 {p.serviceHubAddress}</span>
                        <span style={{ fontSize: '11px', color: 'var(--primary-teal)', fontWeight: 700 }}>Select & Continue →</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 2 && selectedPartner && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Selected Provider:
                </span>
                <span className="badge badge-success" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                  {selectedPartner.businessName}
                </span>
              </div>
              
              <div style={styles.itemsList}>
                {items.map((item, idx) => (
                  <div key={idx} style={styles.itemRow}>
                    <select
                      className="form-control"
                      value={item.itemCategory}
                      onChange={(e) => handleItemChange(idx, 'itemCategory', e.target.value)}
                      style={{ flex: 2, borderRadius: '14px', border: '2px solid var(--sky-blue)', background: '#FFFFFF', padding: '8px' }}
                    >
                      <option value="SHIRT">Shirt</option>
                      <option value="PANTS">Pants</option>
                      <option value="SUIT">Suit</option>
                    </select>

                    <select
                      className="form-control"
                      value={item.serviceType}
                      onChange={(e) => handleItemChange(idx, 'serviceType', e.target.value)}
                      style={{ flex: 2, borderRadius: '14px', border: '2px solid var(--sky-blue)', background: '#FFFFFF', padding: '8px' }}
                    >
                      <option value="WASH_AND_FOLD">Wash & Fold</option>
                      <option value="DRY_CLEAN">Dry Clean</option>
                    </select>

                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      style={{ width: '65px', textAlign: 'center', borderRadius: '14px', border: '2px solid var(--sky-blue)', background: '#FFFFFF', padding: '8px' }}
                    />

                    <span style={{ width: '70px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: 'var(--primary-navy)' }}>
                      ₹{getPrice(item.itemCategory, item.serviceType) * item.quantity}
                    </span>

                    <button 
                      onClick={() => handleRemoveItem(idx)} 
                      style={styles.removeBtn} 
                      disabled={items.length === 1}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={handleAddItem} className="velora-btn velora-btn-secondary" style={{ marginTop: '1rem', padding: '8px 16px', fontSize: '12px' }}>
                + Add Item
              </button>

              <div style={styles.totalRow}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Estimated Subtotal:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-teal)', fontFamily: 'Outfit, sans-serif' }}>
                  ₹{calculateTotal()}
                </span>
              </div>

              <div style={styles.actionsRow}>
                <button onClick={() => setStep(1)} className="velora-btn velora-btn-secondary">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => setStep(3)} className="velora-btn velora-btn-primary" disabled={items.length === 0}>
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="form-group">
                <label className="form-label" style={styles.label}>
                  <MapPin size={13} /> Pickup Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Street address, building, city"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={styles.label}>
                  <Calendar size={13} /> Pickup Time Slot
                </label>
                <select
                  className="form-control"
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                  style={{ ...styles.input, background: '#FFFFFF' }}
                >
                  <option value="Monday 09:00 - 11:00">Monday 09:00 - 11:00</option>
                  <option value="Tuesday 10:00 - 12:00">Tuesday 10:00 - 12:00</option>
                  <option value="Thursday 14:00 - 16:00">Thursday 14:00 - 16:00</option>
                  <option value="Friday 09:00 - 11:00">Friday 09:00 - 11:00</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={styles.label}>
                  <MapPin size={13} /> Delivery Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Street address, building, city"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={styles.label}>
                  <Calendar size={13} /> Delivery Time Slot
                </label>
                <select
                  className="form-control"
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  style={{ ...styles.input, background: '#FFFFFF' }}
                >
                  <option value="Wednesday 14:00 - 16:00">Wednesday 14:00 - 16:00</option>
                  <option value="Thursday 09:00 - 11:00">Thursday 09:00 - 11:00</option>
                  <option value="Saturday 10:00 - 12:00">Saturday 10:00 - 12:00</option>
                </select>
              </div>

              <div style={styles.actionsRow}>
                <button onClick={() => setStep(2)} className="velora-btn velora-btn-secondary" disabled={loading}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleSubmit} className="velora-btn velora-btn-primary animate-pulse" disabled={loading || !pickupAddress || !deliveryAddress}>
                  {loading ? 'Submitting...' : 'Confirm & Place Order'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <VeloraMascot state="celebrating" size={130} style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '12px 0 6px 0' }}>
                Order Placed Successfully!
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '13px', maxWidth: '340px', lineHeight: 1.4 }}>
                Your order is logged. The selected laundry partner will review and accept your items shortly.
              </p>
              <button onClick={onClose} className="velora-btn velora-btn-primary">
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
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
    maxWidth: '560px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
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
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px',
  },
  stepsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid var(--bg-secondary)',
  },
  stepIndicator: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  activeStepLabel: {
    color: 'var(--primary-navy)',
    borderBottom: '2px solid var(--primary-teal)',
    paddingBottom: '14px',
  },
  content: {
    overflowY: 'auto',
    flex: 1,
    paddingRight: '4px',
  },
  partnersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  partnerItem: {
    padding: '16px',
    cursor: 'pointer',
    background: 'var(--bg-secondary)',
    borderRadius: '20px',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '220px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#E02424',
    cursor: 'pointer',
    padding: '6px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '2px solid var(--bg-secondary)',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
  label: {
    color: 'var(--primary-navy)',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  input: {
    borderRadius: '16px',
    border: '2px solid var(--sky-blue)',
    background: 'var(--bg-secondary)',
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--primary-navy)',
  },
};
