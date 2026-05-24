import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import { CATEGORY_SEO, SITE_URL, categoryPath } from '../utils/seo';
import './Products.css';

const CATEGORIES = [
  { value: '', label: 'All Products' },
  { value: 'pickles', label: 'Pickles' },
  { value: 'powders', label: 'Podis & Powders' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'sweets', label: 'Sweets' },
  { value: 'ghee', label: 'Ghee' },
  { value: 'gift-hampers', label: 'Gift Hampers' },
];

const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const Products = ({ collectionPage = false }) => {
  const navigate = useNavigate();
  const { category: collectionCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const category = collectionPage ? (collectionCategory || '') : (searchParams.get('category') || '');
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const categorySeo = CATEGORY_SEO[category];
  const validCollection = !collectionPage || Boolean(categorySeo);
  const canonicalPath = categorySeo ? categoryPath(category) : '/products';
  const isFilteredPage = Boolean(search || minPrice || maxPrice || page > 1 || sort !== 'newest');

  const breadcrumbSchema = useMemo(() => categorySeo ? ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: categorySeo.name, item: `${SITE_URL}${categoryPath(category)}` },
    ],
  }) : null, [category, categorySeo]);

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

  const setFilter = (key, value) => {
    if (key === 'category') {
      navigate(value ? categoryPath(value) : '/products');
      setPage(1);
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    setSearchParams(params);
    setPage(1);
  };

  return (
    <div className="products-page">
      <Seo
        title={categorySeo ? categorySeo.title : 'Shop Andhra Foods Online | Avakaaya Foods'}
        description={categorySeo ? categorySeo.description : 'Browse authentic Andhra pickles, podis, snacks, sweets, ghee and gift hampers from Avakaaya Foods.'}
        path={canonicalPath}
        noIndex={!validCollection || isFilteredPage}
        jsonLd={breadcrumbSchema ? [breadcrumbSchema] : []}
      />
      <div className="container">
        <div className="products-page-header">
          <div>
            <h1>{categorySeo ? categorySeo.name : search ? `Search: "${search}"` : 'All Products'}</h1>
            <p className="products-count">{total} products found</p>
            {categorySeo && <p className="products-category-intro">{categorySeo.introduction}</p>}
          </div>
          <div className="products-controls">
            <select value={sort} onChange={event => setFilter('sort', event.target.value)} className="sort-select">
              {SORTS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>

        <div className="products-layout">
          <aside className="filters-sidebar">
            <h3 className="filters-title">Categories</h3>
            {CATEGORIES.map(option => (
              <button
                key={option.value}
                className={`filter-btn ${category === option.value ? 'active' : ''}`}
                onClick={() => setFilter('category', option.value)}
              >
                {option.label}
              </button>
            ))}

            <h3 className="filters-title" style={{ marginTop: '32px' }}>Price Range</h3>
            <div className="price-range-inputs">
              <input type="number" placeholder="Min INR" value={minPrice} onChange={event => setFilter('minPrice', event.target.value)} className="price-input" min="0" />
              <span className="price-range-sep">-</span>
              <input type="number" placeholder="Max INR" value={maxPrice} onChange={event => setFilter('maxPrice', event.target.value)} className="price-input" min="0" />
            </div>
            {(minPrice || maxPrice) && (
              <button className="filter-btn" onClick={() => { setFilter('minPrice', ''); setFilter('maxPrice', ''); }} style={{ marginTop: 8, color: 'var(--red-chili)' }}>
                Clear price filter
              </button>
            )}

            <h3 className="filters-title" style={{ marginTop: '32px' }}>Ships To</h3>
            {['India', 'USA', 'UK', 'Singapore', 'Australia', 'Malaysia'].map(country => (
              <label key={country} className="filter-checkbox">
                <input type="checkbox" /> {country}
              </label>
            ))}
          </aside>

          <div className="products-main">
            {loading ? (
              <div className="products-grid">
                {Array(8).fill(0).map((_, index) => <div key={index} className="product-skeleton skeleton" style={{ height: 440 }} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="products-empty">
                <h2>No products found</h2>
                <p>Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map(product => <ProductCard key={product._id} product={product} />)}
                </div>
                {pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" disabled={page === 1} onClick={() => setPage(current => current - 1)}>Previous</button>
                    {Array.from({ length: pages }, (_, index) => index + 1).map(pageNumber => (
                      <button key={pageNumber} className={`page-btn ${page === pageNumber ? 'active' : ''}`} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                    ))}
                    <button className="page-btn" disabled={page === pages} onClick={() => setPage(current => current + 1)}>Next</button>
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
