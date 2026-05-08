import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('akf_cart')) || [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('akf_cart', JSON.stringify(items));
  }, [items]);

  const getKey = (productId, weight) => `${productId}_${weight}`;

  const addItem = (product, variant, quantity = 1) => {
    setItems(prev => {
      const key = getKey(product._id, variant.weight);
      const existing = prev.find(i => getKey(i.productId, i.weight) === key);
      if (existing) {
        return prev.map(i => getKey(i.productId, i.weight) === key
          ? { ...i, quantity: i.quantity + quantity }
          : i
        );
      }
      return [...prev, {
        productId: product._id,
        name: product.name,
        thumbnail: product.thumbnail,
        slug: product.slug,
        weight: variant.weight,
        price: variant.price,
        mrp: variant.mrp,
        quantity,
        isVeg: product.isVeg
      }];
    });
  };

  const updateQuantity = (productId, weight, quantity) => {
    if (quantity < 1) return removeItem(productId, weight);
    const key = getKey(productId, weight);
    setItems(prev => prev.map(i => getKey(i.productId, i.weight) === key ? { ...i, quantity } : i));
  };

  const removeItem = (productId, weight) => {
    const key = getKey(productId, weight);
    setItems(prev => prev.filter(i => getKey(i.productId, i.weight) !== key));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const savings = items.reduce((sum, i) => sum + (i.mrp - i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, updateQuantity, removeItem, clearCart,
      subtotal, totalItems, savings
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
