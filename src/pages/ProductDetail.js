import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

const getDeliveryDate = (country) => {
  const today = new Date();
  const days = country === 'India' ? 5 : country === 'Singapore' || country === 'Malaysia' ? 10 : 14;
  const delivery = new Date(today.setDate(today.getDate() + days));
  return delivery.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
};

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [related, setRelated] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    } catch {
      return [];
    }
  });

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const { addItem } = useCart();
  const { user } = useAuth();

  const fetchProduct = (productSlug) => {
    return api.get(`/products/${productSlug}`).then(r => {
      setProduct(r.data.product);
      setSelectedVariant(r.data.product.variants[0]);
      setLoading(false);
      return r.data.product;
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProduct(slug);
  }, [slug]);

  // Update recently viewed when product loads
  useEffect(() => {
    if (!product) return;

    const stored = (() => {
      try {
        return JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      } catch {
        return [];
      }
    })();

    const filtered = stored.filter(p => p._id !== product._id);
    const entry = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      thumbnail: product.thumbnail,
      category: product.category,
      variants: product.variants,
    };
    const updated = [entry, ...filtered].slice(0, 4);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    setRecentlyViewed(updated.filter(p => p._id !== product._id));
  }, [product]);

  // Fetch related products
  useEffect(() => {
    if (!product) return;
    api.get(`/products/${product.slug}/related`)
      .then(r => setRelated(r.data.products || r.data || []))
      .catch(() => setRelated([]));
  }, [product]);

  if (loading) return <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>Loading...</div>;
  if (!product) return <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>Product not found.</div>;

  const discount = selectedVariant ? Math.round((1 - selectedVariant.price / selectedVariant.mrp) * 100) : 0;
  const images = product.images?.length ? product.images : [product.thumbnail];

  const isOutOfStock = selectedVariant?.stock !== undefined && selectedVariant.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, selectedVariant, quantity);
    toast.success(`${product.name} (${selectedVariant.weight} × ${quantity}) added to cart!`);
  };

  const hasUserReviewed = user && product.reviews?.some(r => r.user?.toString() === user._id?.toString());

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewRating) { toast.error('Please select a rating'); return; }
    setReviewSubmitting(true);
    try {
      await api.post(`/products/${product._id}/review`, { rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted!');
      setReviewRating(0);
      setReviewComment('');
      await fetchProduct(slug);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/products">Products</Link>
          <span>›</span>
          <Link to={`/products?category=${product.category}`}>{product.category}</Link>
          <span>›</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail-grid">
          {/* Images */}
          <div className="product-images">
            <div className="product-img-main">
              <img
                src={images[activeImg] || product.thumbnail}
                alt={product.name}
                className="product-img"
              />
              {discount > 5 && <span className="detail-discount-badge">Save {discount}%</span>}
            </div>
            {images.length > 1 && (
              <div className="product-img-thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`img-thumb ${activeImg === i ? 'active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info">
            <div className="product-badges">
              <span className={`badge ${product.isVeg ? 'badge-veg' : 'badge-nonveg'}`}>
                {product.isVeg ? '● Vegetarian' : '● Non-Vegetarian'}
              </span>
              {product.tags?.includes('bestseller') && <span className="badge badge-bestseller">Bestseller</span>}
            </div>

            <h1 className="product-detail-name">{product.name}</h1>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="product-rating">
                <span className="stars">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
                <span className="rating-count">{product.rating.toFixed(1)} ({product.numReviews} reviews)</span>
              </div>
            )}

            {/* Variant selector */}
            <div className="detail-section">
              <label className="detail-label">
                Weight: <strong>{selectedVariant?.weight}</strong>
              </label>
              <div className="variant-grid">
                {product.variants.map(v => {
                  const d = Math.round((1 - v.price / v.mrp) * 100);
                  return (
                    <button
                      key={v.weight}
                      className={`variant-card ${selectedVariant?.weight === v.weight ? 'active' : ''}`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      <span className="vc-weight">{v.weight}</span>
                      <span className="vc-price">₹{v.price}</span>
                      {d > 5 && <span className="vc-discount">-{d}%</span>}
                    </button>
                  );
                })}
              </div>
              {/* Stock level indicator */}
              {selectedVariant?.stock !== undefined && selectedVariant.stock <= 0 && (
                <span className="stock-out">Out of stock</span>
              )}
              {selectedVariant?.stock !== undefined && selectedVariant.stock > 0 && selectedVariant.stock <= 10 && (
                <span className="stock-low">Only {selectedVariant.stock} left!</span>
              )}
            </div>

            {/* Price */}
            <div className="product-price-row">
              <span className="detail-price">₹{selectedVariant?.price}</span>
              {selectedVariant?.mrp > selectedVariant?.price && (
                <>
                  <span className="detail-mrp">₹{selectedVariant?.mrp}</span>
                  <span className="detail-save">You save ₹{selectedVariant.mrp - selectedVariant.price}</span>
                </>
              )}
            </div>

            {/* Quantity */}
            <div className="detail-section">
              <label className="detail-label">Quantity</label>
              <div className="quantity-row">
                <div className="quantity-control">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="qty-btn">−</button>
                  <span className="qty-val">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="qty-btn">+</button>
                </div>
                <button
                  className="btn btn-gold btn-lg"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>

            {/* Trust signals */}
            <div className="product-trust">
              <div className="trust-row">🚚 <span>Free shipping on orders above ₹999 (India)</span></div>
              <div className="trust-row">🌍 <span>Ships to USA, UK, Singapore, Australia, Malaysia</span></div>
              <div className="trust-row">🌿 <span>No artificial preservatives or colors</span></div>
              <div className="trust-row">📦 <span>Shelf life: {product.shelfLife}</span></div>
            </div>

            {/* Estimated delivery */}
            <div className="delivery-estimate">
              📅 Estimated delivery: <strong>{getDeliveryDate('India')}</strong>
            </div>

            {/* Ingredients quick view */}
            {product.ingredients?.length > 0 && (
              <div className="ingredients-strip">
                <strong>Key Ingredients: </strong>
                {product.ingredients.slice(0, 5).join(', ')}
                {product.ingredients.length > 5 && '...'}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="product-tabs">
          <div className="tab-nav">
            {['description', 'ingredients', 'shipping', 'reviews'].map(tab => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="tab-pane">
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="tab-pane">
                <h3>Ingredients</h3>
                <ul className="ingredients-list">
                  {product.ingredients?.map(ing => <li key={ing}>{ing}</li>)}
                </ul>
                {product.allergens?.length > 0 && (
                  <p className="allergen-note"><strong>Allergen Note:</strong> {product.allergens.join(', ')}</p>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="tab-pane">
                <h3>Shipping Information</h3>
                <table className="shipping-table">
                  <thead>
                    <tr><th>Country</th><th>Standard</th><th>Express</th><th>Free Shipping</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>🇮🇳 India</td><td>3-5 days (₹80)</td><td>1-2 days (₹150)</td><td>Above ₹999</td></tr>
                    <tr><td>🇺🇸 USA</td><td>10-14 days ($25)</td><td>5-7 days ($45)</td><td>—</td></tr>
                    <tr><td>🇬🇧 UK</td><td>10-14 days (£20)</td><td>5-7 days (£35)</td><td>—</td></tr>
                    <tr><td>🇸🇬 Singapore</td><td>7-10 days (S$18)</td><td>4-6 days (S$30)</td><td>—</td></tr>
                    <tr><td>🇦🇺 Australia</td><td>10-14 days (A$28)</td><td>6-8 days (A$50)</td><td>—</td></tr>
                    <tr><td>🇲🇾 Malaysia</td><td>7-10 days (RM45)</td><td>4-6 days (RM80)</td><td>—</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="tab-pane">
                {product.reviews?.length > 0 ? (
                  product.reviews.map(r => (
                    <div key={r._id} className="review-card">
                      <div className="review-header">
                        <span className="review-name">{r.name}</span>
                        <span className="review-stars">{'★'.repeat(r.rating)}</span>
                      </div>
                      <p className="review-text">{r.comment}</p>
                    </div>
                  ))
                ) : (
                  <p>No reviews yet. Be the first to review this product!</p>
                )}

                {/* Review submission form */}
                <div className="review-form">
                  {!user ? (
                    <p>Please <Link to="/login">login</Link> to write a review.</p>
                  ) : hasUserReviewed ? (
                    <p>You've already reviewed this product.</p>
                  ) : (
                    <>
                      <h3>Write a Review</h3>
                      <form onSubmit={handleReviewSubmit}>
                        <div className="star-selector">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              className={`star-btn ${star <= reviewRating ? 'active' : ''}`}
                              onClick={() => setReviewRating(star)}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="review-textarea"
                          placeholder="Share your experience with this product..."
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          rows={4}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={reviewSubmitting}
                          style={{ marginTop: '12px' }}
                        >
                          {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="related-section">
            <h2>Customers Also Bought</h2>
            <div className="related-grid">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <div className="recently-viewed">
            <h3>Recently Viewed</h3>
            <div className="rv-grid">
              {recentlyViewed.map(p => (
                <Link key={p._id} to={`/products/${p.slug}`} className="rv-card">
                  <img
                    src={p.thumbnail}
                    alt={p.name}
                    className="rv-img"
                  />
                  <p className="rv-name">{p.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
