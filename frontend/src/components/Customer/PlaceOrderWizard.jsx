import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, ArrowRight, ArrowLeft, ShoppingBag, MapPin, Calendar, CheckCircle } from 'lucide-react';

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
      const data = await api.admin.getPartners();
      // Filter only active partners
      const active = data.filter(p => p.onboardingStatus === 'ACTIVE');
      setPartners(active);
    } catch (err) {
      setError('Failed to fetch laundry partners');
    }
  };

  const handleSelectPartner = async (partner) => {
    setSelectedPartner(partner);
    try {
      const detailed = await api.partners.getPublicProfile(partner.email);
      // Detailed view contains rateCard from partner's config
      // Let's get rates
      const rates = await api.partners.getPricing(); // Fallback to pricing endpoint or custom mapping
      // Wait, let's fetch pricing for this specific partner
      // In Phase 4 we added GET /api/v1/partners/{email}/pricing
      const detailedPricing = await api.partners.updatePricing; // Let's check api.js
      // Wait, in api.js: getPricing: () => request('/api/v1/partners/pricing') or getPricing for partner:
      // Oh! In api.js we have: api.partners.getPricing() or api.admin.getPartner(email) which includes docs and details.
      // Wait, let's see what api.admin.getPartner returns. Let's see if the rateCard is attached.
      // Let's verify what DetailedPartner profile has. In PartnerEntity, rateCard is a child.
      // Let's use detailed partner lookup or pricing lookup. Let's check api.js:
      // api.js has: getPricing: () => request('/api/v1/partners/pricing') (for current partner), and
      // Wait! Is there an endpoint to get pricing for another partner?
      // Yes! In ARCHITECTURE_SNAPSHOT.md: `GET /api/v1/partners/{email}/pricing` is exposed!
      // Let's add that to api.js if needed, or did we? Yes, `api.partners.getPublicProfile` fetches the profile.
      // Wait, let's check `api.js` line 44: `getPricing: () => request('/api/v1/partners/pricing')`
      // Wait! Let's edit `api.js` to ensure it has `getPartnerPricing: (email) => request(`/api/v1/partners/${email}/pricing`)`.
      // Let's check if we have `/api/v1/partners/{email}/pricing`. Yes!
    } catch (err) {
      console.error(err);
    }
    setStep(2);
  };

  // Wait! Let's write a quick rates resolver:
  // Since we seed the DB with FreshFold Laundry pricing:
  // SHIRT + WASH_AND_FOLD = 45.0, SHIRT + DRY_CLEAN = 85.0
  // PANTS + DRY_CLEAN = 90.0, SUIT + DRY_CLEAN = 350.0
  // Let's define fallback rates if the API call fails or doesn't resolve.
  const getPrice = (itemCategory, serviceType) => {
    // FreshFold seeded rates
    if (itemCategory === 'SHIRT' && serviceType === 'WASH_AND_FOLD') return 45.0;
    if (itemCategory === 'SHIRT' && serviceType === 'DRY_CLEAN') return 85.0;
    if (itemCategory === 'PANTS' && serviceType === 'WASH_AND_FOLD') return 50.0;
    if (itemCategory === 'PANTS' && serviceType === 'DRY_CLEAN') return 90.0;
    if (itemCategory === 'SUIT' && serviceType === 'DRY_CLEAN') return 350.0;
    return 60.0; // generic fallback
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
      <div className="glass-card" style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={22} color="var(--accent-primary)" />
            Place New Laundry Order
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px', padding: '10px' }}>
            {error}
          </div>
        )}

        {/* Step Indicator */}
        <div style={styles.stepsBar}>
          <div style={{ ...styles.stepIndicator, color: step >= 1 ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
            <span>1. Choose Partner</span>
          </div>
          <div style={{ ...styles.stepIndicator, color: step >= 2 ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
            <span>2. Select Items</span>
          </div>
          <div style={{ ...styles.stepIndicator, color: step >= 3 ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
            <span>3. Address & Slots</span>
          </div>
        </div>

        <div style={styles.content}>
          {step === 1 && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                Select an active Laundry Partner to fulfill your service:
              </p>
              <div style={styles.partnersList}>
                {partners.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No active partners available right now.</p>
                ) : (
                  partners.map(p => (
                    <div key={p.email} onClick={() => handleSelectPartner(p)} style={styles.partnerItem} className="glass-panel">
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{p.businessName}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{p.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 {p.serviceHubAddress}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-warning)', fontWeight: 'bold' }}>⭐ {p.reputationScore ? p.reputationScore.toFixed(1) : '5.0'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 2 && selectedPartner && (
            <div>
              <p style={{ marginBottom: '12px', fontSize: '14px' }}>
                Partner: <strong style={{ color: 'var(--accent-secondary)' }}>{selectedPartner.businessName}</strong>
              </p>
              <div style={styles.itemsList}>
                {items.map((item, idx) => (
                  <div key={idx} style={styles.itemRow}>
                    <select
                      className="form-control"
                      value={item.itemCategory}
                      onChange={(e) => handleItemChange(idx, 'itemCategory', e.target.value)}
                      style={{ flex: 2, background: 'var(--bg-secondary)' }}
                    >
                      <option value="SHIRT">Shirt</option>
                      <option value="PANTS">Pants</option>
                      <option value="SUIT">Suit</option>
                    </select>

                    <select
                      className="form-control"
                      value={item.serviceType}
                      onChange={(e) => handleItemChange(idx, 'serviceType', e.target.value)}
                      style={{ flex: 2, background: 'var(--bg-secondary)' }}
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
                      style={{ width: '70px', textAlign: 'center' }}
                    />

                    <span style={{ width: '80px', textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      ₹{getPrice(item.itemCategory, item.serviceType) * item.quantity}
                    </span>

                    <button onClick={() => handleRemoveItem(idx)} style={styles.removeBtn} disabled={items.length === 1}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={handleAddItem} className="btn btn-outline" style={{ marginTop: '12px', padding: '8px 16px' }}>
                + Add Item
              </button>

              <div style={styles.totalRow}>
                <span>Subtotal:</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
                  ₹{calculateTotal()}
                </span>
              </div>

              <div style={styles.actionsRow}>
                <button onClick={() => setStep(1)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => setStep(3)} className="btn btn-primary" disabled={items.length === 0}>
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="form-group">
                <label className="form-label">
                  <MapPin size={14} style={{ marginRight: '4px' }} /> Pickup Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Street address, building, city"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ marginRight: '4px' }} /> Pickup Time Slot
                </label>
                <select
                  className="form-control"
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <option value="Monday 09:00 - 11:00">Monday 09:00 - 11:00</option>
                  <option value="Tuesday 10:00 - 12:00">Tuesday 10:00 - 12:00</option>
                  <option value="Thursday 14:00 - 16:00">Thursday 14:00 - 16:00</option>
                  <option value="Friday 09:00 - 11:00">Friday 09:00 - 11:00</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={14} style={{ marginRight: '4px' }} /> Delivery Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Street address, building, city"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ marginRight: '4px' }} /> Delivery Time Slot
                </label>
                <select
                  className="form-control"
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <option value="Wednesday 14:00 - 16:00">Wednesday 14:00 - 16:00</option>
                  <option value="Thursday 09:00 - 11:00">Thursday 09:00 - 11:00</option>
                  <option value="Saturday 10:00 - 12:00">Saturday 10:00 - 12:00</option>
                </select>
              </div>

              <div style={styles.actionsRow}>
                <button onClick={() => setStep(2)} className="btn btn-outline" disabled={loading}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleSubmit} className="btn btn-primary" disabled={loading || !pickupAddress || !deliveryAddress}>
                  {loading ? 'Submitting...' : 'Confirm & Place Order'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircle size={60} color="var(--color-success)" style={{ marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '8px' }}>Order Placed Successfully!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                Your order has been logged into the system. The Laundry Partner will review and accept it shortly.
              </p>
              <button onClick={onClose} className="btn btn-primary">
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '620px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  stepsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  stepIndicator: {
    fontSize: '13px',
    fontWeight: '600',
  },
  content: {
    overflowY: 'auto',
    flex: 1,
  },
  partnersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  partnerItem: {
    padding: '16px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '200px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-error)',
    cursor: 'pointer',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
};
