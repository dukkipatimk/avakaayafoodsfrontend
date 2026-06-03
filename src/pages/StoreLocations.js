import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './PolicyPage.css';

const statusClass = (status) => `store-status store-status--${status || 'unknown'}`;
const directionsUrl = (store) => {
  if (store.mapUrl) return store.mapUrl;
  const query = [store.name, store.area, store.address, store.city, store.state].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const StoreLocations = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stores')
      .then(res => setStores(res.data.stores || []))
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">Find Us Near You</span>
        <h1>Visit Our Stores</h1>
        <p>Come in, taste our pickles, and take home a jar. Check each branch status before visiting.</p>
      </div>

      <div className="policy-body">
        <div className="container">
          {loading ? (
            <div className="loading-spinner" style={{ margin: '4rem auto' }} />
          ) : (
            <>
              <div className="stores-grid">
                {stores.map((store, index) => (
                  <div key={store._id || store.id || store.name} className="store-card">
                    <div className="store-card-topline">
                      <span className="store-badge">{index === 0 ? 'Main Branch' : 'Branch'}</span>
                      <span className={statusClass(store.status)}>{store.statusLabel || 'Open'}</span>
                    </div>
                    <h3>{store.name}</h3>

                    <div className="store-detail">
                      <span className="store-detail-icon">📍</span>
                      <span>{[store.area, store.address, store.city, store.state].filter(Boolean).join(', ')}</span>
                    </div>

                    {store.phone && (
                      <div className="store-detail">
                        <span className="store-detail-icon">📞</span>
                        <a href={`tel:${store.phone.replace(/\s/g, '')}`}>{store.phone}</a>
                      </div>
                    )}

                    {store.hours && (
                      <div className="store-detail">
                        <span className="store-detail-icon">🕒</span>
                        <span>{store.hours}</span>
                      </div>
                    )}

                    <a
                      href={directionsUrl(store)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="store-map-link"
                    >
                      Get Directions →
                    </a>
                  </div>
                ))}
              </div>

              {stores.length === 0 && (
                <div className="store-hours-banner">
                  <p>No active stores are listed right now. Please WhatsApp us before visiting.</p>
                </div>
              )}

              <div className="store-hours-banner">
                <div>
                  <p><strong>Store Hours:</strong> Status updates automatically from each branch's hours unless overridden by admin.</p>
                  <p style={{ marginTop: 4 }}>For urgent visits, message us before heading out.</p>
                </div>
                <a
                  href="https://wa.me/919115595959"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                >
                  WhatsApp Before Visiting
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreLocations;
