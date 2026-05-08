import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './GiftHamper.css';

const MAX_ITEMS = 6;

const GiftHamper = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [selected, setSelected] = useState([]); // { product, variant }
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products?limit=50&sort=popular')
      .then(r => setAllProducts(r.data.products || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (product) => {
    const idx = selected.findIndex(s => s.product._id === product._id);
    if (idx >= 0) {
      setSelected(prev => prev.filter((_, i) => i !== idx));
    } else {
      if (selected.length >= MAX_ITEMS) { toast.error(`Max ${MAX_ITEMS} items per hamper`); return; }
      setSelected(prev => [...prev, { product, variant: product.variants[0] }]);
    }
  };

  const updateVariant = (productId, variant) => {
    setSelected(prev => prev.map(s => s.product._id === productId ? { ...s, variant } : s));
  };

  const hamperTotal = selected.reduce((sum, s) => sum + s.variant.price, 0);

  const addHamperToCart = () => {
    if (selected.length === 0) { toast.error('Select at least one product'); return; }
    selected.forEach(({ product, variant }) => addItem(product, variant, 1));
    toast.success(`${selected.length} items added to cart!`);
    navigate('/cart');
  };

  return (
    <div className="hamper-page">
      <div className="container">
        <div className="hamper-hero">
          <span className="home-sec-label">Build Your Own</span>
          <h1>Gift Hamper Builder</h1>
          <p>Pick up to {MAX_ITEMS} products and create a personalised gift hamper for your loved ones.</p>
        </div>

        <div className="hamper-layout">
          {/* Product picker */}
          <div className="hamper-picker">
            <div className="hamper-search-row">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="hamper-search"
              />
              <span className="hamper-counter">{selected.length}/{MAX_ITEMS} selected</span>
            </div>
            {loading ? (
              <div className="hamper-grid">
                {Array(8).fill(0).map((_, i) => <div key={i} className="product-skeleton skeleton" style={{ height: 200 }} />)}
              </div>
            ) : (
              <div className="hamper-grid">
                {filtered.map(product => {
                  const isSelected = selected.some(s => s.product._id === product._id);
                  return (
                    <div
                      key={product._id}
                      className={`hamper-product-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleProduct(product)}
                    >
                      {isSelected && <span className="hamper-check">✓</span>}
                      <img src={product.thumbnail} alt={product.name} className="hamper-product-img" />
                      <div className="hamper-product-info">
                        <span className="hamper-product-name">{product.name}</span>
                        <span className="hamper-product-price">from ₹{product.variants[0]?.price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hamper summary */}
          <aside className="hamper-summary">
            <h2>Your Hamper</h2>
            {selected.length === 0 ? (
              <p className="hamper-empty-hint">← Select products to build your hamper</p>
            ) : (
              <>
                {selected.map(({ product, variant }) => (
                  <div key={product._id} className="hamper-selected-item">
                    <img src={product.thumbnail} alt={product.name} className="hamper-sel-img" />
                    <div className="hamper-sel-info">
                      <span className="hamper-sel-name">{product.name}</span>
                      <select
                        value={variant.weight}
                        onChange={e => {
                          const v = product.variants.find(v => v.weight === e.target.value);
                          if (v) updateVariant(product._id, v);
                        }}
                        className="hamper-variant-select"
                        onClick={e => e.stopPropagation()}
                      >
                        {product.variants.map(v => (
                          <option key={v.weight} value={v.weight}>{v.weight} — ₹{v.price}</option>
                        ))}
                      </select>
                    </div>
                    <button className="hamper-remove" onClick={e => { e.stopPropagation(); toggleProduct(product); }}>✕</button>
                  </div>
                ))}

                <div className="hamper-note-section">
                  <label>Personal Message (optional)</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Add a heartfelt message for the recipient..."
                    className="hamper-note-textarea"
                    maxLength={200}
                  />
                  <span className="hamper-note-count">{note.length}/200</span>
                </div>

                <div className="hamper-total-row">
                  <span>Hamper Total</span>
                  <strong>₹{hamperTotal.toLocaleString()}</strong>
                </div>

                <button className="btn btn-gold btn-lg hamper-cta" onClick={addHamperToCart}>
                  Add Hamper to Cart →
                </button>
                <Link to="/products?category=gift-hampers" className="hamper-link">
                  Browse curated gift hampers →
                </Link>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GiftHamper;
