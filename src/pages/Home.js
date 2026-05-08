import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const BANNERS = [
  '/images/banners/banner_preservatives.jpg',
  '/images/banners/banner_recipes.jpg',
  '/images/banners/banner_smallbatch.jpg',
  '/images/banners/banner_worldwide.jpg',
];

const ANNOUNCE_ITEMS = [
  '🎉 Use code FIRST10 for 10% off your first order',
  '🚚 Free shipping above ₹999 within India',
  '🌿 No preservatives — 100% natural ingredients',
  '🌍 Delivering to USA · UK · Singapore · Australia · Malaysia',
  '⭐ 10,000+ happy customers worldwide',
  '📦 FSSAI certified · Small batches · Traditional recipes',
];

const USPS = [
  { icon: '🌿', title: 'Zero Preservatives',     desc: 'Natural salt, oil & spice ratios only. No chemicals.' },
  { icon: '👩‍🍳', title: 'Generational Recipes',  desc: 'Passed down for 40+ years. Made exactly as Ammamma used to.' },
  { icon: '📦', title: 'Small Batches',           desc: 'Quality over volume — every jar gets the same attention.' },
  { icon: '🌍', title: 'Ships Worldwide',         desc: 'Leak-proof packaging built for India and international delivery.' },
];

const CATEGORIES = [
  { name: 'Pickles',  slug: 'pickles',  image: '/images/products/2024/10/gongura_pickle_pp.jpg',       count: '36 varieties' },
  { name: 'Powders',  slug: 'powders',  image: '/images/products/2024/10/PALLI-KARAM-600x600.jpg',     count: '14 varieties' },
  { name: 'Snacks',   slug: 'snacks',   image: '/images/products/2024/10/CHEKKALU-ROUND-600x600.jpg',  count: '17 varieties' },
  { name: 'Sweets',   slug: 'sweets',   image: '/images/products/2024/10/BOONDHI-LADDU-1-600x600.jpg', count: '5 varieties'  },
  { name: 'Ghee',     slug: 'ghee',     image: '/images/products/2024/10/COW-GHEE-600x600.jpg',        count: '4 varieties'  },
];

const FESTIVALS = [
  { name: 'Diwali',             tag: 'Festival of Lights',  image: '/images/festivals/diwali.jpg',     emoji: '🪔' },
  { name: 'Sankranthi',         tag: 'Harvest Festival',     image: '/images/festivals/sankranthi.jpg', emoji: '🪁' },
  { name: 'Vinayaka Chaturthi', tag: 'Ganesh Festival',      image: '/images/festivals/vinayaka.jpg',   emoji: '🐘' },
  { name: 'Eid Mubarak',        tag: 'Festive Celebrations', image: '/images/festivals/eid.jpg',        emoji: '🌙' },
  { name: 'Christmas',          tag: "Season's Greetings",   image: '/images/festivals/christmas.jpg',  emoji: '🎄' },
];

const TESTIMONIALS = [
  { name: 'Priya Reddy',  location: 'New Jersey, USA', initials: 'PR', rating: 5, text: 'The avakaya tastes exactly like my grandmother used to make. Nothing comes close in the US!' },
  { name: 'Karthik Rao',  location: 'London, UK',      initials: 'KR', rating: 5, text: 'Gongura pachadi brings back every memory of home. Quality and taste are exceptional.' },
  { name: 'Sunitha Devi', location: 'Singapore',       initials: 'SD', rating: 5, text: 'Fast shipping, beautiful packaging, 100% authentic taste. My go-to for Andhra food.' },
];

