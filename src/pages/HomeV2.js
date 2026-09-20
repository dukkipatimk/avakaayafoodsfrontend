import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import useLastOrder from '../hooks/useLastOrder';
import { addOrderToCart, reorderableItems } from '../utils/reorder';
import ProductCard from '../components/ProductCard';
import { ShopByCategory, CravingRow } from '../components/HomeDiscovery';
import './HomeV2.css';

// ── The 2026 homepage ───────────────────────────────────────────────────────
// Built to the supplied design, section for section: festival hero, the ways in
// as circles, best sellers, the three shortcuts, what is new, why us, the
// festival hampers band, the stores, and how it ships. Every list on it comes
// from the same endpoints the old homepage used — nothing behind it changes.

// The eight supplied banners, cut from the sheet. Each one is a finished piece
// of artwork — headline, sub-line and button are painted into the image — so the
// hero shows them whole and makes the banner itself the link. Nothing is set on
// top of them: a second headline over a headline is how banners get unreadable.
const SLIDES = [
  { img: '/images/banners/hero-authentic.jpg', alt: 'Authentic Telugu flavours since 2000 — shop best sellers', to: '/products?sort=popular' },
  { img: '/images/banners/hero-mango.jpg', alt: 'Mango season is here — shop mango pickles', to: '/collections/veg-pickles' },
  { img: '/images/banners/hero-nonveg.jpg', alt: 'Spice up every meal — shop non-veg pickles', to: '/collections/non-veg-pickles' },
  { img: '/images/banners/hero-sweets.jpg', alt: 'Traditional sweets for every celebration — shop sweets', to: '/collections/sweets' },
  { img: '/images/banners/hero-combos.jpg', alt: 'More flavour, more savings — explore combos', to: '/combos' },
  { img: '/images/banners/hero-hampers.jpg', alt: 'Gift a taste of home — explore hampers', to: '/gift-hamper' },
  { img: '/images/banners/hero-worldwide.jpg', alt: 'A taste of home wherever you are — we deliver worldwide', to: '/shipping-info' },
  { img: '/images/banners/hero-story.jpg', alt: 'From our family kitchen to yours — our story', to: '/about' },
];

const TRUST = ['No Preservatives', 'Traditional Recipes', 'Small Batches', 'Ships Worldwide'];

