import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export interface CartValidationResult {
  variantId: string;
  status: "available" | "out_of_stock" | "removed";
  currentStock: number;
  productName: string;
  message: string | null;
}

/**
 * POST /api/cart/validate
 * Validates whether cart items are still active and in stock.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "Invalid items array" }, { status: 400 });
    }

    const items: Array<{ variantId: string; productId?: string }> = body.items;
    if (items.length === 0) {
      return NextResponse.json({ valid: true, items: [] });
    }

    const variantIds = items
      .map((i) => i.variantId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    const supabase = await createClient();

    // Query variants with parent product status
    const { data: variants, error } = await (supabase.from("product_variants") as any)
      .select(`
        id,
        stock,
        size,
        color,
        products (
          id,
          name,
          slug,
          is_active
        )
      `)
      .in("id", variantIds);

    if (error) {
      console.error("[Cart Validation] Supabase query error:", error);
      return NextResponse.json({ error: "Failed to validate inventory" }, { status: 500 });
    }

    const variantMap = new Map<string, any>();
    (variants || []).forEach((v: any) => variantMap.set(v.id, v));

    let allAvailable = true;

    const results: CartValidationResult[] = items.map((cartItem) => {
      const variant = variantMap.get(cartItem.variantId);

      // Case 1: Variant deleted, or parent product unlisted / inactive / deleted
      if (!variant || !variant.products || variant.products.is_active === false) {
        allAvailable = false;
        return {
          variantId: cartItem.variantId,
          status: "removed",
          currentStock: 0,
          productName: variant?.products?.name || "Item",
          message: "Removed from catalog",
        };
      }

      // Case 2: Variant stock is 0
      const stock = typeof variant.stock === "number" ? variant.stock : 0;
      if (stock <= 0) {
        allAvailable = false;
        return {
          variantId: cartItem.variantId,
          status: "out_of_stock",
          currentStock: 0,
          productName: variant.products.name,
          message: "Out of stock",
        };
      }

      // Case 3: Available
      return {
        variantId: cartItem.variantId,
        status: "available",
        currentStock: stock,
        productName: variant.products.name,
        message: null,
      };
    });

    return NextResponse.json({
      valid: allAvailable,
      items: results,
    });
  } catch (err: unknown) {
    console.error("[Cart Validation] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

