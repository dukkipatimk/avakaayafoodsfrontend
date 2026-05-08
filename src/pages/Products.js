import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Products.css';

const CATEGORIES = [
  { value: '', label: 'All Products' },
  { value: 'pickles', label: '🫙 Pickles' },
  { value: 'powders', label: '🌶️ Powders' },
  { value: 'snacks', label: '🥜 Snacks' },
  { value: 'sweets', label: '🍬 Sweets' },
  { value: 'gift-hampers', label: '🎁 Gift Hampers' },
];

const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12, sort });
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    api.get(`/products?${params}`).then(r => {
      setProducts(r.data.products || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category, search, sort, page, minPrice, maxPrice]);

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
    setPage(1);
  };

  return (
    <div className="products-page">
      <div className="container">
        {/* Page header */}
        <div className="products-page-header">
          <div>
            <h1>
              {category
                ? CATEGORIES.find(c => c.value === category)?.label || 'Products'
                : search ? `Search: "${search}"` : 'All Products'}
            </h1>
            <p className="products-count">{total} products found</p>
          </div>
          <div className="products-controls">
            <select
              value={sort}
              onChange={e => setFilter('sort', e.target.value)}
              className="sort-select"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="products-layout">
          {/* Sidebar filters */}
          <aside className="filters-sidebar">
            <h3 className="filters-title">Categories</h3>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                className={`filter-btn ${category === c.value ? 'active' : ''}`}
                onClick={() => setFilter('category', c.value)}
              >
                {c.label}
              </button>
            ))}

            <h3 className="filters-title" style={{ marginTop: '32px' }}>Price Range</h3>
            <div className="price-range-inputs">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={e => setFilter('minPrice', e.target.value)}
                className="price-input"
                min="0"
              />
              <span className="price-range-sep">–</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={e => setFilter('maxPrice', e.target.value)}
                className="price-input"
                min="0"
              />
            </div>
            {(minPrice || maxPrice) && (
              <button
                className="filter-btn"
                onClick={() => { setFilter('minPrice', ''); setFilter('maxPrice', ''); }}
                style={{ marginTop: 8, color: 'var(--red-chili)' }}
              >
                ✕ Clear price filter
              </button>
            )}

            <h3 className="filters-title" style={{ marginTop: '32px' }}>Ships To</h3>
            {['India', 'USA', 'UK', 'Singapore', 'Australia', 'Malaysia'].map(c => (
              <label key={c} className="filter-checkbox">
                <input type="checkbox" /> {c}
              </label>
            ))}
          </aside>

          {/* Products grid */}
          <div className="products-main">
            {loading ? (
              <div className="products-grid">
                {Array(8).fill(0).map((_, i) => <div key={i} className="product-skeleton skeleton" style={{ height: 440 }} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="products-empty">
                <span className="products-empty-icon">🫙</span>
                <h2>No products found</h2>
                <p>Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map(p => <ProductCard key={p._id} product={p} />)}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >← Prev</button>
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        className={`page-btn ${page === p ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >{p}</button>
                    ))}
                    <button
                      className="page-btn"
                      disabled={page === pages}
                      onClick={() => setPage(p => p + 1)}
                    >Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