const WHATSAPP_NUMBER = '919999999999';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabProducts, setTabProducts] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [igPosts, setIgPosts] = useState([]);
  const [igLoading, setIgLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    api.get('/products/featured')
      .then(r => { setFeatured(r.data.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeCategory === 'all') { setTabProducts([]); return; }
    setTabLoading(true);
    api.get(`/products?category=${activeCategory}&limit=8&sort=popular`)
      .then(r => setTabProducts(r.data.products || []))
      .catch(() => setTabProducts([]))
      .finally(() => setTabLoading(false));
  }, [activeCategory]);

  useEffect(() => {
    api.get('/instagram/feed')
      .then(r => { if (r.data.success) setIgPosts(r.data.posts || []); })
      .catch(() => {})
      .finally(() => setIgLoading(false));
  }, []);

  useEffect(() => {
    api.get('/products?sort=newest&limit=4')
      .then(r => setNewArrivals(r.data.products || []))
      .catch(() => setNewArrivals([]));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); observer.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.anim, .stagger').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [featured, igPosts]);

  const prevBanner = () => setBannerIdx(i => (i - 1 + BANNERS.length) % BANNERS.length);
  const nextBanner = () => setBannerIdx(i => (i + 1) % BANNERS.length);
  const handleSubscribe = e => { e.preventDefault(); if (email) { setSubscribed(true); setEmail(''); } };

  const displayProducts = activeCategory === 'all' ? featured : tabProducts;
  const isTabLoading = activeCategory === 'all' ? loading : tabLoading;

  const categoryTabs = ['all', ...CATEGORIES.map(c => c.slug)];

  return (
    <div className="home">

      {/* ── Announcement bar ─────────────────────── */}
      <div className="announce-bar">
        <div className="announce-track">
          {[...ANNOUNCE_ITEMS, ...ANNOUNCE_ITEMS].map((item, i) => (
            <span key={i} className="announce-item">{item}<span className="announce-sep">✦</span></span>
          ))}
        </div>
      </div>

      {/* ── Banner slider (full width) ───────────── */}
      <section className="banner-slider-section">
        <div className="banner-slider">
          <div className="banner-track" style={{ transform: `translateX(-${bannerIdx * 100}%)` }}>
            {BANNERS.map((src, i) => (
              <img key={i} src={src} alt={`Avakaaya offer ${i + 1}`} className="banner-slide-img" />
            ))}
          </div>
          <button className="banner-btn banner-btn--prev" onClick={prevBanner} aria-label="Previous">&#8249;</button>
          <button className="banner-btn banner-btn--next" onClick={nextBanner} aria-label="Next">&#8250;</button>
          <div className="banner-dots">
            {BANNERS.map((_, i) => (
              <button key={i} className={`banner-dot${i === bannerIdx ? ' active' : ''}`} onClick={() => setBannerIdx(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────── */}
      <div className="trust-bar">
        <div className="container trust-strip">
          {[
            { icon: '🏛️', label: 'FSSAI Certified' },
            { icon: '🌿', label: 'No Preservatives' },
            { icon: '👩‍🍳', label: 'Traditional Recipes' },
            { icon: '🚚', label: 'Free Shipping ₹999+' },
            { icon: '⭐', label: '10,000+ Orders' },
            { icon: '🌍', label: 'Ships Worldwide' },
          ].map((t, i, arr) => (
            <React.Fragment key={t.label}>
              <div className="trust-item">
                <span className="trust-icon">{t.icon}</span>
                <span className="trust-label">{t.label}</span>
              </div>
              {i < arr.length - 1 && <div className="trust-divider" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── USP strip ────────────────────────────── */}
      <div className="usp-strip">
        <div className="container usp-row stagger">
          {USPS.map(u => (
            <div key={u.title} className="usp-item">
              <span className="usp-icon">{u.icon}</span>
              <div className="usp-text">
                <strong>{u.title}</strong>
                <span>{u.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Promo callout ────────────────────────── */}
      <div className="promo-callout">
        <div className="container promo-callout-inner">
          <div className="promo-callout-items">
            <span>🚚 <strong>Free shipping</strong> on orders above ₹999 within India</span>
            <span className="promo-sep">|</span>
            <span>🎁 <strong>Festival hampers</strong> now available for Diwali &amp; Sankranthi</span>
            <span className="promo-sep">|</span>
            <span>🌍 <strong>International orders</strong> shipped with DHL Express</span>
          </div>
          <Link to="/products" className="btn btn-gold btn-sm">Shop Now →</Link>
        </div>
      </div>

      {/* ── Shop by Category ─────────────────────── */}
      <section className="categories-section">
        <div className="container">
          <div className="sec-head anim">
            <div>
              <span className="home-sec-label">Explore</span>
              <h2>Shop by Category</h2>
            </div>
            <Link to="/products" className="btn btn-outline">All Products →</Link>
          </div>
          <div className="categories-grid stagger">
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="cat-card" data-cat={cat.slug}>
                <div className="cat-img-wrap">
                  <img src={cat.image} alt={cat.name} className="cat-img" />
                </div>
                <div className="cat-info">
                  <h3 className="cat-name">{cat.name}</h3>
                  <span className="cat-count">{cat.count}</span>
                  <span className="cat-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Buy Products ───────────────────── */}
      <section className="quickbuy-section">
        <div className="container">
          <div className="sec-head anim">
            <div>
              <span className="home-sec-label">Quick Buy</span>
              <h2>Bestsellers</h2>
            </div>
            <Link to="/products" className="btn btn-outline">View All →</Link>
          </div>

          {/* Category filter tabs */}
          <div className="qb-tabs anim">
            {categoryTabs.map(tab => (
              <button
                key={tab}
                className={`qb-tab${activeCategory === tab ? ' active' : ''}`}
                onClick={() => setActiveCategory(tab)}
              >
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="products-grid stagger">
            {isTabLoading
              ? Array(8).fill(0).map((_, i) => <div key={i} className="product-skeleton skeleton" />)
              : displayProducts.map(p => <ProductCard key={p._id} product={p} />)
            }
          </div>
        </div>
      </section>

      {/* ── New Arrivals ──────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="new-arrivals-section">
          <div className="container">
            <div className="sec-head anim">
              <div>
                <span className="home-sec-label">Just In</span>
                <h2>New Arrivals</h2>
              </div>
              <Link to="/products?sort=newest" className="btn btn-outline">View All →</Link>
            </div>
            <div className="products-grid stagger">
              {newArrivals.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Festival Hampers ─────────────────────── */}
      <section className="festivals-section">
        <div className="container">
          <div className="sec-head centered anim" style={{ marginBottom: 36 }}>
            <span className="home-sec-label">Special Collections</span>
            <h2>Festival Gift Hampers</h2>
            <p className="festivals-subtitle">Authentic Andhra pickles, powders &amp; sweets — for every celebration.</p>
          </div>
          <div className="festivals-grid stagger">
            {FESTIVALS.map(f => (
              <Link key={f.name} to="/products" className="festival-card">
                <img src={f.image} alt={f.name} className="festival-img" />
                <div className="festival-overlay">
                  <span className="festival-emoji">{f.emoji}</span>
                  <span className="festival-tag">{f.tag}</span>
                  <h3 className="festival-name">{f.name}</h3>
                  <span className="festival-cta">Shop Now →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────── */}
      <section className="testimonials-section">
        <div className="container">
          <div className="sec-head centered anim">
            <span className="home-sec-label">Happy Customers</span>
            <h2>Loved by Andhra Families Worldwide</h2>
            <p className="t-subtitle">★★★★★ Rated 4.9 / 5 across 10,000+ orders</p>
          </div>
          <div className="testimonials-grid stagger">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testimonial-card">
                <div className="t-stars">{'★'.repeat(t.rating)}</div>
                <p className="t-text">"{t.text}"</p>
                <div className="t-author">
                  <div className="t-avatar">{t.initials}</div>
                  <div><strong>{t.name}</strong><span>{t.location}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instagram feed ───────────────────────── */}
      {(igLoading || igPosts.length > 0) && (
        <section className="ig-section">
          <div className="container">
            <div className="sec-head centered anim" style={{ marginBottom: 32 }}>
              <span className="home-sec-label">Follow Along</span>
              <h2>@avakaayafoods</h2>
              <p className="ig-subtitle">From our kitchen to your feed</p>
            </div>
            <div className="ig-grid stagger">
              {igLoading
                ? Array(6).fill(0).map((_, i) => <div key={i} className="ig-skeleton skeleton" />)
                : igPosts.slice(0, 6).map(post => (
                    <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className="ig-tile">
                      <img src={post.url} alt={post.caption || 'Instagram post'} className="ig-img" />
                      <div className="ig-overlay">
                        {post.isVideo && <span className="ig-play">▶</span>}
                        {post.caption && <p className="ig-caption">{post.caption}</p>}
                      </div>
                    </a>
                  ))
              }
            </div>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <a href="https://www.instagram.com/avakaayafoods" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                View More on Instagram →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Who We Are ──────────────────────────── */}
      <section className="brand-split anim">
        <div className="container brand-split-inner">
          <div className="brand-split-img-col">
            <img src="/avakaay-logo.png" alt="Avakaaya Pickles House" className="brand-split-img" />
            <div className="brand-since-badge">
              <span>Making pickles since</span>
              <strong>1980s</strong>
            </div>
          </div>
          <div className="brand-split-text">
            <span className="home-sec-label">Who We Are</span>
            <h2 className="brand-split-heading">Handcrafted in Hyderabad,<br />Loved Across the World</h2>
            <p className="brand-split-body">
              Avakaaya began in a family kitchen — where seasonal raw mangoes, hand-ground spices, and cold-pressed oils came together every summer into jars of pickle that defined what Andhra cooking tasted like. Today we carry those same recipes to families across India and six countries.
            </p>
            <ul className="brand-bullets">
              <li><span>✦</span> Zero artificial preservatives — natural preservation only</li>
              <li><span>✦</span> Whole spices from Guntur, Khammam &amp; Nalgonda</li>
              <li><span>✦</span> Cold-pressed groundnut oil in every batch</li>
              <li><span>✦</span> Small batches — quality over volume, always</li>
            </ul>
            <Link to="/about" className="btn btn-primary" style={{ marginTop: 28 }}>Read Our Full Story →</Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────── */}
      <section className="newsletter-section">
        <div className="container newsletter-inner anim">
          <div className="newsletter-copy">
            <h3>Get seasonal recipes &amp; exclusive offers</h3>
            <p>Be the first to know about new pickles, festival hampers, and early-bird discounts.</p>
          </div>
          {subscribed
            ? <div className="newsletter-thanks">🎉 Thank you! We'll be in touch soon.</div>
            : (
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <input type="email" placeholder="Enter your email address" className="newsletter-input"
                  value={email} onChange={e => setEmail(e.target.value)} required />
                <button type="submit" className="btn btn-gold">Subscribe →</button>
              </form>
            )
          }
        </div>
      </section>

      {/* ── WhatsApp float ───────────────────────── */}
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20have%20a%20question%20about%20Avakaaya%20Foods`}
        target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label="Chat on WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="whatsapp-label">Chat with us</span>
      </a>

    </div>
  );
};

export default Home;
