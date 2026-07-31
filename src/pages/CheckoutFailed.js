import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './OrderSuccess.css';

// Friendly copy for the reason codes the payment backend redirects with.
const REASONS = {
  invalid_signature: 'We could not confirm this payment with the bank. If money was debited, it will be auto-refunded — or contact us and we’ll verify it.',
  unconfirmed: 'Your payment is still being confirmed with the bank. If money was debited, your order will update shortly — please check My Orders in a few minutes before retrying.',
  payment_failed: 'The payment was not completed. No money has been charged.',
  order_not_found: 'We could not find this order. Please try placing it again.',
  missing_fields: 'The payment response was incomplete. Please try again.',
  server_error: 'Something went wrong while confirming your payment. If money was debited, contact us and we’ll sort it out.',
};

const CheckoutFailed = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const reason = params.get('reason') || '';
  const message = REASONS[reason] || 'Your payment could not be completed. No money has been charged.';

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#8a1c1c" />
            <path d="M22 22l20 20M42 22L22 42" stroke="#fff" strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="success-title">Payment Not Completed</h1>
        <p className="success-subtitle">{message}</p>

        <div className="order-summary-card">
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {orderId
              ? <>Your order <strong>#{orderId}</strong> is saved as unpaid — you can retry payment from your orders, or check out again.</>
              : 'Your cart is still saved — you can try again anytime.'}
          </p>
        </div>

        <div className="success-actions">
          <Link to="/checkout" className="btn btn-primary">Retry Payment</Link>
          <Link to="/my-orders" className="btn btn-outline">View My Orders</Link>
          <Link to="/products" className="btn btn-outline">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFailed;
