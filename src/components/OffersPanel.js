import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './OffersPanel.css';

const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});

// Slide-in drawer listing live coupons — opened from the side menu / bottom toolbar.
const OffersPanel = ({ isOpen, onClose }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(null);

  // Fetch active coupons the first time the panel is opened.
  useEffect(() => {
    if (!isOpen || loaded) return;
    setLoading(true);
    api.get('/coupons/active')
      .then(r => setCoupons(r.data.coupons || []))
      .catch(() => setCoupons([]))
      .finally(() => { setLoading(false); setLoaded(true); });
  }, [isOpen, loaded]);

  // Lock background scroll while the drawer is open.
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const copy = code => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code)
      .then(() => { setCopied(code); setTimeout(() => setCopied(null), 1800); })
      .catch(() => {});
  };

  return (
    <>
      <div
        className={`offers-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`offers-panel${isOpen ? ' open' : ''}`}
        aria-label="Available offers"
        aria-hidden={!isOpen}
      >
        <div className="offers-panel-head">
          <h2>🎟️ Available Offers</h2>
          <button className="offers-panel-close" onClick={onClose} aria-label="Close offers">✕</button>
        </div>

        <div className="offers-panel-body">
          {loading && <div className="loading-spinner offers-spinner" />}

          {!loading && coupons.length === 0 && (
            <p className="offers-empty">No active offers right now.<br />Check back soon!</p>
          )}

          {!loading && coupons.map(c => {
            const discount = c.type === 'percent'
              ? `${Number(c.value)}% OFF`
              : `₹${Number(c.value)} OFF`;
            return (
              <div key={c.code} className="offer-item">
                <div className="offer-item-info">
                  <span className="offer-item-discount">{discount}</span>
                  {Number(c.minOrder) > 0 && (
                    <span className="offer-item-cond">On orders above ₹{Number(c.minOrder)}</span>
                  )}
                  {c.type === 'percent' && Number(c.maxDiscount) > 0 && (
                    <span className="offer-item-cond">Up to ₹{Number(c.maxDiscount)} off</span>
                  )}
                  {c.expiresAt && (
                    <span className="offer-item-expiry">Valid till {fmtDate(c.expiresAt)}</span>
                  )}
                </div>
                <button
                  className={`offer-item-code${copied === c.code ? ' copied' : ''}`}
                  onClick={() => copy(c.code)}
                  title="Copy code"
                >
                  <span className="offer-item-code-text">{c.code}</span>
                  <span className="offer-item-code-action">
                    {copied === c.code ? '✓ Copied' : 'Tap to copy'}
                  </span>
                </button>
              </div>
            );
          })}

          {!loading && coupons.length > 0 && (
            <p className="offers-foot">Apply your code at checkout.</p>
          )}
        </div>
      </aside>
    </>
  );
};

export default OffersPanel;
