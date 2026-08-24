import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import MiniCart from './MiniCart';
import OffersPanel from './OffersPanel';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { trackEvent } from '../utils/tracking';
import { productCategorySlug } from '../utils/seo';
import './Header.css';


// Small two-tone category icons for the category bar.
const G = '#1c4a0e';    // brand green
const GD = '#c9a84c';   // gold accent
const M = '#8a1a1a';    // maroon
const R = '#c0392b';    // chilli red
const catIco = (children) => (
  <svg className="cat-bar-ico" viewBox="0 0 48 48" fill="none" aria-hidden="true">{children}</svg>
);
const CAT_ICONS = {
  'all': catIco(<>
    <rect x="9" y="9" width="12.5" height="12.5" rx="2.5" stroke={M} strokeWidth="2.6"/>
    <rect x="26.5" y="9" width="12.5" height="12.5" rx="2.5" stroke={M} strokeWidth="2.6"/>
    <rect x="9" y="26.5" width="12.5" height="12.5" rx="2.5" stroke={M} strokeWidth="2.6"/>
    <rect x="26.5" y="26.5" width="12.5" height="12.5" rx="2.5" stroke={M} strokeWidth="2.6"/>
  </>),
  'veg-pickles': catIco(<>
    <path d="M16 19h16v15a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" stroke={G} strokeWidth="2.4" strokeLinejoin="round"/>
    <rect x="14.5" y="12.5" width="19" height="6.5" rx="2" fill={GD}/>
    <path d="M24 35c-4.2-1-6.7-4.2-6-8.7 4.4.4 7.1 3.4 6 8.7z" fill="#3f8a26"/>
  </>),
  'non-veg-pickles': catIco(<>
    <path d="M16 19h16v15a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" stroke={G} strokeWidth="2.4" strokeLinejoin="round"/>
    <rect x="14.5" y="12.5" width="19" height="6.5" rx="2" fill={GD}/>
    <path d="M18.5 30c1.6 4 7 4.3 9-.6-2 .9-3.2-.1-5 .4s-3 .3-4 .2z" fill={R}/>
  </>),
  'powders': catIco(<>
    <path d="M11 26h26a13 13 0 0 1-26 0z" stroke={G} strokeWidth="2.4" strokeLinejoin="round" fill="#fff"/>
    <path d="M28 26 34 15" stroke={G} strokeWidth="2.6" strokeLinecap="round"/>
    <circle cx="34.5" cy="13.5" r="2.7" fill={GD}/>
    <circle cx="19" cy="21" r="1.3" fill={GD}/><circle cx="23" cy="18.5" r="1.3" fill={GD}/><circle cx="26.5" cy="21.5" r="1.3" fill={GD}/>
  </>),
  'snacks': catIco(<>
    <path d="M24 11 39 37H9z" stroke={G} strokeWidth="2.6" strokeLinejoin="round" fill="#fff"/>
    <circle cx="21" cy="30" r="1.3" fill={GD}/><circle cx="26.5" cy="28" r="1.3" fill={GD}/><circle cx="24" cy="33.5" r="1.3" fill={GD}/>
  </>),
  'sweets': catIco(<>
    <circle cx="18" cy="24" r="4.4" fill={GD} stroke={G} strokeWidth="1.4"/>
    <circle cx="30" cy="24" r="4.4" fill={GD} stroke={G} strokeWidth="1.4"/>
    <circle cx="24" cy="20" r="4.4" fill={GD} stroke={G} strokeWidth="1.4"/>
    <path d="M10 27h28a14 14 0 0 1-28 0z" fill="#fff" stroke={G} strokeWidth="2.4" strokeLinejoin="round"/>
  </>),
  'ghee': catIco(<>
    <path d="M16 21h16l-1.5 15a3.5 3.5 0 0 1-3.5 3H21a3.5 3.5 0 0 1-3.5-3z" fill="#fff" stroke={G} strokeWidth="2.4" strokeLinejoin="round"/>
    <ellipse cx="24" cy="21" rx="8.5" ry="2.7" fill={GD} stroke={G} strokeWidth="1.5"/>
    <path d="M18 21c0-6 12-6 12 0" stroke={G} strokeWidth="2"/>
  </>),
  'gift-hamper': catIco(<>
    <rect x="12" y="22.5" width="24" height="14.5" rx="1.5" stroke={M} strokeWidth="2.4" strokeLinejoin="round"/>
    <rect x="10" y="17" width="28" height="6" rx="1.5" stroke={M} strokeWidth="2.4" strokeLinejoin="round"/>
    <path d="M24 17.5v19.5" stroke={M} strokeWidth="2"/>
    <path d="M24 17.5c-1.4-4-8-3.6-6.4.4 1 2.4 4.5 1.1 6.4-.4zM24 17.5c1.4-4 8-3.6 6.4.4-1 2.4-4.5 1.1-6.4-.4z" fill={GD} stroke={M} strokeWidth="1.2"/>
  </>),
};

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [addedIds, setAddedIds] = useState({});
  const searchRef = useRef(null);
  const { user, logout } = useAuth();
  const { totalItems, addItem, subtotal } = useCart();
  const { openQuickOrder, focusSearch } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Representative product photo per category for the category bar.
  const [catImages, setCatImages] = useState({});
  useEffect(() => {
    api.get('/products?limit=100').then((r) => {
      const bySlug = {};
      for (const p of (r.data.products || [])) {
        const img = p.thumbnail || (p.images && p.images[0]);
        if (!img) continue;
        const slug = productCategorySlug(p);
        (bySlug[slug] = bySlug[slug] || []).push({ name: (p.name || '').toLowerCase(), img });
      }
      const first = (slug) => (bySlug[slug] && bySlug[slug][0] ? bySlug[slug][0].img : null);
      const pick = (slug, kw) => { const l = bySlug[slug] || []; return ((l.find((x) => x.name.includes(kw)) || l[0] || {}).img) || null; };
      setCatImages({
        'veg-pickles': pick('veg-pickles', 'mango'),
        'non-veg-pickles': pick('non-veg-pickles', 'chicken'),
        'powders': first('powders'),
        'snacks': first('snacks'),
        'sweets': first('sweets'),
        'ghee': first('ghee'),
        'gift-hamper': first('gift-hampers'),
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setShowDropdown(false);
    setSearchQuery('');
    setCartOpen(false);
    setOffersOpen(false);
  }, [location]);

  // Close the search dropdown when clicking outside
  useEffect(() => {
    const onClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced live search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(q)}&limit=6`);
        setSearchResults(res.data.products || []);
        setShowDropdown(true);
      } catch { setSearchResults([]); } finally { setSearchLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };
  const closeSearch = () => { setShowDropdown(false); setSearchQuery(''); setSearchResults([]); };

  const handleQuickAdd = (e, product) => {
    e.preventDefault(); e.stopPropagation();
    const variant = product.variants?.[0];
    if (!variant) return;
    addItem(product, variant);
    const addedValue = Number(variant.price) || 0;
    trackEvent('add_to_cart', {
      productId: product._id,
      cartValue: subtotal + addedValue,
      cartItems: [{ productId: product._id, name: product.name, weight: variant.weight, quantity: 1, price: variant.price }],
      metadata: { source: 'search_quick_add', addedValue },
    });
    toast.success(`${product.name} (${variant.weight}) added to cart!`);
    setAddedIds(prev => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAddedIds(prev => { const n = { ...prev }; delete n[product._id]; return n; }), 1500);
  };

  const categories = [
    { label: 'Veg Pickles', path: '/collections/veg-pickles' },
    { label: 'Non-Veg Pickles', path: '/collections/non-veg-pickles' },
    { label: 'Podis & Powders', path: '/collections/powders' },
    { label: 'Snacks', path: '/collections/snacks' },
    { label: 'Sweets', path: '/collections/sweets' },
    { label: 'Ghee', path: '/collections/ghee' },
    { label: 'Build a Hamper', path: '/gift-hamper' },
  ];

  const WA = 'https://wa.me/919115595959?text=Hi%2C%20I%20have%20a%20question%20about%20Avakaaya%20Foods';

  // A category shows a product photo when we have one, else the line icon.
  const catThumb = (key) => (catImages[key]
    ? <img className="cat-bar-thumb" src={catImages[key]} alt="" aria-hidden="true" loading="lazy" />
    : (CAT_ICONS[key] || null));

  return (
    <>
      {/* ── Top utility bar ─────────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-inner container-wide">
          <div className="topbar-left">
            {/* ₹2,000 is the real India free-shipping rule (SHIPPING_ZONES.india.freeAbove). */}
            <span className="topbar-item topbar-item--highlight">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><rect x="1" y="6" width="14" height="11" rx="1.5"/><path d="M15 9h4l3 3.5V17h-7z"/><circle cx="6" cy="18.5" r="1.7"/><circle cx="17.5" cy="18.5" r="1.7"/></svg>
              Free shipping above ₹2,000 in India
            </span>
            <span className="topbar-sep" />
            <span className="topbar-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>
              Worldwide Shipping to 180+ Countries
            </span>
            <span className="topbar-sep" />
            <span className="topbar-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
              Since 2000, Trusted by Millions
            </span>
          </div>

          <div className="topbar-right">
            <Link to="/my-orders" className="topbar-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>
              Track Order
            </Link>
            <span className="topbar-sep" />
            <Link to="/contact" className="topbar-item">Help &amp; Support</Link>
            <span className="topbar-sep" />
            <Link to="/store-locations" className="topbar-item">Store Locator</Link>
            <span className="topbar-sep" />
            <a href="tel:+919105299399" className="topbar-item topbar-item--accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              +91 91052 99399
            </a>
          </div>
        </div>
      </div>

      {/* ── Main header + category bar (one sticky unit) ────────────── */}
      <div className="site-header">
      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="header-inner container-wide">
          {/* Mobile hamburger */}
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" aria-expanded={menuOpen}>
            <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
          </button>

          {/* Logo */}
          <Link to="/" className="logo" aria-label="Avakaaya Foods home">
            <img src="/avakaaya-logo.png" alt="Avakaaya Foods" className="logo-img" />
          </Link>

          {/* Brand wordmark */}
          <Link to="/" className="brand-block" aria-label="Avakaaya Foods home">
            <span className="brand-name">Avakaaya Foods</span>
            <span className="brand-tagline">Authentic Telugu Pickles <span className="brand-dot">•</span> Sweets <span className="brand-dot">•</span> Snacks</span>
            <span className="brand-since">Since 2000</span>
          </Link>

          {/* Search */}
          <form className="header-search" onSubmit={handleSearch} ref={searchRef} role="search">
            <input
              type="text"
              className="header-search-input"
              placeholder="Search pickles, sweets, snacks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length) setShowDropdown(true); }}
            />
            <button type="submit" className="header-search-btn" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>

            {showDropdown && (
              <div className="search-dropdown">
                {searchLoading && <div className="search-dropdown-loading">Searching…</div>}
                {!searchLoading && searchResults.length === 0 && <div className="search-dropdown-empty">No products found</div>}
                {!searchLoading && searchResults.map((product) => (
                  <div key={product._id} className="search-result-item">
                    <Link to={`/products/${product.slug}`} className="search-result-link" onClick={closeSearch}>
                      <img src={product.thumbnail || product.images?.[0] || '/placeholder.jpg'} alt={product.name} className="search-result-img" />
                      <div className="search-result-info">
                        <span className="search-result-name">{product.name}</span>
                        <span className="search-result-meta">{product.category}{product.variants?.[0] && ` · ₹${product.variants[0].price}`}</span>
                      </div>
                    </Link>
                    <button className={`search-result-add ${addedIds[product._id] ? 'added' : ''}`} onClick={(e) => handleQuickAdd(e, product)} title="Add to cart">
                      {addedIds[product._id] ? '✓' : '+'}
                    </button>
                  </div>
                ))}
                {!searchLoading && searchResults.length > 0 && (
                  <Link to={`/products?search=${encodeURIComponent(searchQuery)}`} className="search-view-all" onClick={closeSearch}>
                    View all results for "{searchQuery}" →
                  </Link>
                )}
              </div>
            )}
          </form>

          {/* Contact pills */}
          <div className="header-contact">
            <div className="contact-item">
              <a href="tel:+919105299399" className="contact-pill contact-pill--phone" aria-label="Call our store">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                +91 91052 99399
              </a>
            </div>
            <div className="contact-item">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="contact-pill contact-pill--whatsapp" aria-label="Chat on WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                +91 91155 95959
              </a>
            </div>
          </div>

          <span className="header-divider" aria-hidden="true" />

          {/* Actions: Account · Wishlist · Cart */}
          <div className="header-actions">
            {user ? (
              <div className="nav-dropdown action-dropdown">
                <button className="action-btn" aria-label="Account menu">
                  <span className="action-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                  <span className="action-label">Account</span>
                </button>
                <div className="dropdown-menu dropdown-menu--right">
                  <span className="dropdown-name">Hi, {user.name.split(' ')[0]}</span>
                  <Link to="/account" className="dropdown-item">My Account</Link>
                  <Link to="/my-orders" className="dropdown-item">My Orders</Link>
                  {(user.role === 'admin' || user.role === 'store_manager' || user.role === 'super_admin') && <Link to="/admin" className="dropdown-item">Admin Panel</Link>}
                  <button onClick={logout} className="dropdown-item dropdown-item--danger">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="action-btn">
                <span className="action-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                <span className="action-label">Account</span>
              </Link>
            )}

            <Link to="/wishlist" className="action-btn wishlist-action">
              <span className="action-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></span>
              <span className="action-label">Wishlist</span>
            </Link>

            <button className="action-btn cart-action" onClick={() => setCartOpen(true)} aria-label="Open cart">
              <span className="action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </span>
              <span className="action-label">
                {totalItems > 0 ? `₹${subtotal.toLocaleString('en-IN')}` : 'Cart'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer (opened from the hamburger / bottom Menu) */}
      <nav className={`nav ${menuOpen ? 'nav--open' : ''}`} aria-label="Main menu">
        <NavLink to="/" end className="nav-link" onClick={() => setMenuOpen(false)}>Home</NavLink>
        <NavLink to="/products" className="nav-link" onClick={() => setMenuOpen(false)}>Shop All</NavLink>
        {categories.map((c) => (
          <NavLink key={c.label} to={c.path} className="nav-link" onClick={() => setMenuOpen(false)}>{c.label}</NavLink>
        ))}
        <NavLink to="/shipping-info" className="nav-link" onClick={() => setMenuOpen(false)}>Shipping</NavLink>
        <NavLink to="/about" className="nav-link" onClick={() => setMenuOpen(false)}>About</NavLink>
        <NavLink to="/contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contact Us</NavLink>
      </nav>

      {/* ── Category bar ────────────────────────────────────────────── */}
      <div className="cat-bar-wrap">
        <nav className="cat-bar container-wide" aria-label="Shop by category">
          <Link to="/products" className="shop-by-cat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            Shop by Category
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14" className="shop-by-cat-caret"><path d="M6 9l6 6 6-6"/></svg>
          </Link>

          <div className="cat-bar-list">
            {/* Product categories only. Hampers, combos, new arrivals and offers
                live on the home page and in the menu drawer, not here. */}
            {categories.filter((c) => c.path !== '/gift-hamper').map((c) => {
              const iconKey = c.path.split('/').pop();
              return (
                <NavLink key={c.label} to={c.path}
                  className={({ isActive }) => `cat-bar-link${isActive ? ' active' : ''}`}>
                  {catThumb(iconKey)}<span className="cat-bar-label">{c.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
      </div>

      <MiniCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Mobile bottom toolbar */}
      <nav className="bottom-toolbar" aria-label="Mobile navigation">
        <Link to="/" className="bottom-toolbar-item" aria-label="Home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4M3 9v11a2 2 0 0 0 2 2h4M3 9l9 7 9-7"/><path d="M9 22V12h6v10"/></svg>
          <span>Home</span>
        </Link>
        <button className="bottom-toolbar-item" onClick={focusSearch} aria-label="Search products">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span>Search</span>
        </button>

        {/* Centre action: the fastest path to a repeat order. */}
        <button className="bottom-toolbar-item bottom-toolbar-item--fab" onClick={openQuickOrder} aria-label="Quick order">
          <span className="bottom-toolbar-fab">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></svg>
          </span>
          <span>Quick Order</span>
        </button>

        <button className="bottom-toolbar-item" onClick={() => setMenuOpen(!menuOpen)} aria-label="Browse categories" aria-expanded={menuOpen}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          <span>Categories</span>
        </button>

        <Link to={user ? '/account' : '/login'} className="bottom-toolbar-item" aria-label="Account">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Account</span>
        </Link>
      </nav>

      {/* Right-side floating action menu (desktop only) */}
      <div className="side-menu" aria-label="Quick actions">
        <a href={WA} target="_blank" rel="noopener noreferrer" className="side-menu-btn side-menu-btn--whatsapp" aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          <span className="side-menu-tooltip">Chat with us</span>
        </a>
        <button className="side-menu-btn side-menu-btn--cart" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${totalItems} items`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          {totalItems > 0 && <span className="side-menu-badge">{totalItems}</span>}
          <span className="side-menu-tooltip">Cart ({totalItems})</span>
        </button>
      </div>

      <OffersPanel isOpen={offersOpen} onClose={() => setOffersOpen(false)} />
    </>
  );
};

export default Header;
