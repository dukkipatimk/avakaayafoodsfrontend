import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Wishlist.css';

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/wishlist')
      .then(r => setProducts(r.data.wishlist || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
          <Link to="/products" className="btn btn-outline btn-sm">Continue Shopping</Link>
        </div>
        {loading ? (
          <div className="products-grid">
            {Array(4).fill(0).map((_, i) => <div key={i} className="product-skeleton skeleton" style={{ height: 440 }} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="wishlist-empty">
            <span>♥</span>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love and find them here later.</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
