import { create } from 'zustand';
import { type ShopItem } from '../types/database.types';

interface CartItem extends ShopItem {
  cartQuantity: number;
}

interface CartStore {
  items: CartItem[];
  addToCart: (item: ShopItem) => void;
  removeFromCart: (itemId: string) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addToCart: (item) =>
    set((state) => {
      const existingItem = state.items.find((i) => i.id === item.id);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, cartQuantity: 1 }] };
    }),
  removeFromCart: (itemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    })),
  increaseQuantity: (itemId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, cartQuantity: i.cartQuantity + 1 } : i
      ),
    })),
  decreaseQuantity: (itemId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, cartQuantity: Math.max(1, i.cartQuantity - 1) } : i
      ),
    })),
  clearCart: () => set({ items: [] }),
}));
