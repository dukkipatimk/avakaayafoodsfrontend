import React from 'react';
import './ShippingInfo.css';

const zones = [
  {
    flag: '🇮🇳', name: 'India', color: '#ff9933',
    deliveryTime: '1–2 business days',
    note: 'We ship across all Indian states. Tracking provided via SMS and email.',
  },
  {
    flag: '🇺🇸', name: 'United States', color: '#3c3b6e',
    deliveryTime: '3–7 business days',
    note: 'Shipped via registered international post with full tracking. Customs duties may apply.',
  },
  {
    flag: '🇬🇧', name: 'United Kingdom', color: '#012169',
    deliveryTime: '3–7 business days',
    note: 'Post-Brexit customs: recipients may be charged import VAT on delivery.',
  },
  {
    flag: '🇸🇬', name: 'Singapore', color: '#ef3340',
    deliveryTime: '3–7 business days',
    note: 'Excellent connectivity from Hyderabad. Most orders arrive within 7 days.',
  },
  {
    flag: '🇦🇺', name: 'Australia', color: '#00008b',
    deliveryTime: '3–7 business days',
    note: 'All food items comply with DAFF import regulations for condiments and pickles.',
  },
  {
    flag: '🇲🇾', name: 'Malaysia', color: '#cc0001',
    deliveryTime: '3–7 business days',
    note: 'Food import regulations apply. Products are properly labelled and certified.',
  },
];

const ShippingInfo = () => {
  return (
    <div className="shipping-page">
      <div className="shipping-hero">
        <div className="container">
          <h1 className="shipping-hero-title">Shipping Information</h1>
          <p className="shipping-hero-sub">
            Bringing authentic Telugu flavours from Hyderabad to your doorstep, anywhere in the world.
          </p>
        </div>
      </div>

      <div className="container shipping-content">

        {/* Shipping partner */}
        <div className="shipping-partner">
          <div className="shipping-partner-text">
            <span className="shipping-partner-eyebrow">Logistics Partner</span>
            <h2 className="shipping-partner-title">
              Powered by <a href="https://avakaaya.com" target="_blank" rel="noopener noreferrer">Avakaaya.com</a> International Courier
            </h2>
            <p className="shipping-partner-body">
              Every shipment is handled by our trusted logistics partner with end-to-end
              tracking, food-grade temperature care, and customs-cleared delivery in over
              200 destinations worldwide.
            </p>
            <ul className="shipping-partner-list">
              <li>Focus on Quality &amp; FSSAI-compliant handling</li>
              <li>Global reach across 6 primary &amp; 200+ secondary destinations</li>
              <li>Specialized care for sensitive food items</li>
              <li>24/7 support &amp; customs assistance</li>
            </ul>
          </div>
          <div className="shipping-partner-image">
            <img
              src="/images/shipping/courier-capabilities.png"
              alt="Avakaaya.com International Courier capabilities: Focus on Quality, Global Reach, Customized Solutions, Extensive Branch Network, Satisfied Customers, 24/7 Support, Specialized Care, Wide Network"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Policy sections */}
        <div className="shipping-policy">
          <h2 className="faq-title">Delivery &amp; Shipping Policy</h2>
          <div className="policy-items">
            {[
              { title: 'Order Processing Time', body: 'Orders are typically processed within 1–2 business days after they are placed. This processing time may vary during peak seasons or due to unforeseen circumstances.' },
              { title: 'Delivery Timelines', body: 'Orders within India are delivered in 1–2 business days. International orders to the United States, United Kingdom, Singapore, Australia, and Malaysia are delivered in 3–7 business days.' },
              { title: 'Delivery Destinations', body: 'We currently deliver to India, United States, United Kingdom, Singapore, Australia, and Malaysia. If your location is not listed, please contact us at care@avakaayafoods.com for assistance.' },
              { title: 'Order Tracking', body: 'Once your order is shipped, you will receive a shipping confirmation email and/or SMS with tracking information. You can also track your order from the "My Orders" section in your account.' },
              { title: 'International Shipping', body: 'For international orders, additional customs duties, taxes, or fees may apply depending on your country\'s regulations. These charges are the responsibility of the recipient and are not included in product or shipping costs.' },
              { title: 'Returns Due to Shipping Issues', body: 'If your order is returned to us due to an incorrect address or failure to receive the package, additional shipping fees may apply for reshipment. Please ensure your shipping information is accurate when placing your order.' },
            ].map(item => (
              <div key={item.title} className="policy-item">
                <h4 className="policy-item-title">{item.title}</h4>
                <p className="policy-item-body">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Zones grid */}
        <div className="zones-grid">
          {zones.map(zone => (
            <div key={zone.name} className="zone-card">
              <div className="zone-card-header" style={{ borderLeftColor: zone.color }}>
                <span className="zone-flag">{zone.flag}</span>
                <h3 className="zone-name">{zone.name}</h3>
              </div>
              <div className="zone-delivery">
                <span className="zone-delivery-icon">⏱</span>
                <span className="zone-delivery-time">{zone.deliveryTime}</span>
              </div>
              <p className="zone-note">{zone.note}</p>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="shipping-faqs">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {[
              {
                q: 'How do I track my order?',
                a: 'Once your order ships, you will receive an email and SMS with your tracking number. You can also track it from the "My Orders" section in your account.'
              },
              {
                q: 'Are there any customs duties for international orders?',
                a: 'Customs duties and import taxes vary by country and are the responsibility of the recipient. Most food condiment orders fall under low-value exemptions, but we recommend checking your local import regulations.'
              },
              {
                q: 'Do you use air-tight packaging?',
                a: 'Yes. All products are packed in food-grade, air-tight containers and then secured in moisture-resistant packaging to ensure freshness during international transit.'
              },
              {
                q: 'What if my order arrives damaged?',
                a: 'Please photograph the damaged item and contact us within 48 hours of delivery at care@avakaayafoods.com or WhatsApp. We will replace the item or issue a full refund.'
              },
              {
                q: 'Can I change my delivery address after placing an order?',
                a: 'Address changes can be accommodated within 2 hours of placing an order. After that, the order may already be in processing. Contact us immediately via WhatsApp for urgent changes.'
              },
              {
                q: 'Which products cannot be shipped internationally?',
                a: 'Certain fresh or perishable items are limited to India-only shipping. These are clearly marked on individual product pages. Most pickles, powders, and gift hampers can be shipped internationally.'
              },
            ].map((faq, i) => (
              <div key={i} className="faq-item">
                <h4 className="faq-q">{faq.q}</h4>
                <p className="faq-a">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="shipping-contact">
          <div className="contact-inner">
            <h3>Need Help?</h3>
            <p>Our team is available Mon–Sat, 9am–7pm IST.</p>
            <div className="contact-options">
              <a href="mailto:care@avakaayafoods.com" className="contact-btn email">
                📧 care@avakaayafoods.com
              </a>
              <a href="https://wa.me/919115595959" target="_blank" rel="noopener noreferrer" className="contact-btn whatsapp">
                💬 WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingInfo;
