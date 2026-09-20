import React from 'react';
import './CouponOffers.css';

export const FREE_SHIPPING_THRESHOLD = 2000;

export default function FreeShippingOffer({ subtotal, isIndia = true }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const unlocked = isIndia && remaining === 0;
  if (!isIndia) return null;
  // Once it is unlocked there is nothing left to say: the Shipping row shows the
  // courier's price struck through next to ₹0, which is the same news in the
  // place people look for it. Only the "how far to go" bar earns its space.
  if (unlocked) return null;
  return (
    <div className="summary-shipping-progress">
      <div aria-live="polite">
        Add <strong>₹{remaining.toLocaleString('en-IN')}</strong> for <strong>free shipping</strong> within India
      </div>
      <div className="summary-shipping-track" role="progressbar" aria-label="Progress toward free shipping" aria-valuemin={0} aria-valuemax={FREE_SHIPPING_THRESHOLD} aria-valuenow={Math.max(0, Math.min(subtotal, FREE_SHIPPING_THRESHOLD))}>
        <span style={{ width: `${Math.max(0, Math.min(100, subtotal / FREE_SHIPPING_THRESHOLD * 100))}%` }} />
      </div>
    </div>
  );
}
