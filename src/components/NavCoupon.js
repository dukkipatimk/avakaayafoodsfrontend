import React, { useState, useEffect } from 'react';
import './NavCoupon.css';

const offerText = c => (c.type === 'percent'
  ? `${Number(c.value)}% OFF`
  : `₹${Number(c.value)} OFF`);

// Two-column vertical coupon ribbon for the right-side action bar:
// column 1 = the offer + copy action, column 2 = the code.
// Click to copy; auto-rotates the code when there is more than one coupon.
const NavCoupon = ({ coupons }) => {
  const [idx, setIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (coupons.length < 2) return;
    const t = setInterval(() => {
      setIdx(i => (i + 1) % coupons.length);
      setCopied(false);
    }, 4500);
    return () => clearInterval(t);
  }, [coupons.length]);

  if (!coupons.length) return null;

  const c = coupons[idx % coupons.length];

  const copy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(c.code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  };

  return (
    <button
      type="button"
      className={`nav-coupon${copied ? ' copied' : ''}`}
      onClick={copy}
      title={`Get ${offerText(c)} — click to copy code ${c.code}`}
    >
      <span className="nav-coupon-offer">
        <span className="nav-coupon-off-text">{offerText(c)}</span>
        <span className="nav-coupon-tag">{copied ? 'COPIED' : 'COPY'}</span>
      </span>
      <span className="nav-coupon-codecol">
        <span className="nav-coupon-code" key={idx}>{c.code}</span>
      </span>
    </button>
  );
};

export default NavCoupon;
