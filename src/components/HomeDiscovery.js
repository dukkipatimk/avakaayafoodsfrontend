import React from 'react';
import { Link } from 'react-router-dom';
import './HomeDiscovery.css';

// ── The two ways into the catalogue ─────────────────────────────────────────
// "Shop by Category" is for someone who knows what a thing is called; "What are
// you craving today?" is for someone who only knows the mood. They live here
// rather than inside one page so the homepage and the 2026 homepage show the
// same rows — two copies would have drifted the first time a category changed.

// Counts are the catalogue's, kept as text rather than computed: neither row
// should wait on six category requests before it can draw.
export const CATEGORIES = [
  { label: 'Veg Pickles', note: '24 varieties', to: '/collections/veg-pickles', img: '/images/products/2024/10/Mango-pickle-1_7_11zon-600x400.webp' },
  { label: 'Non-Veg Pickles', note: '12 varieties', to: '/collections/non-veg-pickles', img: '/images/products/2024/10/chicken-1-1-600x600.jpg' },
  { label: 'Powders', note: '14 varieties', to: '/collections/powders', img: '/images/products/2024/10/PALLI-KARAM-600x600.jpg' },
  { label: 'Snacks', note: '17 varieties', to: '/collections/snacks', img: '/images/products/2024/10/CHEKKALU-ROUND-600x600.jpg' },
  { label: 'Sweets', note: '5 varieties', to: '/collections/sweets', img: '/images/products/2024/10/BOONDHI-LADDU-1-600x600.jpg' },
  { label: 'Ghee', note: '4 varieties', to: '/collections/ghee', img: '/images/products/2024/10/COW-GHEE-600x600.jpg' },
];

export const CRAVINGS = [
  { label: 'Spicy Pickles', note: 'For every meal', to: '/collections/veg-pickles', img: '/images/products/2024/10/Avakaaya-1-600x400.webp' },
  { label: 'Mango Favourites', note: 'The classic taste', to: '/collections/veg-pickles', img: '/images/products/2024/10/Mango-pickle-3_5_11zon-600x400.webp' },
  { label: 'Non-Veg Specials', note: 'Rich & flavourful', to: '/collections/non-veg-pickles', img: '/images/products/2024/10/chicken-1-1-600x600.jpg' },
  { label: 'Traditional Sweets', note: 'Festive & everyday', to: '/collections/sweets', img: '/images/products/2024/10/BOONDHI-LADDU-1-600x600.jpg' },
  { label: 'Tea-Time Snacks', note: 'Perfect with chai', to: '/collections/snacks', img: '/images/products/2024/10/CHEKKALU-ROUND-600x600.jpg' },
  { label: 'Festival Gifts', note: 'Share happiness', to: '/gift-hamper', img: '/images/festivals/diwali.jpg' },
];

export const ShopByCategory = () => (
  <section className="hd-sec hd-sec--categories" aria-label="Shop by category">
    <header className="hd-head">
      <div className="hd-heading-group"><span className="hd-eyebrow">THE PANTRY</span><h2>Shop by Category</h2><p>Find your everyday favourites.</p></div>
      <Link to="/products" className="hd-more">View all categories →</Link>
    </header>
    <div className="hd-cats">
      {CATEGORIES.map(c => (
        <Link key={c.label} to={c.to} className="hd-cat">
          <span className="hd-cat-disc"><img src={c.img} alt="" loading="lazy" /></span>
          <span className="hd-cat-name">{c.label}</span>
          <span className="hd-cat-note">{c.note}</span>
        </Link>
      ))}
      {/* Hampers is not one more category — it is the reason a lot of people
          arrive — so it gets a card of its own at the end of the row. */}
      <Link to="/gift-hamper" className="hd-cat hd-cat--gift">
        <span className="hd-cat-disc"><img src="/images/banners/banner_hampers.jpg" alt="" loading="lazy" /></span>
        <span className="hd-cat-name">Gift Hampers</span>
        <span className="hd-cat-note">Perfect for every occasion</span>
      </Link>
    </div>
  </section>
);

export const CravingRow = () => (
  <section className="hd-sec hd-sec--cravings" aria-label="Explore food collections">
    <header className="hd-head">
      <div className="hd-heading-group"><span className="hd-eyebrow">FOLLOW YOUR CRAVING</span><h2>What are you craving today?</h2><p>Something spicy, something sweet, something to share.</p></div>
      <Link to="/products" className="hd-more">Explore collections →</Link>
    </header>
    <div className="hd-cravings">
      {CRAVINGS.map(c => (
        <Link key={c.label} to={c.to} className="hd-crave">
          <span className="hd-crave-img"><img src={c.img} alt="" loading="lazy" /></span>
          <span className="hd-crave-cap">
            <strong>{c.label}</strong>
            <span>{c.note}</span>
          </span>
          <span className="hd-crave-arrow" aria-hidden="true">↗</span>
        </Link>
      ))}
    </div>
  </section>
);
