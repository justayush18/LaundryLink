import React, { useState, useEffect } from 'react';
import { api, getFriendlyErrorMessage } from '../../services/api';
import { X, ArrowRight, ArrowLeft, Calendar, MapPin, CheckCircle, Star, CreditCard, Smartphone, Truck, ShieldCheck, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import VeloraMascot from '../Common/VeloraMascot';

export default function PlaceOrderWizard({ isOpen, onClose, onOrderPlaced }) {
  const [step, setStep] = useState(1);
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerSelectionMode, setPartnerSelectionMode] = useState('RANDOM'); // 'RANDOM' or 'MANUAL'
  const [rateCard, setRateCard] = useState([]);
  const [items, setItems] = useState([{ itemCategory: 'SHIRT', serviceType: 'WASH_AND_FOLD', quantity: 1 }]);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupSlot, setPickupSlot] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingPartner, setPendingPartner] = useState(null);

  const [orderId, setOrderId] = useState('');
  const [totalCost, setTotalCost] = useState(0);

  // Payment states (copied from CheckoutModal)
  const [method, setMethod] = useState(''); // 'UPI' | 'RAZORPAY' | 'COD'
  const [upiSub, setUpiSub] = useState(''); // 'GPAY' | 'PHONEPE' | 'PAYTM' | 'ID'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [otp, setOtp] = useState('');
  const [paymentStep, setPaymentStep] = useState(1); // 1: Select Method, 2: Details/Input, 3: Processing Loader, 4: OTP Screen (Razorpay)
  const [loadingMsg, setLoadingMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePayment, setActivePayment] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPartners();
      setStep(1);
      setSelectedPartner(null);
      setPartnerSelectionMode('RANDOM');
      setItems([{ itemCategory: 'SHIRT', serviceType: 'WASH_AND_FOLD', quantity: 1 }]);
      setError('');
      setShowWarningModal(false);
      setPendingPartner(null);

      // Reset payment states
      setOrderId('');
      setTotalCost(0);
      setMethod('');
      setUpiSub('');
      setUpiId('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardName('');
      setOtp('');
      setPaymentStep(1);
      setLoadingMsg('');
      setSubmitting(false);
      setActivePayment(null);
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
    const resolvedPickup = partner.openStatus === 'OPEN' 
      ? 'Immediate Pickup (within 1 hour)' 
      : `Scheduled: ${partner.nextAvailableSlot}`;
    const resolvedDelivery = partner.earliestDeliveryTime;
    setPickupSlot(resolvedPickup);
    setDeliverySlot(resolvedDelivery);
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

  const handleAutoAssign = () => {
    if (partners.length === 0) {
      setError('No active partners available at the moment.');
      return;
    }
    const sorted = [...partners].sort((a, b) => {
      const scoreA = a.reputationScore !== undefined && a.reputationScore !== null ? a.reputationScore : 5.0;
      const scoreB = b.reputationScore !== undefined && b.reputationScore !== null ? b.reputationScore : 5.0;
      return scoreB - scoreA;
    });

    const highestScore = sorted[0].reputationScore !== undefined && sorted[0].reputationScore !== null ? sorted[0].reputationScore : 5.0;
    const topPartners = sorted.filter(p => {
      const score = p.reputationScore !== undefined && p.reputationScore !== null ? p.reputationScore : 5.0;
      return score === highestScore;
    });

    const randomBestPartner = topPartners[Math.floor(Math.random() * topPartners.length)];
    if (randomBestPartner.nextDayDelivery || randomBestPartner.openStatus === 'CLOSED') {
      setPendingPartner(randomBestPartner);
      setShowWarningModal(true);
    } else {
      handleSelectPartner(randomBestPartner);
    }
  };

  const handlePartnerClick = (p) => {
    if (p.nextDayDelivery || p.openStatus === 'CLOSED') {
      setPendingPartner(p);
      setShowWarningModal(true);
    } else {
      handleSelectPartner(p);
    }
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

  const handleClose = () => {
    if (orderId) {
      if (onOrderPlaced) {
        onOrderPlaced();
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSelectMethod = (selected) => {
    setMethod(selected);
    setError('');
    setPaymentStep(2);
  };

  const handleUpiAppClick = (app) => {
    setUpiSub(app);
    setError('');
  };

  const validateCard = () => {
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError('Please enter expiry in MM/YY format');
      return false;
    }
    if (cvv.length !== 3) {
      setError('Please enter a valid 3-digit CVV');
      return false;
    }
    if (!cardName.trim()) {
      setError('Please enter the cardholder name');
      return false;
    }
    return true;
  };

  const validateUpi = () => {
    if (upiSub === 'ID' && !/^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+$/.test(upiId)) {
      setError('Please enter a valid UPI ID (e.g. username@bank)');
      return false;
    }
    if (!upiSub) {
      setError('Please select a UPI app or enter a UPI ID');
      return false;
    }
    return true;
  };

  const startPaymentProcessing = async () => {
    setError('');
    setSubmitting(true);
    setPaymentStep(3);

    try {
      setLoadingMsg('Initiating secure payment request...');
      const payment = await api.payments.initiate({ orderId, paymentMethod: method });
      setActivePayment(payment);

      if (method === 'COD') {
        setLoadingMsg('Registering Cash on Delivery option...');
        await new Promise(r => setTimeout(r, 1500));
        setStep(5);
      } else if (method === 'UPI') {
        setLoadingMsg('Waiting for approval in your UPI app...');
        await new Promise(r => setTimeout(r, 2000));
        
        const txnId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await api.payments.process(payment.paymentId, { transactionId: txnId, simulateSuccess: true });
        
        setStep(5);
      } else if (method === 'RAZORPAY') {
        setLoadingMsg('Contacting payment gateway...');
        await new Promise(r => setTimeout(r, 1500));
        setLoadingMsg('Generating bank OTP verification request...');
        await new Promise(r => setTimeout(r, 1000));
        setPaymentStep(4);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setPaymentStep(5);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }
    
    setError('');
    setSubmitting(true);
    setPaymentStep(3);
    setLoadingMsg('Verifying OTP secure credentials...');

    try {
      await new Promise(r => setTimeout(r, 1500));
      const txnId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      await api.payments.process(activePayment.paymentId, { transactionId: txnId, simulateSuccess: true });
      setStep(5);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setPaymentStep(5);
    } finally {
      setSubmitting(false);
    }
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
      setOrderId(res.orderId);
      setTotalCost(res.totalCost);
      setStep(4);
      setPaymentStep(1);
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
          {!(step === 4 && paymentStep === 3) && (
            <button onClick={handleClose} style={styles.closeBtn}>
              <X size={20} />
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-error animate-pulse" style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '16px' }}>
            {error}
          </div>
        )}

        {/* Step Indicator */}
        {step < 5 && (
          <div style={styles.stepsBar}>
            <div style={{ ...styles.stepIndicator, color: step >= 1 ? 'var(--primary-teal)' : 'var(--text-secondary)' }}>
              <span style={step === 1 ? styles.activeStepLabel : {}}>1. Choose Partner</span>
            </div>
            <div style={{ ...styles.stepIndicator, color: step >= 2 ? 'var(--primary-teal)' : 'var(--text-secondary)' }}>
              <span style={step === 2 ? styles.activeStepLabel : {}}>2. Select Items</span>
            </div>
            <div style={{ ...styles.stepIndicator, color: step >= 3 ? 'var(--primary-teal)' : 'var(--text-secondary)' }}>
              <span style={step === 3 ? styles.activeStepLabel : {}}>3. Address</span>
            </div>
            <div style={{ ...styles.stepIndicator, color: step >= 4 ? 'var(--primary-teal)' : 'var(--text-secondary)' }}>
              <span style={step === 4 ? styles.activeStepLabel : {}}>4. Payment</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={styles.content}>
          {step === 1 && (
            <div>
              {/* Selection Mode Selector */}
              <div style={styles.modeTabs}>
                <button
                  type="button"
                  onClick={() => setPartnerSelectionMode('RANDOM')}
                  style={{
                    ...styles.modeTab,
                    ...(partnerSelectionMode === 'RANDOM' ? styles.modeTabActive : {})
                  }}
                >
                  ✨ Auto-Match Vendor
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerSelectionMode('MANUAL')}
                  style={{
                    ...styles.modeTab,
                    ...(partnerSelectionMode === 'MANUAL' ? styles.modeTabActive : {})
                  }}
                >
                  🔍 Select Manually
                </button>
              </div>

              {partnerSelectionMode === 'RANDOM' ? (
                <div className="velora-card animate-fadeInUp" style={styles.autoMatchCard}>
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <VeloraMascot state="thinking" size={110} style={{ marginBottom: '1.25rem' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '8px 0 6px 0' }}>
                      Best Available Partner
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '340px', margin: '0 auto 1.5rem auto', lineHeight: 1.45 }}>
                      We will automatically match you with the highest-rated active service provider in your area for immediate scheduling.
                    </p>
                    <button 
                      onClick={handleAutoAssign} 
                      className="velora-btn velora-btn-primary animate-pulse"
                      style={{ width: '100%', maxWidth: '280px', display: 'inline-flex', justifyContent: 'center', gap: '8px' }}
                    >
                      Auto-Match & Continue <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '13px', fontWeight: 600 }}>
                    Select a trusted service provider from our active network:
                  </p>
                  <div style={styles.partnersList}>
                    {partners.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No active partners available right now.</p>
                    ) : (
                      partners.map(p => {
                        const isClosed = p.openStatus === 'CLOSED';
                        const isFullyBooked = p.capacityIndicator?.includes("Fully Booked");
                        const isLimited = p.capacityIndicator?.includes("Limited");
                        
                        return (
                          <div 
                            key={p.email} 
                            onClick={() => handlePartnerClick(p)} 
                            className="partner-select-card"
                            style={{
                              ...styles.partnerItem,
                              border: p.fastestDelivery ? '2px solid gold' : '2px solid transparent',
                              background: '#FFFFFF',
                              boxShadow: 'var(--shadow-sm)',
                              position: 'relative',
                            }}
                          >
                            {p.fastestDelivery && (
                              <div style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '16px',
                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                color: '#1e2d3d',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: 'var(--shadow-sm)'
                              }}>
                                🏆 Fastest Delivery (approx. {p.serviceSlaHours}h)
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <div>
                                <h4 style={{ color: 'var(--primary-navy)', margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 800 }}>
                                  {p.businessName}
                                </h4>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                  🕒 {p.openingTime} - {p.closingTime}
                                </span>
                              </div>
                              <span style={{ fontSize: '12px', color: '#FBBF24', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                ★ {p.reputationScore ? p.reputationScore.toFixed(1) : '5.0'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              <span className={`badge ${isClosed ? 'badge-error' : 'badge-success'}`} style={{ fontSize: '10px', fontWeight: 700 }}>
                                {isClosed ? '🔴 Closed' : '🟢 Open Now'}
                              </span>
                              <span className={`badge ${isFullyBooked ? 'badge-error' : isLimited ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px', fontWeight: 700 }}>
                                {isFullyBooked ? '🔴 Fully Booked' : isLimited ? '🟡 Limited Slots' : '🟢 Available Slots'}
                              </span>
                            </div>

                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                              {p.description}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-primary)', padding: '10px', borderRadius: '14px', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <span>⏱️ Service SLA:</span>
                                <span style={{ color: 'var(--primary-navy)', fontWeight: 700 }}>{p.serviceSlaHours} Hours</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <span>🚚 Earliest Delivery:</span>
                                <span style={{ color: 'var(--primary-teal)', fontWeight: 800 }}>{p.earliestDeliveryTime}</span>
                              </div>
                              {isClosed && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  <span>📅 Next Open Slot:</span>
                                  <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>{p.nextAvailableSlot}</span>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <span>📊 Capacity Workload:</span>
                                <span style={{ color: isFullyBooked ? 'var(--color-error)' : isLimited ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 700 }}>
                                  {p.capacityIndicator}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>📍 {p.serviceHubAddress}</span>
                              <span style={{ fontSize: '11px', color: 'var(--primary-teal)', fontWeight: 700 }}>Book Now →</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
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

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={styles.label}>
                  <Calendar size={13} /> Estimated Pickup Time
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--sky-blue-light)',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--primary-navy)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚡</span> {pickupSlot || 'Loading...'}
                </div>
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

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={styles.label}>
                  <Calendar size={13} /> Estimated Delivery Commitment
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--sky-blue-light)',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--primary-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>🚚</span> {deliverySlot || 'Loading...'}
                </div>
              </div>

              {/* Cancellation Policy Disclosure */}
              <div className="alert alert-warning" style={{ margin: '20px 0', padding: '12px 16px', borderRadius: '16px', fontSize: '11px', lineHeight: '1.45', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--sky-blue)' }}>
                <div style={{ fontWeight: 800, color: 'var(--navy-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⚠️ Customer Cancellation & Refund Policy
                </div>
                <div style={{ color: 'var(--navy-light)' }}>
                  Every customer receives <strong>3 free cancellations</strong> per month. Beyond that, progressive cancellation charges apply based on order progress:
                </div>
                <ul style={{ margin: '0 0 0 16px', padding: 0, color: 'var(--navy-light)', listStyleType: 'disc' }}>
                  <li><strong>Placed (Pending acceptance):</strong> 100% refund, no charge</li>
                  <li><strong>Partner Accepted:</strong> 85% refund, 15% cancellation charge</li>
                  <li><strong>Pickup Assigned:</strong> 75% refund, 25% cancellation charge</li>
                  <li><strong>Rider Arrived for Pickup:</strong> 50% refund, 50% cancellation charge</li>
                  <li><strong>Picked Up:</strong> 25% refund, 75% cancellation charge</li>
                  <li><strong>Processing / Out for Delivery / Ready:</strong> 0% refund, 100% charge</li>
                </ul>
              </div>

              <div style={styles.actionsRow}>
                <button onClick={() => setStep(2)} className="velora-btn velora-btn-secondary" disabled={loading}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleSubmit} className="velora-btn velora-btn-primary animate-pulse" disabled={loading || !pickupAddress || !deliveryAddress}>
                  {loading ? 'Submitting...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              {/* Order Summary inside Payment step */}
              <div style={styles.orderSummary}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0' }}>ORDER ID</p>
                  <p style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                    #{orderId ? orderId.substring(0, 7).toUpperCase() : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0' }}>TOTAL AMOUNT</p>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-teal)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                    ₹{totalCost}
                  </p>
                </div>
              </div>

              {paymentStep === 1 && (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                    Choose payment method:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => handleSelectMethod('UPI')} style={styles.methodBtn}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.methodIconBox}><Smartphone size={18} color="var(--primary-teal)" /></div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={styles.methodTitle}>UPI (GPay / PhonePe / Paytm)</p>
                          <p style={styles.methodDesc}>Instant payment via UPI applications</p>
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-secondary)" />
                    </button>

                    <button onClick={() => handleSelectMethod('RAZORPAY')} style={styles.methodBtn}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.methodIconBox}><CreditCard size={18} color="var(--primary-teal)" /></div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={styles.methodTitle}>Credit / Debit Card</p>
                          <p style={styles.methodDesc}>Pay securely via cards using Razorpay gateway</p>
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-secondary)" />
                    </button>

                    <button onClick={() => handleSelectMethod('COD')} style={styles.methodBtn}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.methodIconBox}><Truck size={18} color="var(--primary-teal)" /></div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={styles.methodTitle}>Cash on Delivery (COD)</p>
                          <p style={styles.methodDesc}>Pay in cash/UPI directly during order handover</p>
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-secondary)" />
                    </button>
                  </div>

                  <div style={styles.secureFooter}>
                    <ShieldCheck size={14} color="var(--primary-teal)" />
                    <span>100% Encrypted & Secure Payments</span>
                  </div>
                </div>
              )}

              {paymentStep === 2 && (
                <div>
                  <button onClick={() => setPaymentStep(1)} style={styles.backBtn}>
                    <ArrowLeft size={14} /> Change payment method
                  </button>

                  {method === 'UPI' && (
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>
                        Select UPI Application:
                      </p>

                      <div style={styles.upiGrid}>
                        {['GPAY', 'PHONEPE', 'PAYTM'].map(app => (
                          <button
                            key={app}
                            onClick={() => handleUpiAppClick(app)}
                            style={{
                              ...styles.upiAppBtn,
                              borderColor: upiSub === app ? 'var(--primary-teal)' : 'var(--sky-blue-light)',
                              background: upiSub === app ? 'var(--sky-blue-light)' : '#FFFFFF'
                            }}
                          >
                            <span style={{ fontSize: '20px' }}>
                              {app === 'GPAY' ? '🔵' : app === 'PHONEPE' ? '🟣' : '⚫'}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-navy)' }}>
                              {app === 'GPAY' ? 'Google Pay' : app === 'PHONEPE' ? 'PhonePe' : 'Paytm'}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--sky-blue-light)' }}></div>
                        <span style={{ padding: '0 10px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--sky-blue-light)' }}></div>
                      </div>

                      <button
                        onClick={() => handleUpiAppClick('ID')}
                        style={{
                          ...styles.upiIdHeader,
                          borderColor: upiSub === 'ID' ? 'var(--primary-teal)' : 'var(--sky-blue-light)'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-navy)' }}>
                          Pay using UPI ID
                        </span>
                      </button>

                      {upiSub === 'ID' && (
                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. username@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value.trim())}
                            style={styles.input}
                          />
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (validateUpi()) startPaymentProcessing();
                        }}
                        className="velora-btn velora-btn-primary animate-pulse"
                        style={{ width: '100%', marginTop: '20px', padding: '12px', justifyContent: 'center' }}
                      >
                        Proceed to Pay ₹{totalCost}
                      </button>
                    </div>
                  )}

                  {method === 'RAZORPAY' && (
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>
                        Enter Card Details:
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Card Number</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="1234 5678 9876 5432"
                            value={cardNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                              const formatted = val.replace(/(.{4})/g, '$1 ').trim();
                              setCardNumber(formatted);
                            }}
                            style={styles.input}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Expiry Date</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="MM/YY"
                              value={expiry}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                                if (val.length >= 3) {
                                  setExpiry(val.substring(0, 2) + '/' + val.substring(2));
                                } else {
                                  setExpiry(val);
                                }
                              }}
                              style={styles.input}
                            />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>CVV</label>
                            <input
                              type="password"
                              className="form-control"
                              placeholder="•••"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                              style={styles.input}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Cardholder Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Aarav Mehta"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                            style={styles.input}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (validateCard()) startPaymentProcessing();
                        }}
                        className="velora-btn velora-btn-primary animate-pulse"
                        style={{ width: '100%', marginTop: '20px', padding: '12px', justifyContent: 'center' }}
                      >
                        Pay Securely ₹{totalCost}
                      </button>
                    </div>
                  )}

                  {method === 'COD' && (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                        You are selecting <strong>Cash on Delivery (COD)</strong>.<br />
                        You can pay cash or scan UPI with the rider at the time of delivery.
                      </p>

                      <button
                        onClick={startPaymentProcessing}
                        className="velora-btn velora-btn-primary"
                        style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                      >
                        Confirm Cash on Delivery
                      </button>
                    </div>
                  )}
                </div>
              )}

              {paymentStep === 3 && (
                <div style={styles.loaderContainer}>
                  <Loader2 className="animate-spin" size={40} color="var(--primary-teal)" style={{ marginBottom: '14px' }} />
                  <p style={{ color: 'var(--primary-navy)', fontWeight: 700, fontSize: '14px', margin: 0 }}>
                    {loadingMsg}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '6px', margin: 0 }}>
                    Do not reload this page or close checkout window.
                  </p>
                </div>
              )}

              {paymentStep === 4 && (
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                    We've simulated a bank OTP verification request. Enter the OTP code below to approve the transaction.
                  </p>

                  <div style={styles.otpNoticeBox}>
                    <span style={{ fontSize: '11px', color: 'var(--primary-navy)', fontWeight: 700 }}>
                      💡 Simulated OTP code is <strong>123456</strong>
                    </span>
                  </div>

                  <form onSubmit={handleVerifyOtp}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        style={{ ...styles.input, textAlign: 'center', fontSize: '18px', fontWeight: 800, width: '180px', letterSpacing: '2px' }}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="velora-btn velora-btn-primary"
                      style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                    >
                      Submit OTP Code
                    </button>
                  </form>
                </div>
              )}

              {paymentStep === 5 && (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <svg className="failure-cross" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ width: '80px', height: '80px', marginBottom: '1.25rem' }}>
                    <style>{`
                      .failure-cross .circle {
                        stroke-dasharray: 166;
                        stroke-dashoffset: 166;
                        stroke-width: 3;
                        stroke-miterlimit: 10;
                        stroke: var(--color-error);
                        fill: none;
                        animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                      }
                      .failure-cross .line1 {
                        stroke-dasharray: 48;
                        stroke-dashoffset: 48;
                        stroke-width: 3;
                        stroke: var(--color-error);
                        fill: none;
                        animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
                      }
                      .failure-cross .line2 {
                        stroke-dasharray: 48;
                        stroke-dashoffset: 48;
                        stroke-width: 3;
                        stroke: var(--color-error);
                        fill: none;
                        animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
                      }
                      @keyframes stroke {
                        100% {
                          stroke-dashoffset: 0;
                        }
                      }
                      @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        20%, 60% { transform: translateX(-4px); }
                        40%, 80% { transform: translateX(4px); }
                      }
                      .failure-cross {
                        animation: shake 0.5s ease-in-out 0.9s both;
                      }
                    `}</style>
                    <circle className="circle" cx="26" cy="26" r="25" />
                    <path className="line1" d="M16 16l20 20" />
                    <path className="line2" d="M36 16L16 36" />
                  </svg>
                  
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 8px 0' }}>
                    Payment Failed
                  </h3>
                  <p style={{ color: 'var(--color-error)', fontSize: '13px', maxWidth: '300px', margin: '0 auto 20px auto', lineHeight: '1.45', fontWeight: 600 }}>
                    {error || 'Something went wrong while processing your payment.'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                    <button
                      onClick={() => {
                        setError('');
                        setPaymentStep(1);
                      }}
                      className="velora-btn velora-btn-primary"
                      style={{ flex: 1, maxWidth: '160px', justifyContent: 'center' }}
                    >
                      Retry Payment
                    </button>
                    <button
                      onClick={handleClose}
                      className="velora-btn velora-btn-secondary"
                      style={{ flex: 1, maxWidth: '160px', justifyContent: 'center' }}
                    >
                      Pay Later
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ width: '80px', height: '80px', marginBottom: '1.25rem' }}>
                <style>{`
                  .success-checkmark .circle {
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    stroke-width: 3;
                    stroke-miterlimit: 10;
                    stroke: var(--color-success);
                    fill: none;
                    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                  }
                  .success-checkmark .check {
                    transform-origin: 50% 50%;
                    stroke-dasharray: 48;
                    stroke-dashoffset: 48;
                    stroke-width: 3;
                    stroke: var(--color-success);
                    fill: none;
                    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
                  }
                  @keyframes stroke {
                    100% {
                      stroke-dashoffset: 0;
                    }
                  }
                  @keyframes scale {
                    0%, 100% {
                      transform: none;
                    }
                    50% {
                      transform: scale3d(1.1, 1.1, 1);
                    }
                  }
                  .success-checkmark {
                    animation: scale 0.3s ease-in-out 0.9s both;
                  }
                `}</style>
                <circle className="circle" cx="26" cy="26" r="25" />
                <path className="check" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
              <VeloraMascot state="celebrating" size={110} style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '12px 0 6px 0' }}>
                {method === 'COD' ? 'Order Placed & COD Confirmed!' : 'Order Placed & Paid Successfully!'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '13px', maxWidth: '340px', lineHeight: 1.4 }}>
                {method === 'COD'
                  ? `Your order is confirmed as Cash on Delivery. Please pay ₹${totalCost} upon handover.`
                  : `Fulfillment payment of ₹${totalCost} processed successfully. Your laundry partner will review and accept your items shortly.`}
              </p>
              <button onClick={handleClose} className="velora-btn velora-btn-primary">
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
      {showWarningModal && pendingPartner && (
        <div style={styles.warningOverlay}>
          <div className="velora-card animate-scaleIn" style={styles.warningModal}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <VeloraMascot state="thinking" size={100} style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '8px 0 12px 0' }}>
                {pendingPartner.openStatus === 'CLOSED' ? '🚫 Partner Currently Closed' : '⚠️ Tomorrow Delivery Notice'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px auto' }}>
                {pendingPartner.openStatus === 'CLOSED' ? (
                  <>
                    This partner is currently closed.<br />
                    <strong>Next Available Slot:</strong> {pendingPartner.nextAvailableSlot}<br />
                    <strong>Estimated Delivery:</strong> {pendingPartner.earliestDeliveryTime}
                  </>
                ) : (
                  <>
                    This partner cannot complete the order today.<br />
                    <strong>Estimated Delivery:</strong> {pendingPartner.earliestDeliveryTime}
                  </>
                )}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPartner(pendingPartner);
                    setShowWarningModal(false);
                    setPendingPartner(null);
                  }}
                  className="velora-btn velora-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Continue with this Partner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWarningModal(false);
                    setPendingPartner(null);
                  }}
                  className="velora-btn velora-btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  View Other Partners
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  modeTabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    background: 'var(--bg-secondary)',
    border: '2px solid var(--sky-blue-light)',
    borderRadius: '16px',
    padding: '4px',
  },
  modeTab: {
    flex: 1,
    padding: '10px 14px',
    border: 'none',
    background: 'transparent',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif',
  },
  modeTabActive: {
    background: 'var(--primary-teal)',
    color: '#FFFFFF',
    boxShadow: 'var(--shadow-sm)',
  },
  autoMatchCard: {
    border: '2px dashed var(--sky-blue)',
    borderRadius: '24px',
    padding: '24px',
    background: 'var(--bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(47, 65, 86, 0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
    padding: '20px',
  },
  warningModal: {
    width: '100%',
    maxWidth: '420px',
    padding: '2rem',
    borderRadius: '24px',
    background: '#FFFFFF',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid var(--sky-blue-light)',
  },
  orderSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    background: 'var(--bg-primary)',
    padding: '14px 16px',
    borderRadius: '16px',
    marginBottom: '20px',
    border: '1px solid var(--sky-blue-light)'
  },
  methodBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '14px 16px',
    background: '#FFFFFF',
    border: '2px solid var(--sky-blue-light)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    outline: 'none'
  },
  methodIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: 'var(--sky-blue-light)',
    borderRadius: '10px',
  },
  methodTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--primary-navy)',
    margin: '0 0 2px 0'
  },
  methodDesc: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
    margin: 0
  },
  secureFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginTop: '20px',
    fontWeight: 600
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary-teal)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 700,
    padding: 0,
    marginBottom: '16px',
    outline: 'none'
  },
  upiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  upiAppBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 6px',
    borderRadius: '16px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    gap: '4px'
  },
  upiIdHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '10px',
    borderRadius: '16px',
    border: '2px solid',
    cursor: 'pointer',
    outline: 'none',
    background: '#FFFFFF'
  },
  loaderContainer: {
    textAlign: 'center',
    padding: '2rem 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  otpNoticeBox: {
    background: 'var(--color-warning-light)',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid var(--color-warning)',
    textAlign: 'center'
  },
};
