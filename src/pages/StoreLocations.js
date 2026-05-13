import React from 'react';
import './PolicyPage.css';

const BRANCHES = [
  {
    badge: 'Main Branch',
    name: 'Kukatpally, Hyderabad',
    address: 'LIG-75, 1st Phase, Dharma Reddy Colony Phase I, Kukatpally, Hyderabad, Telangana 500072',
    phone: '+91 91155 95959',
    email: 'avakaayapickleshouse@gmail.com',
    mapsQuery: 'LIG-75+Dharma+Reddy+Colony+Kukatpally+Hyderabad',
  },
  {
    badge: 'Branch',
    name: 'Chanda Nagar, Hyderabad',
    address: 'Under Shoe Lala Building, H.3-10, Near RS Brothers, Gangaram, Chanda Nagar, Hyderabad, Telangana 500050',
    phone: '+91 91155 95959',
    email: 'avakaayapickleshousechd@gmail.com',
    mapsQuery: 'H.3-10+near+RS+Brothers+Chanda+Nagar+Hyderabad',
  },
  {
    badge: 'Branch',
    name: 'Ameerpet, Hyderabad',
    address: 'H No. 7-1-455/2 & 3, Green House Building, Beside Passport Office, Kumar Basti, Ameerpet, Yousufguda Circle No. 19, Hyderabad, Telangana 500038',
    phone: '+91 62693 99399',
    email: 'avakaayapickleshouseamp@gmail.com',
    mapsQuery: 'Green+House+Building+Beside+Passport+Office+Ameerpet+Hyderabad',
  },
];

const StoreLocations = () => (
  <div className="policy-page">
    <div className="policy-hero">
      <span className="policy-eyebrow">Find Us Near You</span>
      <h1>Visit Our Stores</h1>
      <p>Come in, taste our pickles, and take home a jar. All 3 branches are open every day.</p>
    </div>

    <div className="policy-body">
      <div className="container">
        <div className="stores-grid">
          {BRANCHES.map(b => (
            <div key={b.name} className="store-card">
              <span className="store-badge">{b.badge}</span>
              <h3>{b.name}</h3>

              <div className="store-detail">
                <span className="store-detail-icon">📍</span>
                <span>{b.address}</span>
              </div>

              <div className="store-detail">
                <span className="store-detail-icon">📞</span>
                <a href={`tel:${b.phone.replace(/\s/g, '')}`}>{b.phone}</a>
              </div>

              <div className="store-detail">
                <span className="store-detail-icon">✉️</span>
                <a href={`mailto:${b.email}`}>{b.email}</a>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${b.mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="store-map-link"
              >
                🗺 Get Directions →
              </a>
            </div>
          ))}
        </div>

        <div className="store-hours-banner">
          <div>
            <p><strong>Store Hours:</strong> All branches are open every day</p>
            <p style={{ marginTop: 4 }}>9:00 AM – 10:00 PM IST</p>
          </div>
          <a
            href="https://wa.me/919115595959"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold"
          >
            💬 WhatsApp Before Visiting
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default StoreLocations;
