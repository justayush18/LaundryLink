import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Truck, ShieldCheck, Loader2, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { api, getFriendlyErrorMessage } from '../../services/api';

export default function CheckoutModal({ isOpen, onClose, orderId, totalCost, onPaymentComplete }) {
  const [method, setMethod] = useState(''); // 'UPI' | 'RAZORPAY' | 'COD'
  const [upiSub, setUpiSub] = useState(''); // 'GPAY' | 'PHONEPE' | 'PAYTM' | 'ID'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState(1); // 1: Select Method, 2: Details/Input, 3: Processing Loader, 4: OTP Screen (Razorpay), 5: Success Screen, 6: Failed Screen
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePayment, setActivePayment] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (isOpen) {
      setMethod('');
      setUpiSub('');
      setUpiId('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardName('');
      setOtp('');
      setStep(1);
      setLoadingMsg('');
      setError('');
      setSubmitting(false);
      setActivePayment(null);
      setTimeLeft(60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === 1) {
      setTimeLeft(60);
    }
  }, [isOpen, step]);

  useEffect(() => {
    let timer;
    if (isOpen && step >= 1 && step <= 4) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setError('Payment session timed out. Please try again.');
            setStep(6); // Step 6 is Failed Screen
            setSubmitting(false);
            setLoadingMsg('');
            
            if (activePayment) {
              api.payments.process(activePayment.paymentId, { simulateSuccess: false })
                .catch(err => console.error("Failed to mark payment as failed on timeout:", err));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, step, activePayment]);

  const handleCancelPayment = async () => {
    if (window.confirm("Are you sure you want to cancel the payment? Your order has been placed and will remain unpaid. You can complete the payment later from your dashboard.")) {
      if (activePayment) {
        try {
          await api.payments.process(activePayment.paymentId, { simulateSuccess: false });
        } catch (err) {
          console.error("Failed to cancel payment in backend:", err);
        }
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSelectMethod = (selected) => {
    setMethod(selected);
    setError('');
    if (selected === 'COD') {
      setStep(2); // COD doesn't need input, just go to confirmation step
    } else {
      setStep(2);
    }
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
    setStep(3);

    try {
      // 1. Initiate payment in backend
      setLoadingMsg('Initiating secure payment request...');
      const payment = await api.payments.initiate({ orderId, paymentMethod: method });
      setActivePayment(payment);

      if (method === 'COD') {
        setLoadingMsg('Registering Cash on Delivery option...');
        await new Promise(r => setTimeout(r, 1500));
        setStep(5); // COD goes directly to success
      } else if (method === 'UPI') {
        setLoadingMsg('Waiting for approval in your UPI app...');
        await new Promise(r => setTimeout(r, 2000));
        
        // Process UPI payment
        const txnId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await api.payments.process(payment.paymentId, { transactionId: txnId, simulateSuccess: true });
        
        setStep(5);
      } else if (method === 'RAZORPAY') {
        setLoadingMsg('Contacting payment gateway...');
        await new Promise(r => setTimeout(r, 1500));
        setLoadingMsg('Generating bank OTP verification request...');
        await new Promise(r => setTimeout(r, 1000));
        setStep(4); // Card goes to OTP verification step
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setStep(6);
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
    setStep(3);
    setLoadingMsg('Verifying OTP secure credentials...');

    try {
      await new Promise(r => setTimeout(r, 1500));
      const txnId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      await api.payments.process(activePayment.paymentId, { transactionId: txnId, simulateSuccess: true });
      setStep(5);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setStep(6);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="velora-card animate-fadeInUp" style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>💳</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              Fulfillment Checkout
            </h2>
          </div>
          {step !== 3 && step !== 5 && step !== 6 && (
            <button onClick={onClose} style={styles.closeBtn}>
              <X size={20} />
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-error animate-pulse" style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '14px', fontSize: '12px' }}>
            {error}
          </div>
        )}

        {step < 5 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-warning-light)', padding: '10px 14px', borderRadius: '14px', marginBottom: '14px', border: '1px solid var(--color-warning)' }}>
            <span style={{ fontSize: '12px', color: 'var(--primary-navy)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⏱️ Payment session expires in:
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: timeLeft <= 15 ? 'var(--color-error)' : 'var(--primary-navy)' }} className={timeLeft <= 15 ? 'animate-pulse' : ''}>
              {timeLeft}s
            </span>
          </div>
        )}

        {/* Step 1: Select Method */}
        {step === 1 && (
          <div>
            <div style={styles.orderSummary}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0' }}>ORDER ID</p>
                <p style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                  #{orderId.substring(0, 7).toUpperCase()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0' }}>TOTAL AMOUNT</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-teal)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                  ₹{totalCost}
                </p>
              </div>
            </div>

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

            <button
              onClick={handleCancelPayment}
              className="velora-btn velora-btn-secondary"
              style={{ width: '100%', marginTop: '16px', justifyContent: 'center', border: '2px solid var(--color-error-light)', color: 'var(--color-error)' }}
            >
              Cancel Payment & Pay Later
            </button>
          </div>
        )}

        {/* Step 2: Input Details */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} style={styles.backBtn}>
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
                  style={{ width: '100%', marginTop: '20px', padding: '12px' }}
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
                  style={{ width: '100%', marginTop: '20px', padding: '12px' }}
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
                  style={{ width: '100%', padding: '12px' }}
                >
                  Confirm Cash on Delivery
                </button>
              </div>
            )}

            <button
              onClick={handleCancelPayment}
              className="velora-btn velora-btn-secondary"
              style={{ width: '100%', marginTop: '14px', justifyContent: 'center', border: '2px solid var(--color-error-light)', color: 'var(--color-error)' }}
            >
              Cancel Payment & Pay Later
            </button>
          </div>
        )}

        {/* Step 3: Processing Loader */}
        {step === 3 && (
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

        {/* Step 4: OTP Verification Screen (Razorpay Card Payment) */}
        {step === 4 && (
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
                style={{ width: '100%', padding: '12px' }}
              >
                Submit OTP Code
              </button>
            </form>

            <button
              type="button"
              onClick={handleCancelPayment}
              className="velora-btn velora-btn-secondary"
              style={{ width: '100%', marginTop: '14px', justifyContent: 'center', border: '2px solid var(--color-error-light)', color: 'var(--color-error)' }}
            >
              Cancel Payment & Pay Later
            </button>
          </div>
        )}

        {/* Step 5: Success Screen */}
        {step === 5 && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle2 size={56} color="var(--color-success)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', fontFamily: 'Outfit, sans-serif', margin: '0 0 6px 0' }}>
              {method === 'COD' ? 'COD Booking Confirmed!' : 'Payment Successful!'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '300px', margin: '0 auto 20px auto', lineHeight: '1.45' }}>
              {method === 'COD' 
                ? 'Your order is confirmed as Cash on Delivery. Please pay ₹' + totalCost + ' upon handover.'
                : 'Fulfillment payment of ₹' + totalCost + ' processed successfully. Receipt generated.'}
            </p>
            <button
              onClick={() => {
                onClose();
                onPaymentComplete();
              }}
              className="velora-btn velora-btn-primary"
              style={{ width: '100%', maxWidth: '200px' }}
            >
              Done
            </button>
          </div>
        )}

        {/* Step 6: Payment Failed Screen */}
        {step === 6 && (
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
                  setStep(1);
                }}
                className="velora-btn velora-btn-primary"
                style={{ flex: 1, maxWidth: '160px', justifyContent: 'center' }}
              >
                Retry Payment
              </button>
              <button
                onClick={onClose}
                className="velora-btn velora-btn-secondary"
                style={{ flex: 1, maxWidth: '160px', justifyContent: 'center' }}
              >
                Pay Later
              </button>
            </div>
          </div>
        )}
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
    zIndex: 3000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    padding: '2rem',
    background: '#FFFFFF',
    border: '1px solid var(--sky-blue-light)',
    borderRadius: '24px',
    boxShadow: 'var(--shadow-xl)',
    display: 'flex',
    flexDirection: 'column',
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
  input: {
    borderRadius: '14px',
    border: '2px solid var(--sky-blue)',
    background: 'var(--bg-secondary)',
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--primary-navy)',
    outline: 'none',
    width: '100%'
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
  }
};
