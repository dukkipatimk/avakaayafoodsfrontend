import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const STATS = [
  { value: '40+',    label: 'Years of Recipes' },
  { value: '76+',    label: 'Products' },
  { value: '10,000+',label: 'Happy Orders' },
  { value: '6',      label: 'Countries Served' },
];

const VALUES = [
  {
    icon: '🌿',
    title: 'Zero Artificial Preservatives',
    desc: 'Every pickle is preserved the traditional way — with salt, cold-pressed oil, and precisely balanced spice ratios. No chemicals. No shortcuts. Just food as nature intended.',
  },
  {
    icon: '🫙',
    title: 'Small-Batch Craftsmanship',
    desc: 'We never sacrifice quality for volume. Small batches mean every jar gets the same hands-on attention, the same careful tasting, and the same love as the very first one we made.',
  },
  {
    icon: '🌾',
    title: 'Farmer-First Sourcing',
    desc: 'We work directly with farmers in Andhra Pradesh — fair prices, long-term relationships, seasonal produce. When our farmers thrive, the flavour shows in every jar.',
  },
  {
    icon: '🌶️',
    title: 'Authentic Andhra Spice',
    desc: 'Whole spices ground fresh in-house for every single batch. Red chillies from Guntur, mustard from local farms, fenugreek seeds sourced seasonally — never pre-ground powders.',
  },
  {
    icon: '📦',
    title: 'Built for the World',
    desc: 'Our packaging is purpose-engineered for international travel — double-sealed lids, moisture barriers, food-grade cushioning. The same jar arrives in Singapore as it does in Hyderabad.',
  },
  {
    icon: '❤️',
    title: 'Made with Generational Love',
    desc: "These aren't factory recipes developed in a lab. They're the same formulas your grandmother would recognise — passed down, refined over decades, and made with the same intention.",
  },
];

const INGREDIENTS = [
  { emoji: '🥭', name: 'Raw Mangoes',        source: 'Guntur, Andhra Pradesh',  note: 'Sourced at peak raw season for the perfect tangy bite' },
  { emoji: '🌶️', name: 'Red Chillies',       source: 'Khammam, Telangana',       note: 'Dried Guntur chillies — bold heat with deep colour' },
  { emoji: '🌻', name: 'Sesame Seeds',        source: 'Nalgonda, Andhra Pradesh', note: 'Cold-pressed til oil for authentic richness' },
  { emoji: '🫘', name: 'Groundnut Oil',       source: 'Locally cold-pressed',     note: 'Traditional cold-press process, no refining' },
  { emoji: '🌿', name: 'Fenugreek & Mustard', source: 'Seasonal, direct from farms', note: 'Whole seeds ground fresh per batch — never powder' },
];

const PROCESS = [
  { step: '01', title: 'Seasonal Sourcing',  desc: 'We buy raw mangoes, chillies, and spices only at their seasonal peak from trusted Andhra farms — never year-round from cold storage.' },
  { step: '02', title: 'Whole Spice Grinding', desc: 'Every spice is bought whole and ground fresh in-house. This preserves volatile oils and gives Avakaaya its unmistakable depth of flavour.' },
  { step: '03', title: 'Hand Mixing',         desc: 'Ingredients are mixed by hand in exact ratios — same as the original recipes. There is no machine that replicates the feel of proper hand blending.' },
  { step: '04', title: 'Curing & Resting',   desc: "Pickles rest and cure for the right amount of time — days for some, weeks for others. You can't rush authentic flavour development." },
  { step: '05', title: 'Quality Check',       desc: 'Every batch is tasted and inspected before bottling. If it doesn\'t taste exactly right, it doesn\'t go in the jar.' },
  { step: '06', title: 'Seal & Dispatch',     desc: 'Air-tight sealed, labelled with batch and expiry, then packed in food-safe packaging built to reach your door intact — wherever in the world you are.' },
];

const REVIEWS = [
  { name: 'Priya Reddy',   location: 'New Jersey, USA',  initials: 'PR', text: 'The avakaya tastes exactly like my grandmother used to make in Vijayawada. I have tried dozens of brands here in the US — nothing comes close. This is the real deal.' },
  { name: 'Sandra M.',     location: 'London, UK',        initials: 'SM', text: 'The non-veg pickles are absolutely outstanding. Especially the chicken pickle. Highly recommend to anyone who misses proper Andhra food.' },
  { name: 'Ramesh Babu',   location: 'Hyderabad',         initials: 'RB', text: 'Ordered for our family function and everyone loved it. The gongura pachadi was finished before anything else. Will definitely order again.' },
  { name: 'Sunitha Devi',  location: 'Singapore',         initials: 'SD', text: 'Fast international shipping, beautiful packaging, and the taste is 100% authentic. My children who grew up here finally understand what I mean by "real Andhra pickle".' },
];

