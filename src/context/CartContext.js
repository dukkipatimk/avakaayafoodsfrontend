import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('akf_cart')) || [];
      return raw.filter(i => i && i.productId != null && i.weight).map(i => ({
        ...i,
        price: Number(i.price) || 0,
        mrp: Number(i.mrp) || Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
      }));
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('akf_cart', JSON.stringify(items));
  }, [items]);

  const getKey = (productId, weight, bundleId = '') => `${productId}_${weight}_${bundleId || 'regular'}`;

  const addItem = (product, variant, quantity = 1) => {
    const pid = product._id ?? product.id;
    if (pid == null) {
      console.error('addItem: product is missing both _id and id', product);
      return;
    }
    setItems(prev => {
      const key = getKey(pid, variant.weight);
      const existing = prev.find(i => getKey(i.productId, i.weight, i.bundleId) === key);
      if (existing) {
        return prev.map(i => getKey(i.productId, i.weight, i.bundleId) === key
          ? { ...i, quantity: i.quantity + quantity }
          : i
        );
      }
      return [...prev, {
        productId: pid,
        name: product.name,
        thumbnail: product.thumbnail,
        slug: product.slug,
        weight: variant.weight,
        price: Number(variant.price) || 0,
        mrp: Number(variant.mrp) || Number(variant.price) || 0,
        quantity,
        isVeg: product.isVeg
      }];
    });
  };

  const addHamper = (selections, customization = {}) => {
    const bundleId = `hamper_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const details = {
      personalMessage: String(customization.personalMessage || '').trim(),
      styleInstructions: String(customization.styleInstructions || '').trim(),
    };
    const hamperItems = selections.map(({ product, variant }) => ({
      productId: product._id ?? product.id,
      name: product.name,
      thumbnail: product.thumbnail,
      slug: product.slug,
      weight: variant.weight,
      price: Number(variant.price) || 0,
      mrp: Number(variant.mrp) || Number(variant.price) || 0,
      quantity: 1,
      isVeg: product.isVeg,
      bundleId,
      bundleType: 'hamper',
      bundleLabel: 'Custom Gift Hamper',
      customization: details,
    })).filter(item => item.productId != null);
    setItems(prev => [...prev, ...hamperItems]);
    return bundleId;
  };

  const updateQuantity = (productId, weight, quantity, bundleId = '') => {
    if (quantity < 1) return removeItem(productId, weight, bundleId);
    const key = getKey(productId, weight, bundleId);
    setItems(prev => prev.map(i => getKey(i.productId, i.weight, i.bundleId) === key ? { ...i, quantity } : i));
  };

  const removeItem = (productId, weight, bundleId = '') => {
    const key = getKey(productId, weight, bundleId);
    setItems(prev => prev.filter(i => getKey(i.productId, i.weight, i.bundleId) !== key));
  };

  const removeBundle = bundleId => setItems(prev => prev.filter(i => i.bundleId !== bundleId));
  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const savings = items.reduce((sum, i) => sum + (i.mrp - i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, addHamper, updateQuantity, removeItem, removeBundle, clearCart,
      subtotal, totalItems, savings
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
