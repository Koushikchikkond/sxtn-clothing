// Auto-generated types matching supabase/migrations/20240001_initial_schema.sql
// Regenerate after schema changes:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:         string;
          full_name:  string | null;
          phone:      string | null;
          avatar_url: string | null;
          role:       "customer" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id:          string;
          full_name?:  string | null;
          phone?:      string | null;
          avatar_url?: string | null;
          role?:       "customer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?:  string | null;
          phone?:      string | null;
          avatar_url?: string | null;
          role?:       "customer" | "admin";
          updated_at?: string;
        };
      };

      categories: {
        Row: {
          id:         string;
          name:       string;
          slug:       string;
          image_url:  string | null;
          position:   number;
          created_at: string;
        };
        Insert: {
          id?:         string;
          name:        string;
          slug:        string;
          image_url?:  string | null;
          position?:   number;
          created_at?: string;
        };
        Update: {
          name?:      string;
          slug?:      string;
          image_url?: string | null;
          position?:  number;
        };
      };

      products: {
        Row: {
          id:               string;
          category_id:      string | null;
          name:             string;
          slug:             string;
          description:      string | null;
          price:            number;
          compare_at_price: number | null;
          is_active:        boolean;
          tags:             string[];
          features:         string[] | null;
          wash_care:        string[] | null;
          created_at:       string;
          updated_at:       string;
        };
        Insert: {
          id?:               string;
          category_id?:      string | null;
          name:              string;
          slug:              string;
          description?:      string | null;
          price:             number;
          compare_at_price?: number | null;
          is_active?:        boolean;
          tags?:             string[];
          features?:         string[] | null;
          wash_care?:        string[] | null;
          created_at?:       string;
          updated_at?:       string;
        };
        Update: {
          category_id?:      string | null;
          name?:             string;
          slug?:             string;
          description?:      string | null;
          price?:            number;
          compare_at_price?: number | null;
          is_active?:        boolean;
          tags?:             string[];
          features?:         string[] | null;
          wash_care?:        string[] | null;
          updated_at?:       string;
        };
      };

      product_images: {
        Row: {
          id:         string;
          product_id: string;
          url:        string;
          alt_text:   string | null;
          position:   number;
        };
        Insert: {
          id?:        string;
          product_id: string;
          url:        string;
          alt_text?:  string | null;
          position?:  number;
        };
        Update: {
          url?:      string;
          alt_text?: string | null;
          position?: number;
        };
      };

      product_variants: {
        Row: {
          id:             string;
          product_id:     string;
          size:           string;
          color:          string | null;
          sku:            string | null;
          stock:          number;
          price_override: number | null;
        };
        Insert: {
          id?:             string;
          product_id:      string;
          size:            string;
          color?:          string | null;
          sku?:            string | null;
          stock?:          number;
          price_override?: number | null;
        };
        Update: {
          size?:           string;
          color?:          string | null;
          sku?:            string | null;
          stock?:          number;
          price_override?: number | null;
        };
      };

      addresses: {
        Row: {
          id:         string;
          user_id:    string;
          full_name:  string;
          phone:      string;
          line1:      string;
          line2:      string | null;
          city:       string;
          state:      string;
          pincode:    string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?:        string;
          user_id:    string;
          full_name:  string;
          phone:      string;
          line1:      string;
          line2?:     string | null;
          city:       string;
          state:      string;
          pincode:    string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          full_name?:  string;
          phone?:      string;
          line1?:      string;
          line2?:      string | null;
          city?:       string;
          state?:      string;
          pincode?:    string;
          is_default?: boolean;
        };
      };

      orders: {
        Row: {
          id:                   string;
          user_id:              string | null;
          guest_email:          string | null;
          address_id:           string | null;
          shipping_address:     Json | null;
          status:               "pending" | "paid" | "confirmed" | "shipped" | "delivered" | "cancelled";
          subtotal:             number;
          shipping_fee:         number;
          total:                number;
          razorpay_order_id:    string | null;
          razorpay_payment_id:  string | null;
          notes:                string | null;
          created_at:           string;
          updated_at:           string;
        };
        Insert: {
          id?:                   string;
          user_id?:              string | null;
          guest_email?:          string | null;
          address_id?:           string | null;
          shipping_address?:     Json | null;
          status?:               "pending" | "paid" | "confirmed" | "shipped" | "delivered" | "cancelled";
          subtotal:              number;
          shipping_fee?:         number;
          total:                 number;
          razorpay_order_id?:    string | null;
          razorpay_payment_id?:  string | null;
          notes?:                string | null;
          created_at?:           string;
          updated_at?:           string;
        };
        Update: {
          status?:               "pending" | "paid" | "confirmed" | "shipped" | "delivered" | "cancelled";
          razorpay_order_id?:    string | null;
          razorpay_payment_id?:  string | null;
          shipping_address?:     Json | null;
          notes?:                string | null;
          updated_at?:           string;
        };
      };

      order_items: {
        Row: {
          id:           string;
          order_id:     string;
          variant_id:   string | null;
          product_name: string;
          size:         string | null;
          color:        string | null;
          quantity:     number;
          unit_price:   number;
        };
        Insert: {
          id?:          string;
          order_id:     string;
          variant_id?:  string | null;
          product_name: string;
          size?:        string | null;
          color?:       string | null;
          quantity:     number;
          unit_price:   number;
        };
        Update: {
          quantity?:  number;
          unit_price?: number;
        };
      };

      wishlists: {
        Row: {
          user_id:    string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          user_id:     string;
          product_id:  string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };

    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args:    Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
};

// ── Convenience type helpers ──────────────────────────────────
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Named shorthand types
export type Profile        = Tables<"profiles">;
export type Category       = Tables<"categories">;
export type Product        = Tables<"products">;
export type ProductImage   = Tables<"product_images">;
export type ProductVariant = Tables<"product_variants">;
export type Address        = Tables<"addresses">;
export type Order          = Tables<"orders">;
export type OrderItem      = Tables<"order_items">;
export type Wishlist       = Tables<"wishlists">;

export type OrderStatus = Order["status"];
