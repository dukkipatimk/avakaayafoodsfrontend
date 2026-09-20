import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import './StoreCartDock.css';

const Icon = ({ name }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  {name === 'clock' ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> : name === 'pin' ? <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></> : name === 'cart' ? <><path d="M2 3h3l3 13h11l3-10H6" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></> : <path d="m5 3 4 1 1 5-3 2a16 16 0 0 0 6 6l2-3 5 1 1 4c-1 5-10 0-14-4S0 4 5 3Z" />}
</svg>;

const directionsUrl = store => store.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([store.name, store.area, store.address, store.city, store.state].filter(Boolean).join(' '))}`;

export default function StoreCartDock() {
  const { totalItems, subtotal } = useCart();
  const { pathname } = useLocation();
  const [stores, setStores] = useState([]);
  const hidden = /^\/admin(?:\/|$)/i.test(pathname);

  useEffect(() => {
    if (hidden) return;
    const controller = new AbortController();
    const loadStores = () => {
      if (document.visibilityState === 'hidden') return;
      api.get('/stores', { signal: controller.signal, silent: true })
        .then(({ data }) => setStores(data.stores || []))
        .catch(() => {});
    };
    loadStores();
    const timer = setInterval(loadStores, 60000);
    document.addEventListener('visibilitychange', loadStores);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', loadStores); };
  }, [hidden]);

  useEffect(() => {
    document.body.classList.toggle('has-store-dock', !hidden);
    return () => document.body.classList.remove('has-store-dock');
  }, [hidden]);

  if (hidden) return null;
  return <aside className="store-cart-dock" aria-label="Store locations and cart">
    <div className="dock-stores">
      {stores.map(store => <section className="dock-store" key={store._id || store.id || store.name} aria-label={store.name}>
        <div className="dock-store-heading"><h2>{store.name}</h2><span className={`dock-store-status dock-store-status--${store.status || 'unknown'}`}>{store.statusLabel || 'Check hours'}</span></div>
        <div className="dock-store-info">
          {store.hours && <span className="dock-store-hours"><Icon name="clock" />{store.hours}</span>}
          <div className="dock-store-links"><a href={directionsUrl(store)} target="_blank" rel="noopener noreferrer" aria-label={`Get directions to ${store.name}`}><Icon name="pin" />Get Directions</a>
          {store.phone && <a className="dock-store-phone" href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} aria-label={`Call ${store.name}: ${store.phone}`}><Icon name="phone" />{store.phone}</a>}</div>
        </div>
      </section>)}
      {!stores.length && <Link className="dock-store-fallback" to="/store-locations"><Icon name="pin" />Visit our stores <span>Hours & directions →</span></Link>}
    </div>
    <Link to="/store-locations" className="dock-mobile-stores"><Icon name="pin" /><span>Stores</span></Link>
    <div className="dock-cart" aria-label="Cart summary">
      <span className="dock-cart-icon"><Icon name="cart" /></span>
      <span className="dock-cart-text"><strong>{totalItems ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'} in cart` : 'Your cart is empty'}</strong><span className="dock-cart-total">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></span>
      <Link to={totalItems ? '/cart' : '/products'} className="dock-cart-cta">{totalItems ? 'View Cart' : 'Shop now'} <span aria-hidden="true">→</span></Link>
    </div>
  </aside>;
}
