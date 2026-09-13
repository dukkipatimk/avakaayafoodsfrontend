import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import './HomeV2.css';

// ── The 2026 homepage ───────────────────────────────────────────────────────
// Built to the new design: a festival hero, the ways in as circles, three
// offers, then what people actually buy. It reads the same catalogue endpoints
// the old homepage did, so nothing behind it changes.

const SLIDES = [
  {
    eyebrow: 'Celebrate every festival with',
    title: ['A Taste', ' of Home'],
    copy: 'Authentic pickles, sweets and snacks made with love, tradition and the finest ingredients.',
    cta: { label: 'Shop Now', to: '/products' },
    art: '/images/banners/banner_festivals.jpg',
  },
  {
    eyebrow: 'From our kitchen to your doorstep',
    title: ['Across', ' the World'],
    copy: '24 hours in Hyderabad, 1–2 days across India, 3–7 days international. Leak-proof packaging built for the journey.',
    cta: { label: 'Shop Now', to: '/products' },
    art: '/images/banners/banner_worldwide.jpg',
  },
  {
    eyebrow: 'Traditional. Thoughtful. Always special.',
    title: ['Perfect', ' for Gifting'],
    copy: 'Hampers of pickles, sweets and snacks, packed to arrive as handsomely as they taste.',
    cta: { label: 'Explore Gift Hampers', to: '/gift-hamper' },
    art: '/images/banners/banner_hampers.jpg',
  },
];

// The nine ways in, in the order the design puts them. Photographs where the
// catalogue has one; a glyph where the idea has no single product behind it.
const CATS = [
  { label: 'Pickles', to: '/collections/veg-pickles', img: '/images/products/2024/10/Mango-pickle-1_7_11zon-600x400.webp' },
  { label: 'Sweets', to: '/collections/sweets', img: '/images/products/2024/10/BOONDHI-LADDU-1-600x600.jpg' },
  { label: 'Snacks', to: '/collections/snacks', img: '/images/products/2024/10/CHEKKALU-ROUND-600x600.jpg' },
  { label: 'Combos', to: '/combos', glyph: '🧺' },
  { label: 'Spice Powders', to: '/collections/powders', img: '/images/products/2024/10/PALLI-KARAM-600x600.jpg' },
  { label: 'Ready to Eat', to: '/products?ready=1', glyph: '🍲' },
  { label: 'Gift Hampers', to: '/gift-hamper', glyph: '🎁' },
  { label: 'Corporate Orders', to: '/corporate', glyph: '📦' },
  { label: 'Festival Special', to: '/products?sort=popular', glyph: '🪔' },
];

const VALUES = [
  { icon: '🌿', label: 'Pure Ingredients' },
  { icon: '🍲', label: 'Traditional Recipes' },
  { icon: '❤️', label: 'Homemade with Love' },
  { icon: '🌏', label: 'Worldwide Shipping' },
];

const SAYS = [
  { text: 'The pickles taste just like home. Amazing quality and fast delivery to the USA!', by: 'Sravanthi R., USA', stars: 5 },
  { text: 'Fresh, tasty and authentic. Our family’s favorite for every festival.', by: 'Ramesh K., Hyderabad', stars: 4.5 },
  { text: 'Ordered gift hampers for our clients. Everyone loved it. Great service!', by: 'Anita M., Bangalore', stars: 5 },
];

const inr = (n) => `₹${Number(n || 0).toFixed(0)}`;
const firstVariant = (p) => (p.variants && p.variants[0]) || null;
const priceOf = (p) => p.salePrice || p.price || (firstVariant(p) && firstVariant(p).price) || 0;
const imgOf = (p) => p.thumbnail || (p.images && p.images[0]) || '/images/branding/logo.png';

