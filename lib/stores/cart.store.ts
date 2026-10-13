import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  name: string;
  imageUrl: string;
  price: number;
  size: string;
  color: string | null;
  quantity: number;
  /** Available stock from product_variants.stock — stored so the UI can cap quantity without a fresh DB fetch */
  stock: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => { capped: boolean };
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        let capped = false;
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === newItem.variantId
          );
          if (existing) {
            const newQty = existing.quantity + 1;
            const cappedQty = Math.min(newQty, newItem.stock);
            if (cappedQty < newQty) capped = true;
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: cappedQty, stock: newItem.stock }
                  : i
              ),
              isOpen: true,
            };
          }
          // New item: start at qty 1 (stock must be >= 1 since PDP disables OOS buttons)
          return {
            items: [...state.items, { ...newItem, quantity: 1 }],
            isOpen: true,
          };
        });
        return { capped };
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      updateQty: (variantId, quantity) => {
        if (quantity < 1) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.variantId !== variantId) return i;
            const cappedQty = Math.min(quantity, i.stock);
            return { ...i, quantity: cappedQty };
          }),
        }));
      },

      clearCart: () => set({ items: [], isOpen: false }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "sxtn-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
