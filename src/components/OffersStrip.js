import { useCart } from '../context/CartContext';
import '../components/CouponOffers.css';
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './OffersStrip.css';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const headline = (coupon) => (coupon.type === 'percent'
  ? `${Number(coupon.value)}% OFF`
  : `${money(coupon.value)} OFF`);

// The condition line under the headline. Built from the coupon's own fields so
// it can never advertise a threshold the checkout won't honour.
const condition = (coupon) => {
  const min = Number(coupon.minOrder) || 0;
  const cap = Number(coupon.maxDiscount) || 0;
  if (min > 0) return `on orders above ${money(min)}`;
  if (coupon.type === 'percent' && cap > 0) return `up to ${money(cap)} off`;
  return 'on all products';
};

// "Best offers for you" — live coupons as tear-off tickets with a copy button.
// Codes come from /api/coupons/active, which already hides expired coupons and
// ones that have hit their usage limit.
//
// `onLoaded` reports whether there is anything to show, once the server has
// answered. The homepage keeps a column for this strip and needs to know
// whether to give that space back — it cannot tell that from a component that
// renders nothing both while it is asking and when the answer is "none".
const OffersStrip = ({ onLoaded, cartSubtotal }) => {
  const { appliedCoupon, couponLoading, setSelectedCouponCode, savings } = useCart();
  const [coupons, setCoupons] = useState([]);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const report = (list) => {
      if (cancelled) return;
      setCoupons(list);
      if (onLoaded) onLoaded(list.length > 0);
    };
    api.get('/coupons/active')
      .then((r) => report(cartSubtotal === undefined ? (r.data.coupons || []).slice(0, 3) : (r.data.coupons || [])))
      .catch(() => report([]));
    return () => { cancelled = true; };
    // Asked once per mount — a callback that changes identity must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!coupons.length && cartSubtotal === undefined) return null;

  const copy = (code) => {
    if (!navigator.clipboard) { toast.error('Copy is not available in this browser'); return; }
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopied(code);
        toast.success(`Code ${code} copied`);
        setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
      })
      .catch(() => toast.error('Could not copy the code'));
  };

  if (cartSubtotal !== undefined) return (
    <section className="cart-coupon-section" aria-label="Available coupons">
      <h3>Offers & savings</h3>
      <p>Choose one coupon for extra savings.</p>
      {(savings > 0 || appliedCoupon?.discount > 0) && <p className="cart-offer-savings" aria-live="polite">You save {money(savings + (appliedCoupon?.discount || 0))} on products{appliedCoupon ? ' and your coupon' : ''}. Shipping savings are confirmed at checkout.</p>}
      <ul className="coupon-offers">
        {coupons.map(coupon => {
          const min = Number(coupon.minOrder) || 0;
          const cap = Number(coupon.maxDiscount) || 0;
          const short = Math.max(0, min - cartSubtotal);
          const raw = coupon.type === 'percent' ? cartSubtotal * Number(coupon.value) / 100 : Number(coupon.value);
          const saving = Math.round(Math.min(cartSubtotal, raw, cap > 0 ? cap : raw));
          return <li key={coupon.code} className={`coupon-offer${short ? ' is-locked' : ''}${appliedCoupon?.code === coupon.code ? ' is-on' : ''}`}>
            <div className="coupon-offer-main">
              <span className="coupon-offer-code">{coupon.code}</span>
              <span className="coupon-offer-desc">{headline(coupon)}{coupon.type === 'percent' && cap > 0 ? ` up to ${money(cap)}` : ''}{min > 0 ? ` - on orders above ${money(min)}` : ''}</span>
              <span className="coupon-offer-note">{short ? `Add ${money(short)} more to use this` : appliedCoupon?.code === coupon.code ? `Applied - you save ${money(appliedCoupon.discount)}` : `You could save ${money(saving)}`}</span>
            </div>
            <button type="button" className="coupon-offer-apply" disabled={short > 0 || couponLoading} onClick={() => setSelectedCouponCode(appliedCoupon?.code === coupon.code ? '' : coupon.code)} aria-label={appliedCoupon?.code === coupon.code ? `Remove coupon ${coupon.code}` : `Apply coupon ${coupon.code}`} aria-pressed={appliedCoupon?.code === coupon.code}>
              <span aria-live="polite">{short ? 'Locked' : couponLoading ? 'Checking...' : appliedCoupon?.code === coupon.code ? 'Remove' : 'Apply'}</span>
            </button>
          </li>;
        })}
      </ul>
    </section>
  );

  return (
    <section className="offers-strip" aria-label="Best offers for you">
      <h2 className="offers-strip-heading">A little extra savings</h2>

      <div className="offers-strip-row">
        {coupons.map((coupon, index) => (
          <article key={coupon.code} className={`offer-ticket offer-ticket--t${(index % 3) + 1}`}>
            <div className="offer-ticket-main">
              <span className="offer-ticket-value">{headline(coupon)}</span>
              <span className="offer-ticket-cond">{condition(coupon)}</span>
              <button
                className="offer-ticket-copy"
                onClick={() => copy(coupon.code)}
                aria-label={`Copy code ${coupon.code}`}
              >
                <span className="offer-code-text">{coupon.code}</span><span aria-live="polite">{copied === coupon.code ? '✓ Copied' : 'Copy'}</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <ul className="offers-strip-notes">
        <li>Applied at checkout</li>
        <li>One code per order</li>
        <li>Free shipping in India above ₹2,000</li>
      </ul>
    </section>
  );
};

export default OffersStrip;
