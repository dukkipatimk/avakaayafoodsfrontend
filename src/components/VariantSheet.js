import React, { useEffect } from 'react';
import './VariantSheet.css';

// Grams for a weight label, used to rank value-for-money.
export const gramsOf = (weight) => {
  const text = String(weight || '');
  const value = parseFloat(text);
  if (Number.isNaN(value)) return 0;
  return /kg$/i.test(text) ? value * 1000 : value;
};

// The variant with the lowest price per gram — a fact we can derive, unlike
// "most popular", which would need sales data the catalogue doesn't carry.
export const bestValueWeight = (variants = []) => {
  const rated = variants
    .map((v) => ({ weight: v.weight, perGram: gramsOf(v.weight) ? Number(v.price) / gramsOf(v.weight) : Infinity }))
    .filter((v) => Number.isFinite(v.perGram));
  if (rated.length < 2) return null;
  return rated.reduce((best, v) => (v.perGram < best.perGram ? v : best)).weight;
};

// Bottom sheet for choosing a size without leaving the card.
const VariantSheet = ({ product, selected, onSelect, onClose }) => {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const variants = product.variants || [];
  const bestValue = bestValueWeight(variants);

  return (
    <div className="vs-overlay" onClick={onClose}>
      <div className="vs-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Select size for ${product.name}`}>
        <div className="vs-grip" aria-hidden="true" />
        <h3 className="vs-title">Select size</h3>
        <p className="vs-product">{product.name}</p>

        <ul className="vs-list">
          {variants.map((variant) => {
            const isOn = variant.weight === selected?.weight;
            const soldOut = variant.stock === 0;
            return (
              <li key={variant.weight}>
                <button
                  className={`vs-option${isOn ? ' vs-option--on' : ''}`}
                  onClick={() => { if (!soldOut) { onSelect(variant); onClose(); } }}
                  disabled={soldOut}
                  aria-pressed={isOn}
                >
                  <span className="vs-radio" aria-hidden="true">{isOn ? '●' : ''}</span>
                  <span className="vs-weight">{variant.weight}</span>
                  {variant.weight === bestValue && !soldOut && <span className="vs-badge">Best value</span>}
                  <span className="vs-price">
                    &#8377;{Number(variant.price).toLocaleString('en-IN')}
                    {soldOut && <small>Sold out</small>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <button className="vs-done" onClick={onClose}>Done</button>
      </div>
    </div>
  );
};

export default VariantSheet;
