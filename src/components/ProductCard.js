import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { trackEvent } from '../utils/tracking';
import VariantSheet from './VariantSheet';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addItem, updateQuantity, items, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Image fallback chain: thumbnail → THIS product's own gallery images → …
  // → neutral placeholder. Covers both a missing thumbnail field and a thumbnail
  // URL that 404s (onError advances to the next candidate). The final placeholder
  // is a neutral brand box (NOT another product's photo), so a product without
  // its own images never borrows someone else's picture.
  const PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
      '<rect width="100%" height="100%" fill="#f2efe9"/>' +
      '<text x="50%" y="50%" font-family="Georgia, serif" font-size="24" fill="#b7ad9c" ' +
      'text-anchor="middle" dominant-baseline="middle">Avakaaya Foods</text></svg>'
    );
  const imgCandidates = [...new Set(
    [product.thumbnail, ...(product.images || [])].filter(Boolean)
  )];
  const [imgIdx, setImgIdx] = useState(0);

  const discount = Math.round((1 - selectedVariant.price / selectedVariant.mrp) * 100);

  // Quantity of THIS product/weight already in the cart (loose items only —
  // hamper/combo lines are priced as a bundle and are not stepped from here).
  const productId = product._id ?? product.id;
  const cartLine = items.find(
    (i) => !i.bundleId && String(i.productId) === String(productId) && i.weight === selectedVariant.weight
  );
  const cartQty = cartLine ? cartLine.quantity : 0;

  const stepQuantity = (nextQty) => {
    if (nextQty > cartQty && selectedVariant.stock !== undefined && nextQty > selectedVariant.stock) {
      toast.error(`Only ${selectedVariant.stock} in stock`);
      return;
    }
    updateQuantity(productId, selectedVariant.weight, nextQty);
    if (nextQty > cartQty) {
      trackEvent('add_to_cart', {
        productId,
        cartValue: subtotal + Number(selectedVariant.price || 0),
        cartItems: [{ productId, name: product.name, weight: selectedVariant.weight, quantity: nextQty, price: selectedVariant.price }],
        metadata: { source: 'product_card_stepper', addedValue: Number(selectedVariant.price) || 0 },
      });
    }
  };

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
            src={imgCandidates[imgIdx] || PLACEHOLDER_IMG}
            alt={product.name}
            className="product-card-img"
            loading="lazy"
            onError={() => setImgIdx(i => Math.min(i + 1, imgCandidates.length))}
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

        {/* Variant selector — a button row on desktop, a single chip that opens
            a bottom sheet on phones (easier to hit, and it scales past 3 sizes). */}
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
        {product.variants.length > 1 && (
          <button className="variant-chip" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
            {selectedVariant.weight}
            <span aria-hidden="true">▾</span>
          </button>
        )}
        {sheetOpen && (
          <VariantSheet
            product={product}
            selected={selectedVariant}
            onSelect={setSelectedVariant}
            onClose={() => setSheetOpen(false)}
          />
        )}

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

        {cartQty > 0 && selectedVariant.stock !== 0 ? (
          <div className="pc-stepper" role="group" aria-label={`Quantity of ${product.name} ${selectedVariant.weight}`}>
            <button className="pc-stepper-btn" onClick={() => stepQuantity(cartQty - 1)} aria-label="Decrease quantity">−</button>
            <span className="pc-stepper-qty" aria-live="polite">{cartQty}</span>
            <button className="pc-stepper-btn" onClick={() => stepQuantity(cartQty + 1)} aria-label="Increase quantity">+</button>
          </div>
        ) : (
          <button
            className={`btn btn-gold btn-sm add-to-cart-btn ${adding ? 'adding' : ''}`}
            onClick={handleAddToCart}
            disabled={selectedVariant.stock === 0}
          >
            {adding ? '✓ Added!' : selectedVariant.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
