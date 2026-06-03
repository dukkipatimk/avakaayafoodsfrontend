import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { trackEvent } from '../utils/tracking';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addItem, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const discount = Math.round((1 - selectedVariant.price / selectedVariant.mrp) * 100);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (selectedVariant.stock === 0) return;
    setAdding(true);
    addItem(product, selectedVariant);
    const addedValue = Number(selectedVariant.price) || 0;
    trackEvent('add_to_cart', {
      productId: product._id,
      cartValue: subtotal + addedValue,
      cartItems: [{ productId: product._id, name: product.name, weight: selectedVariant.weight, quantity: 1, price: selectedVariant.price }],
      metadata: { source: 'product_card', addedValue },
    });
    toast.success(`${product.name} (${selectedVariant.weight}) added to cart!`);
    setTimeout(() => setAdding(false), 800);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setWishlistLoading(true);
    try {
      const res = await api.post(`/auth/wishlist/${product._id}`);
      setWishlisted(res.data.wishlisted);
      toast(res.data.wishlisted ? '♥ Added to wishlist' : 'Removed from wishlist');
    } catch { } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.slug}`} className="product-card-img-link">
        <div className="product-card-img-wrap">
          <img
            src={product.thumbnail || '/images/products/2024/10/gongura_pickle_pp.jpg'}
            alt={product.name}
            className="product-card-img"
            loading="lazy"
          />
          {discount > 5 && <span className="product-card-discount">-{discount}%</span>}
          <div className="product-card-badges">
            {product.tags?.includes('bestseller') && <span className="badge badge-bestseller">Bestseller</span>}
            <span className={`badge ${product.isVeg ? 'badge-veg' : 'badge-nonveg'}`}>
              {product.isVeg ? '● Veg' : '● Non-Veg'}
            </span>
          </div>
          <button
            className={`wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
            onClick={handleWishlist}
            disabled={wishlistLoading}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            ♥
          </button>
        </div>
      </Link>

      <div className="product-card-body">
        <Link to={`/products/${product.slug}`}>
          <h3 className="product-card-name">{product.name}</h3>
        </Link>
        {product.shortDescription && (
          <p className="product-card-desc">{product.shortDescription}</p>
        )}

        {/* Rating */}
        {product.rating > 0 && (
          <div className="product-card-rating">
            <span className="stars">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
            <span className="rating-count">({product.numReviews})</span>
          </div>
        )}

        {/* Variant selector */}
        <div className="variant-selector">
          {product.variants.map(v => (
            <button
              key={v.weight}
              className={`variant-btn ${selectedVariant.weight === v.weight ? 'active' : ''}`}
              onClick={() => setSelectedVariant(v)}
            >
              {v.weight}
            </button>
          ))}
        </div>

        {/* Stock indicators */}
        {selectedVariant.stock !== undefined && selectedVariant.stock <= 10 && selectedVariant.stock > 0 && (
          <span className="pc-stock-low">Only {selectedVariant.stock} left</span>
        )}
        {selectedVariant.stock === 0 && (
          <span className="pc-stock-out">Out of stock</span>
        )}

        {/* Price */}
        <div className="product-card-price">
          <span className="price-current">₹{selectedVariant.price}</span>
          {selectedVariant.mrp > selectedVariant.price && (
            <span className="price-mrp">₹{selectedVariant.mrp}</span>
          )}
        </div>

        <button
          className={`btn btn-primary btn-sm add-to-cart-btn ${adding ? 'adding' : ''}`}
          onClick={handleAddToCart}
          disabled={selectedVariant.stock === 0}
        >
          {adding ? '✓ Added!' : selectedVariant.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
