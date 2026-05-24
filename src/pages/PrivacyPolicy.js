import React from 'react';
import './PolicyPage.css';

const PrivacyPolicy = () => (
  <div className="policy-page">
    <div className="policy-hero">
      <span className="policy-eyebrow">Your Privacy</span>
      <h1>Privacy Policy</h1>
      <p>How we use information to fulfil orders, provide support and improve your shopping experience.</p>
    </div>

    <div className="policy-body">
      <div className="container policy-content">
        <h2>Information We Collect</h2>
        <p>When you place an order or contact us, we collect details needed to respond and deliver your order, such as your name, phone number, email address, shipping address and order information.</p>

        <h2>Website Activity</h2>
        <p>We record basic interactions such as page visits, product views, cart actions, checkout progress and clicks on contact options. This helps us improve the website and follow up when a customer has requested help or started an order without completing it.</p>

        <h2>How We Use Information</h2>
        <p>We use information to process payments and orders, arrange delivery, provide customer support, prevent misuse, improve our products and website, and contact customers about an enquiry or incomplete checkout where appropriate.</p>

        <h2>Sharing And Retention</h2>
        <p>Information may be shared with payment, shipping and communication service providers only as needed to provide our services. We retain records for operational, legal and customer-support purposes and take reasonable steps to protect them.</p>

        <h2>Your Choices</h2>
        <p>You may contact us to ask about your personal information or to request that we stop marketing or follow-up communications. Transactional messages relating to an order may still be necessary.</p>

        <h2>Contact Us</h2>
        <p>For privacy questions, email <a href="mailto:care@avakaayafoods.com">care@avakaayafoods.com</a> or call <a href="tel:+919115595959">+91 91155 95959</a>.</p>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