const About = () => {
  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-bg" />
        <div className="container about-hero-content">
          <span className="about-eyebrow">Our Story</span>
          <h1 className="about-title">Handcrafted with Love,<br />Rooted in Andhra</h1>
          <p className="about-tagline">
            From a Hyderabad kitchen to doorsteps across six countries —<br />
            the same recipes, the same care, the same Andhra soul.
          </p>
          <div className="about-hero-actions">
            <Link to="/products" className="btn btn-gold btn-lg">Shop Our Pickles</Link>
            <a href="#story" className="btn btn-ghost-white btn-lg">Read the Story ↓</a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="about-stats-bar">
        <div className="container about-stats-strip">
          {STATS.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="about-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
              {i < STATS.length - 1 && <div className="about-stat-div" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Origin story */}
      <section className="about-section about-story-section" id="story">
        <div className="container about-story-grid">
          <div className="about-story-img-col">
            <img src="/avakaaya-logo.png" alt="Avakaaya Pickles House" className="about-story-img" />
            <div className="about-story-since">
              <span className="since-label">Making pickles since</span>
              <strong className="since-year">1980s</strong>
            </div>
          </div>
          <div className="about-story-text">
            <span className="about-sec-label">How It All Began</span>
            <h2>A kitchen in Hyderabad.<br />A jar of avakaya.</h2>
            <p>
              Avakaaya began not as a business plan but as a memory. The founder grew up watching their mother and grandmother spend weeks every summer preparing the season's pickles — sorting raw mangoes, grinding spices by hand, mixing everything with a precision that came from decades of doing it the same way.
            </p>
            <p>
              When those recipes risked being lost to faster, easier substitutes, Avakaaya was born: a deliberate effort to keep them alive and share them beyond the family table. What started as gifting jars to friends became a trusted name in Andhra households across the country.
            </p>
            <p>
              Today, Avakaaya ships to six countries — but the process is unchanged. The same sourcing regions, the same grinding method, the same resting time. Because authentic flavour has no shortcut.
            </p>
          </div>
        </div>
      </section>

      {/* Ingredients */}
      <section className="about-section about-ingredients-section">
        <div className="container">
          <div className="about-sec-head">
            <span className="about-sec-label">What Goes Inside</span>
            <h2>Sourced with Intention</h2>
            <p className="about-sec-sub">
              Every ingredient has a name, a place, and a reason. We never compromise on sourcing because the quality of what goes in directly determines what comes out.
            </p>
          </div>
          <div className="ingredients-grid">
            {INGREDIENTS.map(ing => (
              <div key={ing.name} className="ingredient-card">
                <span className="ing-emoji">{ing.emoji}</span>
                <div className="ing-body">
                  <h4 className="ing-name">{ing.name}</h4>
                  <span className="ing-source">📍 {ing.source}</span>
                  <p className="ing-note">{ing.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="about-section about-process-section">
        <div className="container">
          <div className="about-sec-head light">
            <span className="about-sec-label" style={{ color: 'var(--gold)' }}>The Method</span>
            <h2 style={{ color: 'var(--ivory)' }}>From Farm to Your Table</h2>
            <p className="about-sec-sub" style={{ color: 'rgba(250,246,237,0.65)' }}>
              Six steps. No skipped stages. Every batch, every time.
            </p>
          </div>
          <div className="process-grid">
            {PROCESS.map((p, i) => (
              <div key={p.step} className="process-card">
                <div className="process-num">{p.step}</div>
                <h4 className="process-title">{p.title}</h4>
                <p className="process-desc">{p.desc}</p>
                {i < PROCESS.length - 1 && <div className="process-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-section about-values-section">
        <div className="container">
          <div className="about-sec-head">
            <span className="about-sec-label">What We Stand For</span>
            <h2>Our Commitments to You</h2>
          </div>
          <div className="values-grid">
            {VALUES.map(v => (
              <div key={v.title} className="value-card">
                <span className="value-icon">{v.icon}</span>
                <h3 className="value-title">{v.title}</h3>
                <p className="value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="about-section about-reviews-section">
        <div className="container">
          <div className="about-sec-head">
            <span className="about-sec-label">Customer Stories</span>
            <h2>What Our Customers Say</h2>
            <p className="about-sec-sub">Real orders. Real families. Real Andhra flavour — wherever they are in the world.</p>
          </div>
          <div className="about-reviews-grid">
            {REVIEWS.map(r => (
              <div key={r.name} className="about-review-card">
                <div className="review-stars">★★★★★</div>
                <p className="review-text">"{r.text}"</p>
                <div className="review-author">
                  <div className="review-avatar">{r.initials}</div>
                  <div>
                    <strong>{r.name}</strong>
                    <span>{r.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container about-cta-inner">
          <div>
            <h2>Ready to taste the difference?</h2>
            <p>Browse our full range of authentic Andhra pickles, powders, snacks &amp; gift hampers.</p>
          </div>
          <div className="about-cta-btns">
            <Link to="/products" className="btn btn-gold btn-lg">Shop Now →</Link>
            <Link to="/contact" className="btn btn-ghost-dark btn-lg">Contact Us</Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
