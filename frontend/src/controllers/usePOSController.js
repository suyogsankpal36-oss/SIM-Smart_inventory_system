/**
 * usePOSController.js
 * Controller orchestrating POS Terminal operations:
 * Product scanning, cart updates, discounts, customer selection, and atomic checkout.
 */
import { useState, useCallback, useMemo } from "react";
import { posService } from "../services/posService";
import { CartItemModel, CartModel } from "../models/CartModel";

export function usePOSController() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const cartModel = useMemo(
    () => new CartModel(cartItems, globalDiscount),
    [cartItems, globalDiscount]
  );

  const addItemToCart = useCallback((product, qty = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        const existing = next[existingIndex];
        const newQty = existing.quantity + qty;
        next[existingIndex] = new CartItemModel(product, newQty, existing.discount);
        return next;
      }
      return [...prev, new CartItemModel(product, qty)];
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            if (quantity <= 0) return null;
            return new CartItemModel(
              { id: item.productId, name: item.name, sku: item.sku, selling_price: item.price, stock_quantity: item.maxStock },
              quantity,
              item.discount
            );
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setSelectedCustomer(null);
    setGlobalDiscount(0);
    setError(null);
  }, []);

  const executeCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      setError("Cannot checkout with an empty cart.");
      return null;
    }

    setProcessing(true);
    setError(null);

    const payload = {
      customer: selectedCustomer?.id || null,
      payment_method: paymentMethod,
      discount: globalDiscount,
      items: cartItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        discount: item.discount,
      })),
    };

    try {
      const order = await posService.checkout(payload);
      clearCart();
      return order;
    } catch (err) {
      const detail = err.response?.data?.detail || "Checkout failed. Please verify stock.";
      setError(detail);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [cartItems, selectedCustomer, paymentMethod, globalDiscount, clearCart]);

  return {
    cartItems,
    cartModel,
    selectedCustomer,
    setSelectedCustomer,
    paymentMethod,
    setPaymentMethod,
    globalDiscount,
    setGlobalDiscount,
    processing,
    error,
    addItemToCart,
    updateQuantity,
    removeItem,
    clearCart,
    executeCheckout,
  };
}
