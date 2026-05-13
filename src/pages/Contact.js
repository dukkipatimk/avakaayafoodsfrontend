import React, { useState } from 'react';
import './PolicyPage.css';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <span className="policy-eyebrow">We're Here to Help</span>
        <h1>Contact Us</h1>
        <p>Questions about your order, our products, or anything else — we'd love to hear from you.</p>
      </div>

      <div className="policy-body">
        <div className="container contact-grid">

          {/* Info card */}
          <div className="contact-info-card">
            <h2>Get in Touch</h2>

            <div className="contact-detail">
              <div className="contact-detail-icon">📍</div>
              <div className="contact-detail-text">
                <strong>Address</strong>
                <span>LIG-75, 1st Phase, Dharma Reddy Colony Phase I,<br />Kukatpally, Hyderabad, Telangana 500072</span>
              </div>
            </div>

            <div className="contact-detail">
              <div className="contact-detail-icon">📞</div>
              <div className="contact-detail-text">
                <strong>Phone</strong>
                <a href="tel:+919115595959">+91 91155 95959</a>
              </div>
            </div>

            <div className="contact-detail">
              <div className="contact-detail-icon">✉️</div>
              <div className="contact-detail-text">
                <strong>Email</strong>
                <a href="mailto:care@avakaayafoods.com">care@avakaayafoods.com</a>
              </div>
            </div>

            <div className="contact-detail">
              <div className="contact-detail-icon">🕘</div>
              <div className="contact-detail-text">
                <strong>Business Hours</strong>
                <span>Every day, 9:00 AM – 10:00 PM IST</span>
              </div>
            </div>

            <div className="contact-actions">
              <a href="mailto:care@avakaayafoods.com" className="btn btn-primary">
                📧 Send Email
              </a>
              <a
                href="https://wa.me/919115595959"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div className="contact-form-card">
            <h2>Send Us a Message</h2>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                <h3 style={{ color: 'var(--green-deep)', marginBottom: 8 }}>Message Received!</h3>
                <p style={{ color: 'var(--text-mid)' }}>
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone (optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select name="subject" value={form.subject} onChange={handleChange} required>
                    <option value="">Select a subject</option>
                    <option value="order">Order / Tracking Issue</option>
                    <option value="product">Product Enquiry</option>
                    <option value="shipping">Shipping & Delivery</option>
                    <option value="refund">Refund / Return</option>
                    <option value="bulk">Bulk / Wholesale Order</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Send Message
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