const HomeV2 = () => {
  const { addItem } = useCart();
  const [slide, setSlide] = useState(0);
  const [best, setBest] = useState([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    api.get('/products?sort=popular&limit=8')
      .then((r) => setBest(r.data.products || []))
      .catch(() => setBest([]));
  }, []);

  // The hero moves on its own, as a shop window should.
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const addToCart = (e, product) => {
    e.preventDefault();
    const v = firstVariant(product);
    if (!v) return;
    addItem(product, v);
    toast.success(`${product.name} (${v.weight}) added to cart`);
  };

  const s = SLIDES[slide];

  return (
    <div className="home-v2">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="hv-hero">
        <div className="hv-hero-inner">
          <div>
            <p className="hv-eyebrow">{s.eyebrow}</p>
            <h1><em>{s.title[0]}</em>{s.title[1]}</h1>
            <p>{s.copy}</p>
            <Link className="hv-cta" to={s.cta.to}>{s.cta.label} <span aria-hidden="true">→</span></Link>
            <div className="hv-hero-trust">
              <span>🌿 100% Natural</span>
              <span>🏠 Homemade</span>
              <span>❤️ Traditional Recipes</span>
              <span>🌏 Worldwide Shipping</span>
            </div>
          </div>
          <div className="hv-hero-art">
            <img src={s.art} alt="" />
          </div>
        </div>
        <div className="hv-hero-dots">
          {SLIDES.map((_, i) => (
            <button key={i} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* ── Ways in ────────────────────────────────────────────────────── */}
      <section className="hv-cats">
        <div className="hv-wrap hv-cats-row">
          {CATS.map((c) => (
            <Link key={c.label} to={c.to} className="hv-cat">
              <span className="hv-cat-img">
                {c.img ? <img src={c.img} alt="" loading="lazy" /> : <span aria-hidden="true">{c.glyph}</span>}
              </span>
              <span className="hv-cat-label">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Three offers ───────────────────────────────────────────────── */}
      <div className="hv-wrap">
        <section className="hv-promos">
          <div className="hv-promo hv-promo--off">
            <div>
              <div className="hv-off-flat">Flat</div>
              <div className="hv-off-big">10% OFF</div>
              <div className="hv-off-flat">on all items</div>
            </div>
            <div className="hv-promo-divider" />
            <div>
              <p style={{ fontSize: '.74rem', letterSpacing: '.12em', textTransform: 'uppercase' }}>Valid only from</p>
              <p style={{ fontWeight: 700, marginBottom: '.2rem' }}>Friday – Sunday</p>
              <Link className="hv-promo-btn" to="/products">Shop Now <span aria-hidden="true">→</span></Link>
            </div>
          </div>

          <div className="hv-promo hv-promo--ship">
            <div>
              <h3>Send the Taste of Home<br />Across the World</h3>
              <p>✈ Worldwide Shipping</p>
            </div>
            <img className="hv-promo-media" src="/images/banners/banner_worldwide.jpg" alt="" loading="lazy" />
          </div>

          <div className="hv-promo hv-promo--gift">
            <div>
              <h3>🎁 Perfect for Gifting</h3>
              <p>Traditional. Thoughtful. Always Special.</p>
              <Link className="hv-promo-btn" to="/gift-hamper">Explore Gift Hampers <span aria-hidden="true">→</span></Link>
            </div>
            <img className="hv-promo-media" src="/images/banners/banner_hampers.jpg" alt="" loading="lazy" />
          </div>
        </section>

        {/* ── Bestsellers ──────────────────────────────────────────────── */}
        {best.length > 0 && (
          <section>
            <div className="hv-sec-head">
              <h2>Our Bestsellers</h2>
              <Link className="hv-all" to="/products?sort=popular">View All →</Link>
            </div>
            <div className="hv-cards">
              {best.map((p) => (
                <article key={p._id || p.id} className="hv-card">
                  <Link to={`/product/${p.slug || p._id}`} className="hv-card-img">
                    <img src={imgOf(p)} alt={p.name} loading="lazy" />
                    <button className="hv-wish" title="Save for later"
                      onClick={(e) => { e.preventDefault(); }}>♡</button>
                  </Link>
                  <div className="hv-card-body">
                    <h3 className="hv-card-name">{p.name}</h3>
                    <div className="hv-card-foot">
                      <span className="hv-price">{inr(priceOf(p))}
                        {firstVariant(p) && <span className="hv-pack"> / {firstVariant(p).weight}</span>}
                      </span>
                      <button className="hv-add" onClick={(e) => addToCart(e, p)}>Add to Cart</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Story · values · quote ─────────────────────────────────────── */}
      <section className="hv-band">
        <div className="hv-story">
          <img className="hv-story-bg" src="/images/banners/quality.jpg" alt="" loading="lazy" />
          <div className="hv-story-in">
            <h2>Our Story</h2>
            <p>
              From our kitchens to your homes, Avakaaya Foods brings you authentic flavors rooted in
              tradition. Since 2000, we have been committed to quality, taste and purity in every bite.
            </p>
            <Link className="hv-promo-btn" to="/about" style={{ marginTop: '.9rem' }}>Know More</Link>
          </div>
        </div>
        <div className="hv-values">
          {VALUES.map((v) => (
            <div key={v.label} className="hv-value">
              <span aria-hidden="true">{v.icon}</span>
              <strong>{v.label}</strong>
            </div>
          ))}
        </div>
        <div className="hv-quote">
          <span className="hv-quote-mark" aria-hidden="true">“</span>
          <p>Food is not just what we eat,<br />but what brings us together.</p>
        </div>
      </section>

      {/* ── What people say · stay connected ───────────────────────────── */}
      <div className="hv-wrap">
        <section className="hv-foot">
          <div className="hv-says">
            <h2>What Our Customers Say</h2>
            <div className="hv-quotes">
              {SAYS.map((t) => (
                <div key={t.by} className="hv-testimonial">
                  <p>“{t.text}”</p>
                  <div className="hv-stars">{'★'.repeat(Math.floor(t.stars))}{t.stars % 1 ? '½' : ''}</div>
                  <div className="hv-by">– {t.by}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hv-sub">
            <h2>Stay Connected</h2>
            <p>Get updates on new products, offers and festival specials.</p>
            {subscribed ? (
              <p style={{ color: 'var(--hv-maroon)', fontWeight: 600 }}>Thank you — you are on the list.</p>
            ) : (
              <form className="hv-sub-form" onSubmit={(e) => { e.preventDefault(); if (email) { setSubscribed(true); setEmail(''); } }}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address" aria-label="Email address" />
                <button type="submit">Subscribe</button>
              </form>
            )}
            <div className="hv-social">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">📘</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">▶️</a>
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomeV2;
