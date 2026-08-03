import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import MiniCart from './MiniCart';
import OffersPanel from './OffersPanel';
import NavCoupon from './NavCoupon';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { trackEvent } from '../utils/tracking';
import { collectionApiFilters } from '../utils/seo';
import './Header.css';

const CAT_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" fill="#f3ecdc"/></svg>');
const catImg = (p) => p.thumbnail || (p.images && p.images[0]) || CAT_PLACEHOLDER;
const catLowPrice = (p) => { const ps = (p.variants || []).map((v) => Number(v.price)).filter((n) => n > 0); return ps.length ? Math.min(...ps) : null; };

// Two-tone (green outline + gold accent) category icons for the quick bar.
const catIco = (children) => (
  <svg className="cat-bar-ico" viewBox="0 0 48 48" fill="none" aria-hidden="true">{children}</svg>
);
const G = '#1c4a0e';   // brand green
const GD = '#c9a84c';  // gold accent
const CAT_ICONS = {
  'all': catIco(<>
    <path d="M9 23 24 10l15 13" stroke={G} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.5 21.5v15h23v-15" stroke={G} strokeWidth="2.6" strokeLinejoin="round"/>
    <rect x="20.5" y="26" width="7" height="10.5" rx="1" fill={GD}/>
  </>),
  'veg-pickles': catIco(<>
    <path d="M16 19h16v15a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" stroke={G} strokeWidth="2.4" strokeLinejoin="round"/>
    <rect x="14.5" y="12.5" width="19" height="6.5" rx="2" fill={GD}/>
    <path d="M24 35c-4.2-1-6.7-4.2-6-8.7 4.4.4 7.1 3.4 6 8.7z" fill="#3f8a26"/>
    <path d="M24 35c-.2-3.6 1-6.6 3.6-8.3" stroke={G} strokeWidth="1.5" strokeLinecap="round"/>
  </>),
  'non-veg-pickles': catIco(<>
    <path d="M16 19h16v15a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" stroke={G} strokeWidth="2.4" strokeLinejoin="round"/>
    <rect x="14.5" y="12.5" width="19" height="6.5" rx="2" fill={GD}/>
    <path d="M18.5 30c1.6 4 7 4.3 9-.6-2 .9-3.2-.1-5 .4s-3 .3-4 .2z" fill="#c0392b"/>
    <path d="M27.5 29.4c1.4-1 1.9-2.6 3.6-2.6" stroke="#3f8a26" strokeWidth="1.8" strokeLinecap="round"/>
  </>),
  'powders': catIco(<>
    <path d="M11 26h26a13 13 0 0 1-26 0z" stroke={G} strokeWidth="2.4" strokeLinejoin="round" fill="#fff"/>
    <path d="M28 26 34 15" stroke={G} strokeWidth="2.6" strokeLinecap="round"/>
    <circle cx="34.5" cy="13.5" r="2.7" fill={GD}/>
    <circle cx="19" cy="21" r="1.3" fill={GD}/>
    <circle cx="23" cy="18.5" r="1.3" fill={GD}/>
    <circle cx="26.5" cy="21.5" r="1.3" fill={GD}/>
  </>),
  'snacks': catIco(<>
    <path d="M24 11 39 37H9z" stroke={G} strokeWidth="2.6" strokeLinejoin="round" fill="#fff"/>
    <circle cx="21" cy="30" r="1.3" fill={GD}/>
    <circle cx="26.5" cy="28" r="1.3" fill={GD}/>
    <circle cx="24" cy="33.5" r="1.3" fill={GD}/>
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
    <rect x="12" y="22.5" width="24" height="14.5" rx="1.5" stroke={G} strokeWidth="2.4" strokeLinejoin="round"/>
    <rect x="10" y="17" width="28" height="6" rx="1.5" stroke={G} strokeWidth="2.4" strokeLinejoin="round"/>
    <path d="M24 17.5v19.5" stroke={G} strokeWidth="2"/>
    <path d="M24 17.5c-1.4-4-8-3.6-6.4.4 1 2.4 4.5 1.1 6.4-.4zM24 17.5c1.4-4 8-3.6 6.4.4-1 2.4-4.5 1.1-6.4-.4z" fill={GD} stroke={G} strokeWidth="1.2"/>
  </>),
};

