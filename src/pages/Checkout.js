import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Checkout.css';

const COUNTRIES = [
  { value: 'India',          label: '🇮🇳 India',          currency: 'INR', zone: 'india' },
  { value: 'United States',  label: '🇺🇸 United States',  currency: 'USD', zone: 'usa' },
  { value: 'United Kingdom', label: '🇬🇧 United Kingdom', currency: 'GBP', zone: 'uk' },
  { value: 'Singapore',      label: '🇸🇬 Singapore',      currency: 'SGD', zone: 'singapore' },
  { value: 'Australia',      label: '🇦🇺 Australia',      currency: 'AUD', zone: 'australia' },
  { value: 'Malaysia',       label: '🇲🇾 Malaysia',       currency: 'MYR', zone: 'malaysia' },
];

function parseWeightGrams(w) {
  if (!w) return 500;
  if (String(w).endsWith('kg')) return parseFloat(w) * 1000;
  if (String(w).endsWith('g'))  return parseFloat(w);
  return 500;
}

function formatWeight(grams) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
  return `${grams}g`;
}


const STEPS = ['Address', 'Shipping', 'Payment', 'Review'];

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount, message }

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [upiPayment, setUpiPayment] = useState(null); // { order, upiUrl, qrCodeUrl, vpa, payeeName, amount, reference }
  const [upiTxnRef, setUpiTxnRef] = useState('');
  const [upiPayerVpa, setUpiPayerVpa] = useState('');
  const [upiClaiming, setUpiClaiming] = useState(false);

  // Address search (Nominatim / OpenStreetMap)
  const [addrQuery, setAddrQuery] = useState('');
  const [addrSuggestions, setAddrSuggestions] = useState([]);
  const [addrSearchLoading, setAddrSearchLoading] = useState(false);
  const [addrDropdownOpen, setAddrDropdownOpen] = useState(false);

  // Live rate state
  const [liveRates, setLiveRates] = useState(null);     // null = not yet fetched, [] = API failed
  const [liveRatesLoading, setLiveRatesLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const countryConfig = COUNTRIES.find(c => c.value === address.country) || COUNTRIES[0];
  const isIndia = countryConfig.zone === 'india';
  const isFreeShipping = isIndia && subtotal >= 999;

  // Total estimated shipment weight from cart items
  const totalWeightGrams = items.reduce((sum, i) => sum + parseWeightGrams(i.weight) * (i.quantity || 1), 0);

  // shippingCost is only known once a service is selected
  const shippingConfirmed = selectedService !== null || isFreeShipping;
  const shippingCost = !shippingConfirmed ? null
    : isFreeShipping ? 0
    : selectedService.total;
  const discountAmount = appliedCoupon?.discount || 0;
  const total = subtotal - discountAmount + (shippingCost ?? 0);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim().toUpperCase(),
        subtotal,
        userId: user?._id
      });
      if (res.data.success) {
        setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discount: res.data.discount, message: res.data.message });
        toast.success(`Coupon applied! You save ₹${res.data.discount}`);
      } else {
        toast.error(res.data.message || 'Invalid coupon');
      }
    } catch(e) {
      toast.error(e.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const fetchLiveRates = () => {
    if (!address.pincode) return;
    setLiveRates(null);
    setSelectedService(null);
    setLiveRatesLoading(true);
    api.post('/shipping/rate', {
      pincode: address.pincode,
      country: address.country,
      items: items.map(i => ({ productId: i.productId, weight: i.weight, quantity: i.quantity })),
    })
      .then(r => {
        const svcs = r.data.services || [];
        setLiveRates(svcs);
        if (svcs.length > 0) setSelectedService(svcs[0]);
      })
      .catch(() => setLiveRates([]))
      .finally(() => setLiveRatesLoading(false));
  };

  // Fetch rates whenever pincode/country changes — works on any step, debounced 600ms
  useEffect(() => {
    const minLength = isIndia ? 6 : 3;
    if (!address.pincode || address.pincode.length < minLength) return;
    const timer = setTimeout(fetchLiveRates, 600);
    return () => clearTimeout(timer);
  }, [address.pincode, address.country]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load Razorpay checkout script once
  useEffect(() => {
    if (window.Razorpay) return;
    if (document.getElementById('razorpay-checkout-js')) return;
    const s = document.createElement('script');
    s.id = 'razorpay-checkout-js';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const handleAddressChange = e => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Nominatim address search
  useEffect(() => {
    if (addrQuery.length < 4) { setAddrSuggestions([]); return; }
    const timer = setTimeout(() => {
      setAddrSearchLoading(true);
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addrQuery)}&format=json&addressdetails=1&limit=6&accept-language=en`)
        .then(r => r.json())
        .then(data => { setAddrSuggestions(data); setAddrDropdownOpen(true); })
        .catch(() => setAddrSuggestions([]))
        .finally(() => setAddrSearchLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [addrQuery]);

  const applyAddrSuggestion = (place) => {
    const a = place.address || {};
    const countryName = a.country || '';
    const matched = COUNTRIES.find(c => c.value.toLowerCase() === countryName.toLowerCase());
    const road = [a.house_number, a.road].filter(Boolean).join(' ');
    const line2 = [a.suburb, a.neighbourhood, a.quarter].filter(Boolean)[0] || '';
    const city = a.city || a.town || a.village || a.municipality || '';
    const state = a.state || a.county || '';
    const pincode = a.postcode || '';
    setAddress(prev => ({
      ...prev,
      ...(road && { line1: road }),
      ...(line2 && { line2 }),
      ...(city && { city }),
      ...(state && { state }),
      ...(pincode && { pincode }),
      ...(matched && { country: matched.value }),
    }));
    setAddrQuery('');
    setAddrSuggestions([]);
    setAddrDropdownOpen(false);
  };

  const validateAddress = () => {
    const required = ['fullName', 'email', 'phone', 'line1', 'city', 'country'];
    if (isIndia) required.push('pincode', 'state');
    for (const field of required) {
      if (!address[field]?.trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const placeOrder = async () => {
    setProcessing(true);
    try {
      // 1. Create order
      const orderRes = await api.post('/orders', {
        items: items.map(i => ({ productId: i.productId, weight: i.weight, quantity: i.quantity })),
        shippingAddress: address,
        shippingCost: shippingCost ?? 0,
        shippingMethod: 'Avakaaya.com Delivery',
        subtotal,
        total: subtotal - discountAmount + (shippingCost ?? 0),
        currency: 'INR',
        paymentMethod,
        couponCode: appliedCoupon?.code,
        discount: discountAmount,
        guestEmail: !user ? address.email : undefined
      });

      const order = orderRes.data.order;

      if (paymentMethod === 'cod') {
        clearCart();
        navigate(`/order/success?orderId=${order._id}&orderNumber=${order.orderNumber}`);
        return;
      }

      if (paymentMethod === 'upi') {
        const upiRes = await api.post('/payment/upi/initiate', {
          orderId: order._id,
          amount: total,
        });
        setUpiPayment({ order, ...upiRes.data });
        return;
      }

      // 2. Create Razorpay order (ICICI bank gateway)
      const payRes = await api.post('/payment/create-order', {
        orderId: order._id,
        amount: total,
        currency: 'INR'
      });

      if (payRes.data.mock) {
        // Dev mode: simulate payment
        await api.post('/payment/verify', {
          razorpay_order_id: payRes.data.order.id,
          razorpay_payment_id: 'mock_pay_' + Date.now(),
          razorpay_signature: 'mock_sig',
          orderId: order._id
        });
        clearCart();
        navigate(`/order/success?orderId=${order._id}&orderNumber=${order.orderNumber}`);
        return;
      }

      // 3. Open Razorpay payment dialog (real mode)
      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh.');
        return;
      }

      const rzp = new Razorpay({
        key: payRes.data.keyId,
        amount: payRes.data.order.amount,
        currency: 'INR',
        name: 'Avakaaya Foods',
        description: `Order #${order.orderNumber}`,
        order_id: payRes.data.order.id,
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
          paylater: false,
          emi: false,
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI',
                instruments: [{ method: 'upi' }],
              },
            },
            sequence: ['block.upi'],
            preferences: { show_default_blocks: false },
          },
        },
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone
        },
        theme: { color: '#1a2e1a' },
        handler: async (response) => {
          await api.post('/payment/verify', {
            ...response,
            orderId: order._id
          });
          clearCart();
          navigate(`/order/success?orderId=${order._id}&orderNumber=${order.orderNumber}`);
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled. Your order is saved — you can retry.');
          }
        }
      });

      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const claimUpiPayment = async () => {
    if (!upiTxnRef.trim()) {
      toast.error('Enter the UPI transaction reference shown in your UPI app');
      return;
    }
    setUpiClaiming(true);
    try {
      await api.post('/payment/upi/claim', {
        orderId: upiPayment.order._id,
        upiTxnRef: upiTxnRef.trim(),
        payerVpa: upiPayerVpa.trim() || undefined,
      });
      clearCart();
      toast.success('Thanks! We\'ll verify your payment and confirm the order shortly.');
      navigate(`/order/success?orderId=${upiPayment.order._id}&orderNumber=${upiPayment.order.orderNumber}&pendingVerification=1`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record payment claim. Try again.');
    } finally {
      setUpiClaiming(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied`);
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page">

      <div className="container">
        <h1 className="checkout-title">Checkout</h1>

        {/* Step indicator */}
        <div className="checkout-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-num">{i < step ? '✓' : i + 1}</div>
              <span className="step-label">{s}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          {/* Left: Form */}
          <div className="checkout-form-area">

            {/* Step 0: Address */}
            {step === 0 && (
              <div className="checkout-card">
                <h2 className="checkout-card-title">Delivery Address</h2>

                <div className="addr-search-wrap">
                  <div className="addr-search-input-row">
                    <span className="addr-search-icon">🔍</span>
                    <input
                      className="addr-search-input"
                      type="text"
                      placeholder="Search address to auto-fill…"
                      value={addrQuery}
                      onChange={e => setAddrQuery(e.target.value)}
                      onFocus={() => addrSuggestions.length > 0 && setAddrDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setAddrDropdownOpen(false), 180)}
                      autoComplete="off"
                    />
                    {addrSearchLoading && <span className="shipping-spinner addr-search-spinner" />}
                  </div>
                  {addrDropdownOpen && addrSuggestions.length > 0 && (
                    <ul className="addr-suggestions">
                      {addrSuggestions.map((p, i) => (
                        <li key={i} onMouseDown={() => applyAddrSuggestion(p)} className="addr-suggestion-item">
                          <span className="addr-suggestion-icon">📍</span>
                          <span>{p.display_name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="form-group">
                  <label>Country *</label>
                  <select name="country" value={address.country} onChange={handleAddressChange} className="form-select">
                    {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input name="fullName" value={address.fullName} onChange={handleAddressChange} className="form-input" placeholder="As on delivery ID" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input name="email" type="email" value={address.email} onChange={handleAddressChange} className="form-input" placeholder="For order updates" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone / WhatsApp *</label>
                  <input name="phone" value={address.phone} onChange={handleAddressChange} className="form-input" placeholder="+91 for India, +1 for USA, etc." />
                </div>

                <div className="form-group">
                  <label>Address Line 1 *</label>
                  <input name="line1" value={address.line1} onChange={handleAddressChange} className="form-input" placeholder="House/Flat No., Street" />
                </div>

                <div className="form-group">
                  <label>Address Line 2</label>
                  <input name="line2" value={address.line2} onChange={handleAddressChange} className="form-input" placeholder="Apartment, area, landmark (optional)" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input name="city" value={address.city} onChange={handleAddressChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>State / Province</label>
                    <input name="state" value={address.state} onChange={handleAddressChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>{isIndia ? 'PIN Code *' : 'ZIP / Postal Code'}</label>
                    <input name="pincode" value={address.pincode} onChange={handleAddressChange} className="form-input" />
                  </div>
                </div>

                {/* Live shipping preview */}
                {liveRatesLoading && (
                  <div className="addr-shipping-preview addr-shipping-preview--loading">
                    <span className="shipping-spinner" />
                    Checking shipping rates…
                  </div>
                )}
                {!liveRatesLoading && liveRates && liveRates.length > 0 && (() => {
                  const svc = liveRates[0];
                  const cost = isFreeShipping ? 0 : svc.total;
                  return (
                    <div className="addr-shipping-preview">
                      <span className="addr-shipping-icon">🚚</span>
                      <div className="addr-shipping-info">
                        <strong>Avakaaya.com Delivery</strong>
                        <span>{svc.displayDays ? `${svc.displayDays} days` : (isIndia ? '3-5 business days' : '7-14 business days')}</span>
                      </div>
                      <span className="addr-shipping-cost">
                        {cost === 0
                          ? <>{isFreeShipping && <s style={{ color: '#999', fontSize: '0.85em', marginRight: 4 }}>₹{svc.total.toLocaleString()}</s>}<span style={{ color: '#2e7d32', fontWeight: 700 }}>FREE</span></>
                          : `₹${cost.toLocaleString()}`}
                      </span>
                    </div>
                  );
                })()}
                {!liveRatesLoading && liveRates && liveRates.length === 0 && (
                  <div className="addr-shipping-preview addr-shipping-preview--error">
                    ⚠️ Could not fetch rates for this pincode
                  </div>
                )}

                <button
                  className="btn btn-primary btn-lg checkout-next-btn"
                  onClick={() => validateAddress() && setStep(1)}
                >
                  Continue to Shipping →
                </button>
              </div>
            )}

            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="checkout-card">
                <h2 className="checkout-card-title">Shipping Method</h2>
                <div className="shipping-to-row">
                  <span>Shipping to: <strong>{address.city}, {address.country}</strong></span>
                  <div className="shipping-pincode-edit">
                    <label>{isIndia ? 'PIN Code' : 'ZIP / Postal Code'}</label>
                    <input
                      className="pincode-input"
                      value={address.pincode}
                      onChange={e => setAddress(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder={isIndia ? '6-digit PIN' : 'Postal code'}
                    />
                  </div>
                </div>

                <div className="shipping-weight-info">
                  📦 Estimated shipment weight: <strong>{formatWeight(totalWeightGrams)}</strong>
                </div>

                <div className="shipping-options">
                  {liveRatesLoading ? (
                    <div className="shipping-fetching">
                      <span className="shipping-spinner" />
                      Fetching live shipping rates…
                    </div>
                  ) : isFreeShipping ? (
                    <div className="shipping-free-note">
                      🎉 Your order qualifies for <strong>free shipping</strong> (orders above ₹999 within India)
                    </div>
                  ) : selectedService ? (
                    <div className="addr-shipping-preview">
                      <span className="addr-shipping-icon">🚚</span>
                      <div className="addr-shipping-info">
                        <strong>Avakaaya.com Delivery</strong>
                        <span>{selectedService.displayDays ? `${selectedService.displayDays} days` : (isIndia ? '3-5 business days' : '7-14 business days')} · Tracked delivery</span>
                        <span className="shipping-rate-breakdown">₹{selectedService.amount.toFixed(2)} + ₹{selectedService.tax.toFixed(2)} GST</span>
                      </div>
                      <span className="addr-shipping-cost">₹{selectedService.total.toLocaleString()}</span>
                    </div>
                  ) : liveRates !== null ? (
                    <div className="shipping-error">
                      <p>Could not fetch shipping rates for this pincode. Please check the pincode or try again.</p>
                      <button className="btn btn-outline btn-sm" onClick={fetchLiveRates}>↺ Retry</button>
                    </div>
                  ) : null}
                </div>

                {!isIndia && (
                  <div className="customs-note">
                    <strong>📦 International Shipping Note:</strong> All pickles are packed in compliance with food safety and customs regulations. Delivery times may vary due to customs clearance. Import duties (if any) are the responsibility of the recipient.
                  </div>
                )}

                <div className="checkout-step-btns">
                  <button className="btn btn-outline" onClick={() => setStep(0)}>← Back</button>
                  <button
                    className="btn btn-primary btn-lg"
                    disabled={liveRatesLoading || (!isFreeShipping && !selectedService)}
                    onClick={() => setStep(2)}
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="checkout-card">
                <h2 className="checkout-card-title">Payment Method</h2>

                <div className="payment-options">
                  <label className="payment-option active">
                    <input type="radio" name="payment" value="razorpay" checked readOnly />
                    <div className="payment-option-info">
                      <strong>📱 UPI</strong>
                      <span>Pay via GPay · PhonePe · Paytm · BHIM · any UPI app · Secured by Razorpay</span>
                    </div>
                  </label>
                </div>

                <div className="payment-security-note">
                  🔒 Payment is auto-verified the moment your UPI app confirms the transfer.
                </div>


                <div className="checkout-step-btns">
                  <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Review Order →</button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="checkout-card">
                <h2 className="checkout-card-title">Review & Confirm</h2>

                <div className="review-section">
                  <div className="review-row">
                    <span className="review-key">Delivering to</span>
                    <span className="review-val">
                      {address.fullName}, {address.line1}, {address.city}, {address.country} {address.pincode}
                    </span>
                    <button className="review-edit" onClick={() => setStep(0)}>Edit</button>
                  </div>
                  <div className="review-row">
                    <span className="review-key">Shipping</span>
                    <span className="review-val">
                      {selectedService ? 'Avakaaya.com Delivery' : 'Avakaaya.com Delivery'}
                      {shippingCost === 0 && shippingConfirmed && <span style={{ color: '#2e7d32', marginLeft: 8 }}>FREE</span>}
                    </span>
                    <button className="review-edit" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <div className="review-row">
                    <span className="review-key">Payment</span>
                    <span className="review-val">{
                      paymentMethod === 'cod' ? 'Cash on Delivery'
                      : paymentMethod === 'upi' ? 'UPI (Direct)'
                      : 'UPI (via Razorpay)'
                    }</span>
                    <button className="review-edit" onClick={() => setStep(2)}>Edit</button>
                  </div>
                </div>

                <div className="checkout-items-preview">
                  {items.map(item => (
                    <div key={`${item.productId}_${item.weight}`} className="checkout-item-row">
                      <img src={item.thumbnail} alt={item.name} className="checkout-item-img" />
                      <span className="checkout-item-name">{item.name}</span>
                      <span className="checkout-item-weight">{item.weight}</span>
                      <span className="checkout-item-qty">×{item.quantity}</span>
                      <span className="checkout-item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="checkout-step-btns">
                  <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn btn-gold btn-lg"
                    onClick={placeOrder}
                    disabled={processing}
                  >
                    {processing ? '⏳ Processing...' : `Place Order · ₹${total.toLocaleString()}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order summary */}
          <div className="checkout-summary">
            <h3>Order Summary</h3>
            {items.map(item => (
              <div key={`${item.productId}_${item.weight}`} className="summary-item">
                <img src={item.thumbnail} alt={item.name} className="summary-item-img" />
                <div className="summary-item-info">
                  <span className="summary-item-name">{item.name}</span>
                  <span className="summary-item-meta">{item.weight} × {item.quantity}</span>
                </div>
                <span className="summary-item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            {/* Coupon code */}
            <div className="coupon-section">
              {appliedCoupon ? (
                <div className="coupon-applied">
                  <span>🎟️ {appliedCoupon.code} applied</span>
                  <button className="coupon-remove" onClick={() => setAppliedCoupon(null)}>✕</button>
                </div>
              ) : (
                <div className="coupon-row">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="coupon-input"
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  />
                  <button className="btn btn-outline btn-sm" onClick={applyCoupon} disabled={couponLoading}>
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
            <div className="summary-divider" />
            <div className="summary-line">
              <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="summary-line summary-line--green">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-line">
              <span>Shipping</span>
              <span>
                {shippingCost === null ? '—'
                  : shippingCost === 0 ? <span style={{ color: '#2e7d32' }}>FREE</span>
                  : `₹${shippingCost.toLocaleString()}`}
              </span>
            </div>
            <div className="summary-total">
              <strong>Total</strong>
              <strong>{shippingCost === null ? '—' : `₹${total.toLocaleString()}`}</strong>
            </div>
          </div>
        </div>
      </div>

      {upiPayment && (
        <div className="upi-modal-overlay" role="dialog" aria-modal="true">
          <div className="upi-modal">
            <div className="upi-modal-header">
              <h2>Pay via UPI</h2>
              <button
                className="upi-modal-close"
                onClick={() => setUpiPayment(null)}
                aria-label="Close"
              >✕</button>
            </div>

            <div className="upi-modal-body">
              <p className="upi-modal-amount">
                Amount: <strong>₹{upiPayment.amount}</strong>
              </p>
              <p className="upi-modal-ref">
                Reference: <code>{upiPayment.reference}</code>
              </p>

              <div className="upi-qr-wrap">
                <img src={upiPayment.qrCodeUrl} alt="UPI QR" className="upi-qr" />
                <p className="upi-qr-hint">Scan with any UPI app</p>
              </div>

              <div className="upi-or">— or —</div>

              <div className="upi-deeplink-row">
                <a href={upiPayment.upiUrl} className="btn btn-primary btn-block">
                  Open in UPI app
                </a>
                <p className="upi-hint">Works on mobile. Returns you here after payment.</p>
              </div>

              <div className="upi-vpa-row">
                <div>
                  <div className="upi-vpa-label">UPI ID</div>
                  <div className="upi-vpa-value">{upiPayment.vpa}</div>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => copyToClipboard(upiPayment.vpa, 'UPI ID')}
                >Copy</button>
              </div>

              <div className="upi-claim">
                <h3>After paying, confirm here</h3>
                <p className="upi-claim-hint">
                  Enter the transaction reference / UTR shown in your UPI app.
                  We&apos;ll verify and confirm your order shortly.
                </p>
                <input
                  type="text"
                  className="upi-input"
                  placeholder="UPI transaction reference / UTR"
                  value={upiTxnRef}
                  onChange={e => setUpiTxnRef(e.target.value)}
                />
                <input
                  type="text"
                  className="upi-input"
                  placeholder="Your UPI ID (optional)"
                  value={upiPayerVpa}
                  onChange={e => setUpiPayerVpa(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-lg btn-block"
                  disabled={upiClaiming}
                  onClick={claimUpiPayment}
                >
                  {upiClaiming ? 'Submitting…' : 'I have paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
