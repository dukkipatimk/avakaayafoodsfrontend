import React from 'react';
import './PolicyPage.css';

const SECTIONS = [
  {
    title: 'Refund Policy',
    body: 'If you are not entirely satisfied with your purchase, please contact us within 7 days of receiving your order to request a refund. The item must be unused, in its original packaging, and in the same condition as received. Please allow 5–7 business days for the refund to reflect in your account after the return is approved.',
  },
  {
    title: 'Cancellation Policy',
    body: 'You may cancel an order before it is shipped. To cancel your order, please contact us as soon as possible at care@avakaayafoods.com or via WhatsApp. Once an order has been shipped, it cannot be cancelled; however, you may be eligible for a return under our Refund Policy. If you have ordered a custom or personalised item (such as a gift hamper), please contact us directly to discuss cancellation options, as these may have different terms.',
  },
  {
    title: 'Return Shipping',
    body: 'Customers are typically responsible for return shipping costs unless the return is due to our error or a defective product. We recommend using a trackable shipping service to return items. Avakaaya Foods is not responsible for returned items lost in transit.',
  },
  {
    title: 'Damaged or Defective Items',
    body: 'In the case of receiving damaged or defective items, please contact us within 48 hours of delivery at care@avakaayafoods.com or via WhatsApp. We may require photographic evidence of the damage or defect to process your refund or replacement. We will replace the item or issue a full refund at our discretion.',
  },
  {
    title: 'Refusal of Refunds',
    body: 'We reserve the right to refuse refunds if the items do not meet our return policy criteria — for example, if the item has been opened, used, or if the refund request is made after the specified 7-day timeframe. Perishable food items that have been opened cannot be returned unless they are defective.',
  },
  {
    title: 'Contact Us',
    body: 'If you have any questions or require further assistance regarding our Refund and Cancellation Policy, please contact our customer service team at care@avakaayafoods.com or call +91 91155 95959. Our team is available every day from 9:00 AM to 10:00 PM IST.',
  },
];

const RefundPolicy = () => (
  <div className="policy-page">
    <div className="policy-hero">
      <span className="policy-eyebrow">Legal</span>
      <h1>Refund &amp; Cancellation Policy</h1>
      <p>We stand behind every product we sell. Here's how we handle returns and cancellations.</p>
    </div>

    <div className="policy-body">
      <div className="container">
        <div className="policy-sections">
          {SECTIONS.map((s, i) => (
            <div key={s.title} className="policy-section">
              <h2>
                <span className="policy-num">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default RefundPolicy;