const ANNOUNCE_ITEMS = [
  '🚚 Delivery in 1–2 days within India',
  '🌿 No preservatives — 100% natural ingredients',
  '🌍 Delivering to USA · UK · Singapore · Australia · Malaysia',
  '⭐ 10,000+ happy customers worldwide',
  '📦 FSSAI certified · Small batches · Traditional recipes',
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [addedIds, setAddedIds] = useState({});
  const searchRef = useRef(null);
  const { user, logout } = useAuth();
  const { totalItems, addItem, subtotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active coupons — shown as a slider in the top bar.
  useEffect(() => {
    api.get('/coupons/active')
      .then(r => setCoupons(r.data.coupons || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setShowDropdown(false);
    setSearchQuery('');
    setCartOpen(false);
    setOffersOpen(false);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`);
        const data = await res.json();
        setSearchResults(data.products || []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchOpen(false);
      setShowDropdown(false);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setShowDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
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

  // Category mega-menu (hover a category → preview its products).
  const [openCat, setOpenCat] = useState(null);
  const [catProducts, setCatProducts] = useState({});
  const [catLoading, setCatLoading] = useState(false);
  const catCloseTimer = useRef(null);
  const cancelCatClose = () => clearTimeout(catCloseTimer.current);
  const scheduleCatClose = () => { clearTimeout(catCloseTimer.current); catCloseTimer.current = setTimeout(() => setOpenCat(null), 150); };
  const openCategory = (slug) => {
    cancelCatClose();
    setOpenCat(slug);
    // Refetch when we have nothing cached OR the cached result was empty, so a
    // transient empty response never sticks for the whole session.
    if (slug && !(catProducts[slug] && catProducts[slug].length)) {
      setCatLoading(true);
      const params = new URLSearchParams({ ...collectionApiFilters(slug), limit: 30 });
      api.get(`/products?${params}`)
        .then((r) => setCatProducts((p) => ({ ...p, [slug]: r.data.products || [] })))
        .catch(() => setCatProducts((p) => ({ ...p, [slug]: [] })))
        .finally(() => setCatLoading(false));
    }
  };

  const categories = [
    { label: 'Veg Pickles', path: '/collections/veg-pickles' },
    { label: 'Non-Veg Pickles', path: '/collections/non-veg-pickles' },
    { label: 'Podis & Powders', path: '/collections/powders' },
    { label: 'Snacks', path: '/collections/snacks' },
    { label: 'Sweets', path: '/collections/sweets' },
    { label: 'Ghee', path: '/collections/ghee' },
    { label: 'Gift Hampers', path: '/collections/gift-hampers' },
    { label: 'Build a Hamper', path: '/gift-hamper' },
  ];

  return (
    <>
      {/* Scrolling announcement bar — pinned to the bottom of the page */}
      <div className="header-banner">
        <div className="header-banner-track">
          {[...ANNOUNCE_ITEMS, ...ANNOUNCE_ITEMS].map((item, i) => (
            <span key={i} className="header-banner-item">
              {item}<span className="header-banner-sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="header-inner">
          {/* Hamburger — far left (mobile only) */}
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" aria-expanded={menuOpen}>
            <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
          </button>

          {/* Logo */}
          <Link to="/" className="logo">
            <img src="/avakaaya-logo.png" alt="Avakaaya Foods" className="logo-img" />
          </Link>

          {/* Brand wordmark */}
          <Link to="/" className="brand-block" aria-label="Avakaaya Foods home">
            <span className="brand-flourish" aria-hidden="true">&#10086;</span>
            <span className="brand-name">Avakaaya Foods</span>
            <span className="brand-tagline">
              Authentic Telugu Pickles <span className="brand-dot">&bull;</span> Sweets <span className="brand-dot">&bull;</span> Snacks
            </span>
            <span className="brand-tagline-sm">pickles <span className="brand-dot">&bull;</span> sweets <span className="brand-dot">&bull;</span> snacks</span>
            <span className="brand-flourish" aria-hidden="true">&#10086;</span>
          </Link>

          <div className="header-center">
          {/* Nav */}
          <nav className={`nav ${menuOpen ? 'nav--open' : ''}`}>
            <div className="nav-primary">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
            <div className="nav-dropdown">
              <Link to="/products" className="nav-link">Shop ▾</Link>
              <div className="dropdown-menu">
                <Link to="/products" className="dropdown-item">All Products</Link>
                {categories.map(c => (
                  <Link key={c.label} to={c.path} className="dropdown-item">{c.label}</Link>
                ))}
              </div>
            </div>
            <NavLink to="/shipping-info" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Shipping</NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>About</NavLink>
            <NavLink to="/contact" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Contact Us</NavLink>
            </div>
          </nav>
            <div className="nav-contact">
            <a
              href="tel:+919105299399"
              className="nav-link nav-link--phone"
              aria-label="Call our store"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>+91 91052 99399</span>
            </a>
            <a
              href="https://wa.me/919115595959?text=Hi%2C%20I%20have%20a%20question%20about%20Avakaaya%20Foods"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link nav-link--whatsapp"
              aria-label="Chat with us on WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>+91 91155 95959</span>
            </a>
            </div>
          </div>

          {/* Actions */}
          <div className="header-actions">
            {/* Offers */}
            <button
              className="action-btn action-offers"
              onClick={() => setOffersOpen(true)}
              aria-label="View available offers"
              title="Offers"
            >
              <span className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </span>
              <span className="action-label">Offers</span>
            </button>

            {/* Search */}
            <button className="action-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
              <span className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <span className="action-label">Search</span>
            </button>

            {/* Account */}
            {user ? (
              <div className="nav-dropdown action-dropdown">
                <button className="action-btn" aria-label="Open account menu">
                  <span className="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
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
                <span className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <span className="action-label">Login</span>
              </Link>
            )}

            {/* Cart */}
            <button className="action-btn cart-action" onClick={() => setCartOpen(true)} aria-label="Open cart">
              <span className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </span>
              <span className="action-label">Cart</span>
            </button>
          </div>
        </div>

        {/* Search bar — always visible on mobile; toggled on desktop */}
        <div className={`search-bar${searchOpen ? ' is-open' : ''}`}>
            <div className="search-form container" ref={searchRef}>
              <form onSubmit={handleSearch} className="search-form-inner">
                <input
                  type="text"
                  placeholder="Search pickles, powders, snacks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="btn btn-primary btn-sm">Search</button>
                <button type="button" onClick={closeSearch} className="search-close">✕</button>
              </form>

              {/* Live results dropdown */}
              {showDropdown && (
                <div className="search-dropdown">
                  {searchLoading && (
                    <div className="search-dropdown-loading">Searching…</div>
                  )}
                  {!searchLoading && searchResults.length === 0 && (
                    <div className="search-dropdown-empty">No products found</div>
                  )}
                  {!searchLoading && searchResults.map(product => (
                    <div key={product._id} className="search-result-item">
                      <Link
                        to={`/products/${product.slug}`}
                        className="search-result-link"
                        onClick={closeSearch}
                      >
                        <img
                          src={product.thumbnail || product.images?.[0] || '/placeholder.jpg'}
                          alt={product.name}
                          className="search-result-img"
                        />
                        <div className="search-result-info">
                          <span className="search-result-name">{product.name}</span>
                          <span className="search-result-meta">
                            {product.category}
                            {product.variants?.[0] && ` · ₹${product.variants[0].price}`}
                          </span>
                        </div>
                      </Link>
                      <button
                        className={`search-result-add ${addedIds[product._id] ? 'added' : ''}`}
                        onClick={(e) => handleQuickAdd(e, product)}
                        title={`Add ${product.variants?.[0]?.weight || ''} to cart`}
                      >
                        {addedIds[product._id] ? '✓' : '+'}
                      </button>
                    </div>
                  ))}
                  {!searchLoading && searchResults.length > 0 && (
                    <Link
                      to={`/products?search=${encodeURIComponent(searchQuery)}`}
                      className="search-view-all"
                      onClick={closeSearch}
                    >
                      View all results for "{searchQuery}" →
                    </Link>
                  )}
                </div>
              )}
            </div>
        </div>
      </header>

      {/* Quick category bar with a product mega-menu on hover */}
      <div className="cat-bar-wrap">
        <nav className="cat-bar" aria-label="Shop by category" onMouseLeave={scheduleCatClose} onMouseEnter={cancelCatClose}>
          <NavLink to="/products" end onMouseEnter={() => { cancelCatClose(); setOpenCat(null); }} className={({ isActive }) => `cat-bar-link cat-bar-all${isActive ? ' active' : ''}`}>
            {CAT_ICONS['all']}<span className="cat-bar-label">All</span>
          </NavLink>
          {categories.filter((c) => c.path !== '/collections/gift-hampers').map((c) => {
            const slug = c.path.startsWith('/collections/') ? c.path.split('/').pop() : null;
            const iconKey = c.path.split('/').pop();
            return (
              <NavLink key={c.label} to={c.path}
                onMouseEnter={() => { if (slug) openCategory(slug); else { cancelCatClose(); setOpenCat(null); } }}
                className={({ isActive }) => `cat-bar-link${isActive ? ' active' : ''}`}>
                {CAT_ICONS[iconKey]}<span className="cat-bar-label">{c.label}</span>
              </NavLink>
            );
          })}
        </nav>
        {openCat && (
          <div className="cat-mega" onMouseEnter={cancelCatClose} onMouseLeave={scheduleCatClose}>
            <div className="cat-mega-inner">
              {(!catProducts[openCat] && catLoading)
                ? <div className="cat-mega-empty">Loading…</div>
                : (catProducts[openCat]?.length ? (
                  <>
                    {catProducts[openCat].slice(0, 30).map((p) => (
                      <Link key={p._id} to={`/products/${p.slug}`} className="cat-mega-item" onClick={() => setOpenCat(null)}>
                        <img src={catImg(p)} alt={p.name} className="cat-mega-img" loading="lazy" />
                        <span className="cat-mega-name">{p.name}</span>
                        {catLowPrice(p) != null && <span className="cat-mega-price">₹{catLowPrice(p)}</span>}
                      </Link>
                    ))}
                    <Link to={`/collections/${openCat}`} className="cat-mega-all" onClick={() => setOpenCat(null)}>View all ›</Link>
                  </>
                ) : <div className="cat-mega-empty">No products in this category yet.</div>)}
            </div>
          </div>
        )}
      </div>

      <MiniCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Mobile bottom toolbar */}
      <nav className="bottom-toolbar" aria-label="Mobile navigation">
        <Link to="/" className="bottom-toolbar-item" aria-label="Home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4M3 9v11a2 2 0 0 0 2 2h4M3 9l9 7 9-7"/>
            <path d="M9 22V12h6v10"/>
          </svg>
          <span>Home</span>
        </Link>

        <Link to="/products" className="bottom-toolbar-item" aria-label="Shop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span>Shop</span>
        </Link>

        <button
          className="bottom-toolbar-item bottom-toolbar-item--cart"
          onClick={() => setCartOpen(true)}
          aria-label={`Cart, ${totalItems} items`}
        >
          <span className="bottom-toolbar-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && <span className="bottom-toolbar-badge">{totalItems}</span>}
          </span>
          <span>Cart</span>
        </button>

        <a
          href="https://wa.me/919115595959?text=Hi%2C%20I%20have%20a%20question%20about%20Avakaaya%20Foods"
          target="_blank"
          rel="noopener noreferrer"
          className="bottom-toolbar-item bottom-toolbar-item--whatsapp"
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span>WhatsApp</span>
        </a>

        <button
          className="bottom-toolbar-item"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span>Menu</span>
        </button>
      </nav>

      {/* Right-side floating action menu (desktop only) */}
      <div className="side-menu" aria-label="Quick actions">
        {coupons.length > 0 && <NavCoupon coupons={coupons} />}
        <a
          href="https://wa.me/919115595959?text=Hi%2C%20I%20have%20a%20question%20about%20Avakaaya%20Foods"
          target="_blank"
          rel="noopener noreferrer"
          className="side-menu-btn side-menu-btn--whatsapp"
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="side-menu-tooltip">Chat with us</span>
        </a>
        <button
          className="side-menu-btn side-menu-btn--cart"
          onClick={() => setCartOpen(true)}
          aria-label={`Open cart, ${totalItems} items`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {totalItems > 0 && <span className="side-menu-badge">{totalItems}</span>}
          <span className="side-menu-tooltip">Cart ({totalItems})</span>
        </button>
      </div>

      <OffersPanel isOpen={offersOpen} onClose={() => setOffersOpen(false)} />
    </>
  );
};

export default Header;
