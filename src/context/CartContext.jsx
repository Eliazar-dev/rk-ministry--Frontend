import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rk_cart')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rk_cart', JSON.stringify(items));
    } catch {
      /* storage blocked: the cart still works for this visit */
    }
  }, [items]);

  /** Returns the new quantity of that product, and whether it was already in the cart. */
  const add = (product, qty = 1) => {
    const found = items.find((i) => i.id === product.id);
    setItems((prev) =>
      prev.some((i) => i.id === product.id)
        ? prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
        : [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, qty }]
    );
    return { qty: (found?.qty || 0) + qty, existed: Boolean(found) };
  };

  const setQty = (id, qty) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((n, i) => n + i.qty * i.price, 0), [items]);

  return <CartContext.Provider value={{ items, add, setQty, remove, clear, count, total }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
