import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

interface WishlistState {
  items: string[]; // List of product IDs
  initialized: boolean;

  // Actions
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<{ added: boolean; isGuest: boolean }>;
  syncWithAccount: () => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      initialized: false,

      isInWishlist: (productId: string) => {
        return get().items.includes(productId);
      },

      toggle: async (productId: string) => {
        const current = get().items;
        const exists = current.includes(productId);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (exists) {
          // Remove from local state
          set({ items: current.filter((id) => id !== productId) });

          // If logged in, remove from Supabase wishlists table
          if (user) {
            try {
              await supabase
                .from("wishlists")
                .delete()
                .eq("user_id", user.id)
                .eq("product_id", productId);
            } catch (err) {
              console.error("[wishlist] Error removing from account:", err);
            }
          }

          return { added: false, isGuest: !user };
        } else {
          // Add to local state
          set({ items: [...current, productId] });

          // If logged in, save to Supabase wishlists table connected to user's account
          if (user) {
            try {
              await (supabase.from("wishlists") as any).upsert(
                {
                  user_id: user.id,
                  product_id: productId,
                },
                { onConflict: "user_id,product_id" }
              );
            } catch (err) {
              console.error("[wishlist] Error saving to account:", err);
            }
          }

          return { added: true, isGuest: !user };
        }
      },

      removeItem: async (productId: string) => {
        const current = get().items;
        set({ items: current.filter((id) => id !== productId) });

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          try {
            await supabase
              .from("wishlists")
              .delete()
              .eq("user_id", user.id)
              .eq("product_id", productId);
          } catch (err) {
            console.error("[wishlist] Error deleting item:", err);
          }
        }
      },

      syncWithAccount: async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          set({ initialized: true });
          return;
        }

        try {
          // 1. Fetch existing account wishlist from Supabase
          const { data, error } = await supabase
            .from("wishlists")
            .select("product_id")
            .eq("user_id", user.id);

          const serverProductIds: string[] =
            !error && data
              ? (data as Array<{ product_id: string }>).map((d) => d.product_id)
              : [];
          const localProductIds = get().items;

          // 2. Upload any local items not yet in account
          const newItemsToSync = localProductIds.filter(
            (id) => !serverProductIds.includes(id)
          );

          if (newItemsToSync.length > 0) {
            const rows = newItemsToSync.map((pid) => ({
              user_id: user.id,
              product_id: pid,
            }));
            await (supabase.from("wishlists") as any).upsert(rows, {
              onConflict: "user_id,product_id",
            });
          }

          // 3. Union both lists
          const merged = Array.from(new Set([...serverProductIds, ...localProductIds]));
          set({ items: merged, initialized: true });
        } catch (err) {
          console.error("[wishlist] Sync error:", err);
          set({ initialized: true });
        }
      },
    }),
    {
      name: "6xtn-wishlist",
    }
  )
);