const SHIPPING = [
  { icon: '🚚', title: 'In Hyderabad', copy: '24 hours express delivery' },
  { icon: '✈️', title: 'Within India', copy: 'Delivery in 1-2 days' },
  { icon: '🌐', title: 'International', copy: '3-7 business days' },
  { icon: '🛡️', title: 'Secure Payments', copy: '100% safe and secure' },
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const HomeV2 = () => {
  const { addItem } = useCart();
  const { openQuickOrder } = useUI();
  const lastOrder = useLastOrder();

  const [slide, setSlide] = useState(0);
  const [bestSellers, setBestSellers] = useState([]);

  useEffect(() => {
    api.get('/products?sort=popular&limit=6').then(r => setBestSellers(r.data.products || [])).catch(() => {});
  }, []);

  // The hero advances on its own but stops the moment someone takes the arrows:
  // a carousel that keeps moving under the hand is a carousel nobody can read.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  const go = useCallback((dir) => {
    setPaused(true);
    setSlide(s => (s + dir + SLIDES.length) % SLIDES.length);
  }, []);

  const s = SLIDES[slide];
  const lastItems = lastOrder ? reorderableItems(lastOrder) : [];
  const addLastOrder = () => {
    const added = addOrderToCart(lastOrder, addItem);
    toast.success(`${added} ${added === 1 ? 'item' : 'items'} added to cart`);
  };

  return (
    <div className="hp">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hp-hero" aria-label="Featured">
        <Link to={s.to} className="hp-hero-banner">
          {/* The banner fills the frame. Its own artwork is 5.5:1, so standing
              taller costs a little off each side — the height below is set where
              that trim stays outside the headline and the button. */}
          <img className="hp-hero-fg" src={s.img} alt={s.alt} fetchpriority="high" />
        </Link>
        <div className="hp-hero-nav">
          <button onClick={(e) => { e.preventDefault(); go(-1); }} aria-label="Previous banner">‹</button>
          <button onClick={(e) => { e.preventDefault(); go(1); }} aria-label="Next banner">›</button>
        </div>
        <div className="hp-hero-dots" role="tablist" aria-label="Banners">
          {SLIDES.map((sl, i) => (
            <button key={sl.img} className={i === slide ? 'is-on' : ''} aria-label={sl.alt}
              aria-selected={i === slide} role="tab" onClick={() => { setPaused(true); setSlide(i); }} />
          ))}
        </div>
      </section>

      {/* The promises sit under the banner rather than on it — the artwork
          changes every few seconds and these do not. */}
      <ul className="hp-trust">
        {TRUST.map(t => <li key={t}>{t}</li>)}
      </ul>

      <ShopByCategory />
      <CravingRow />

      {/* ── Best sellers ─────────────────────────────────────────── */}
      <section className="hp-sec">
        <header className="hp-head">
          <h2><span aria-hidden="true">🔥</span> Best Sellers</h2>
          <p>Loved by Telugu families worldwide</p>
          <Link to="/products?sort=popular" className="hp-more">View all →</Link>
        </header>
        <div className="hp-grid hp-grid--6">
          {bestSellers.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* ── The three shortcuts ──────────────────────────────────── */}
      <section className="hp-sec hp-shortcuts">
        <button className="hp-shortcut hp-shortcut--quick" onClick={openQuickOrder}>
          <span className="hp-shortcut-icon" aria-hidden="true">⚡</span>
          <span className="hp-shortcut-text">
            <strong>Quick Order</strong>
            <span>Add your favourites in seconds.</span>
            <span className="hp-shortcut-cta">Order Now →</span>
          </span>
          <img src="/images/products/2024/10/Mango-pickle-1_7_11zon-600x400.webp" alt="" loading="lazy" />
        </button>

        <Link className="hp-shortcut hp-shortcut--combos" to="/combos">
          <span className="hp-shortcut-icon" aria-hidden="true">🎁</span>
          <span className="hp-shortcut-text">
            <strong>Combos &amp; Save More</strong>
            <span>Handpicked bundles at great prices.</span>
            <span className="hp-shortcut-cta">View Combos →</span>
          </span>
          <img src="/images/banners/banner_hampers.jpg" alt="" loading="lazy" />
        </Link>

        {/* Only for someone who has ordered before; for everyone else the row is
            two cards rather than a card apologising for being empty. */}
        {lastOrder && lastItems.length > 0 && (
          <div className="hp-shortcut hp-shortcut--last">
            <span className="hp-shortcut-icon" aria-hidden="true">🕑</span>
            <span className="hp-shortcut-text">
              <strong>Your Last Order</strong>
              <span className="hp-last-line">
                {lastItems[0].product?.name || lastItems[0].name}
                {lastItems[0].variantWeight ? ` · ${lastItems[0].variantWeight}` : ''}
                {lastItems.length > 1 ? ` +${lastItems.length - 1} more` : ''}
              </span>
              <span className="hp-last-total">{money(lastOrder.subtotal ?? lastOrder.total)}</span>
            </span>
            <span className="hp-last-actions">
              <Link to="/my-orders" className="hp-last-view">View order →</Link>
              <button className="hp-btn hp-btn--solid hp-btn--sm" onClick={addLastOrder}>Add all to cart</button>
            </span>
          </div>
        )}
      </section>

      {/* ── Festival hampers + the family kitchen ────────────────
          Two panels on one band, as in the design: the seasonal reason to buy
          on the left, who you are buying from on the right. Both are the
          supplied banner artwork, so the copy sits beside the picture rather
          than on top of the words already painted into it. */}
      <section className="hp-band">
        <div className="hp-band-fest">
          <div className="hp-band-copy">
            <h2>Festival Gift Hampers</h2>
            <p>Authentic Telugu pickles, powders &amp; sweets for every celebration.</p>
            <Link to="/gift-hamper" className="hp-btn hp-btn--gold">Explore Hampers <span aria-hidden="true">→</span></Link>
          </div>
          <img className="hp-band-art" src="/images/banners/hero-hampers.jpg" alt="" loading="lazy" />
          {/* The festival names are painted into the artwork itself — listing
              them again beside it printed every name twice. */}
        </div>
        <Link className="hp-band-story" to="/about">
          <span className="hp-band-copy">
            <h2>From Our<br />Family Kitchen<br />to Yours</h2>
            <p>Recipes rooted in Andhra &amp; Telangana since 2000.</p>
            <span className="hp-btn hp-btn--gold">Our Story <span aria-hidden="true">→</span></span>
          </span>
          <img className="hp-band-art" src="/images/banners/hero-story.jpg" alt="" loading="lazy" />
        </Link>
      </section>

      {/* ── How it ships ─────────────────────────────────────────── */}
      <section className="hp-ship">
        {SHIPPING.map(x => (
          <div key={x.title} className="hp-ship-item">
            <span className="hp-ship-icon" aria-hidden="true">{x.icon}</span>
            <span><strong>{x.title}</strong><span>{x.copy}</span></span>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HomeV2;
