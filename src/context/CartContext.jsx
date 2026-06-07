import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cart as cartApi } from '../services/api';
import { getSocket } from '../services/socket';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user || user.role !== 'user') return;
    setLoading(true);
    try {
      const data = await cartApi.getAll();
      setCartItems(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'user') {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  // Live updates: the server pushes the full cart snapshot whenever it
  // changes (add/remove/checkout), so the badge and Cart page stay in
  // sync without a manual refetch.
  useEffect(() => {
    if (!user || user.role !== 'user') return;
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = (items) => {
      setCartItems(Array.isArray(items) ? items : []);
    };
    socket.on('cart:updated', onUpdate);
    return () => socket.off('cart:updated', onUpdate);
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      // Prompt for login if not logged in
      throw new Error('Please login as a customer to add items to cart');
    }

    if (user.role !== 'user') {
      throw new Error('Only customers can add items to cart');
    }

    try {
      await cartApi.add(productId, quantity);
      await fetchCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (!user || user.role !== 'user') return;

    try {
      await cartApi.update(cartItemId, quantity);
      await fetchCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!user || user.role !== 'user') return;

    try {
      await cartApi.remove(cartItemId);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!user || user.role !== 'user') return;

    try {
      await cartApi.clear();
      setCartItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartTotal,
      cartCount,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
