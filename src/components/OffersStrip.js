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
const OffersStrip = () => {
  const [coupons, setCoupons] = useState([]);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    api.get('/coupons/active')
      .then((r) => setCoupons((r.data.coupons || []).slice(0, 3)))
      .catch(() => setCoupons([]));
  }, []);

  if (!coupons.length) return null;

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

  return (
    <section className="offers-strip" aria-label="Best offers for you">
      <h2 className="offers-strip-heading">🎉 Best offers for you</h2>

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
                {copied === coupon.code ? '✓ Copied' : 'Copy code'}
              </button>
            </div>
            {/* Perforated stub carrying the code, as on a paper coupon. */}
            <div className="offer-ticket-stub">
              <span>{coupon.code}</span>
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
