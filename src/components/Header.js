import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import MiniCart from './MiniCart';
import toast from 'react-hot-toast';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedIds, setAddedIds] = useState({});
  const searchRef = useRef(null);
  const { user, logout } = useAuth();
  const { totalItems, addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setShowDropdown(false);
    setSearchQuery('');
    setCartOpen(false);
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
    toast.success(`${product.name} (${variant.weight}) added to cart!`);
    setAddedIds(prev => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAddedIds(prev => { const n = { ...prev }; delete n[product._id]; return n; }), 1500);
  };

  const categories = [
    { label: 'Pickles', path: '/products?category=pickles' },
    { label: 'Powders', path: '/products?category=powders' },
    { label: 'Snacks', path: '/products?category=snacks' },
    { label: 'Gift Hampers', path: '/products?category=gift-hampers' },
    { label: 'Build a Hamper', path: '/gift-hamper' },
  ];

  return (
    <>
      {/* Top banner */}
      <div className="header-banner">
        <span>🌶️ Free shipping on orders above ₹999 within India &nbsp;|&nbsp; 🌍 We ship to USA, UK, Singapore, Australia & Malaysia</span>
      </div>

      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="header-inner container">
          {/* Logo */}
          <Link to="/" className="logo">
            <img src="/avakaaya-logo.png" alt="Avakaaya Foods" className="logo-img" />
          </Link>

          {/* Nav */}
          <nav className={`nav ${menuOpen ? 'nav--open' : ''}`}>
            <Link to="/" className="nav-link">Home</Link>
            <div className="nav-dropdown">
              <Link to="/products" className="nav-link">Shop ▾</Link>
              <div className="dropdown-menu">
                <Link to="/products" className="dropdown-item">All Products</Link>
                {categories.map(c => (
                  <Link key={c.label} to={c.path} className="dropdown-item">{c.label}</Link>
                ))}
              </div>
            </div>
            <Link to="/shipping-info" className="nav-link">Shipping</Link>
            <Link to="/about" className="nav-link">About</Link>
          </nav>

          {/* Actions */}
          <div className="header-actions">
            {/* Search */}
            <button className="icon-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {/* Account */}
            {user ? (
              <div className="nav-dropdown">
                <button className="icon-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </button>
                <div className="dropdown-menu dropdown-menu--right">
                  <span className="dropdown-name">Hi, {user.name.split(' ')[0]}</span>
                  <Link to="/account" className="dropdown-item">My Account</Link>
                  <Link to="/my-orders" className="dropdown-item">My Orders</Link>
                  {user.role === 'admin' && <Link to="/admin" className="dropdown-item">Admin Panel</Link>}
                  <button onClick={logout} className="dropdown-item dropdown-item--danger">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="icon-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </Link>
            )}

            {/* Cart */}
            <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)} aria-label="Open cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>

            {/* Mobile hamburger */}
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="search-bar">
            <div className="search-form container" ref={searchRef}>
              <form onSubmit={handleSearch} className="search-form-inner">
                <input
                  type="text"
                  placeholder="Search pickles, powders, snacks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
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
        )}
      </header>

      <MiniCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Header;
