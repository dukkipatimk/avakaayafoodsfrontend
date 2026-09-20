import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { CartProvider, useCart } from './CartContext';
import api from '../utils/api';

jest.mock('../utils/api', () => ({ post: jest.fn() }));
jest.mock('./AuthContext', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('react-hot-toast', () => ({ error: jest.fn() }));

let root, container, cart;
function Consumer() { cart = useCart(); return null; }
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('akf_cart', JSON.stringify([{ productId: 1, weight: '250g', price: 100, quantity: 1 }]));
  api.post.mockReset();
  api.post.mockImplementation((url, { subtotal }) => Promise.resolve({ data: { success: true, discount: subtotal / 10 } }));
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(() => act(() => root.unmount()));
const mount = () => act(async () => { root.render(<CartProvider><Consumer /></CartProvider>); });

test('applies a validated coupon and recalculates after a quantity change', async () => {
  await mount();
  await act(async () => cart.setSelectedCouponCode('SAVE10'));
  expect(cart.appliedCoupon.discount).toBe(10);
  expect(sessionStorage.getItem('akf_coupon')).toBe('SAVE10');
  await act(async () => cart.updateQuantity(1, '250g', 2));
  expect(cart.appliedCoupon.discount).toBe(20);
  await act(async () => cart.clearCart());
  expect(cart.appliedCoupon).toBeNull();
  expect(sessionStorage.getItem('akf_coupon')).toBeNull();
});

test('restores and revalidates the code after reload', async () => {
  sessionStorage.setItem('akf_coupon', 'SAVE10');
  await mount();
  expect(api.post).toHaveBeenCalledWith('/coupons/validate', { code: 'SAVE10', subtotal: 100, userId: undefined });
  expect(cart.appliedCoupon.discount).toBe(10);
});

test('removes a coupon that no longer validates', async () => {
  await mount();
  await act(async () => cart.setSelectedCouponCode('SAVE10'));
  api.post.mockResolvedValue({ data: { success: false, message: 'Minimum order not met' } });
  await act(async () => cart.updateQuantity(1, '250g', 2));
  expect(cart.appliedCoupon).toBeNull();
  expect(cart.couponLoading).toBe(false);
  expect(sessionStorage.getItem('akf_coupon')).toBeNull();
});
