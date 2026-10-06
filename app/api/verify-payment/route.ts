import { NextRequest, NextResponse } from "next/server";
import {
  verifyRazorpaySignature,
  calculateVerifiedCartTotal,
} from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/types/database.types";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      address,
    } = body;

    // Validate required Razorpay signature fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error: "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature. Payment could not be verified." },
        { status: 400 }
      );
    }

    // If order was created from storefront with items and address, persist to database
    if (items && Array.isArray(items) && items.length > 0) {
      try {
        const verified = await calculateVerifiedCartTotal(items);
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const adminDb = createAdminClient();

        let linkedAddressId = address?.addressId || null;

        // If user is authenticated and wants this address saved to profile (and doesn't already have it linked)
        if (user && address && !linkedAddressId && address.saveAddress !== false) {
          try {
            const { data: savedAddr } = await adminDb
              .from("addresses")
              .insert({
                user_id: user.id,
                full_name: address.fullName || address.full_name || "",
                phone: address.phone || "",
                line1: address.line1 || "",
                line2: address.line2 || null,
                city: address.city || "",
                state: address.state || "",
                pincode: address.pincode || "",
                is_default: false,
              } as any)
              .select("id")
              .maybeSingle();

            if (savedAddr && (savedAddr as any).id) {
              linkedAddressId = (savedAddr as any).id;
            }
          } catch (addrErr) {
            console.warn("[POST /api/verify-payment] Notice: Could not auto-save address to addresses table:", addrErr);
          }
        }

        const orderPayload: TablesInsert<"orders"> = {
          user_id: user?.id ?? null,
          guest_email: user?.email ?? address?.email ?? null,
          address_id: linkedAddressId,
          status: "paid",
          subtotal: verified.subtotal,
          shipping_fee: verified.shippingFee,
          total: verified.total,
          razorpay_order_id,
          razorpay_payment_id,
          shipping_address: address || null,
        };

        const { data: order, error: orderError } = await adminDb
          .from("orders")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(orderPayload as any)
          .select("id")
          .single();

        if (orderError || !order) {
          console.error("[POST /api/verify-payment] Order insert failed:", orderError);
          return NextResponse.json(
            { error: "Payment verified, but failed to save order to database." },
            { status: 500 }
          );
        }

        const orderItems: TablesInsert<"order_items">[] = verified.items.map(
          (item) => ({
            order_id: (order as { id: string }).id,
            variant_id: item.variantId,
            product_name: item.name,
            size: item.size,
            color: item.color,
            unit_price: item.price,
            quantity: item.quantity,
          })
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await adminDb.from("order_items").insert(orderItems as any);

        // Send Order Confirmation & Payment Receipt Email via Resend
        // NOTE: Must be awaited — Vercel serverless kills fire-and-forget tasks
        // on function return, so the email would never be sent without await.
        const customerEmail = user?.email || address?.email;
        if (customerEmail) {
          const emailResult = await sendOrderConfirmationEmail({
            to: customerEmail,
            orderId: (order as { id: string }).id,
            total: verified.total,
            subtotal: verified.subtotal,
            shippingFee: verified.shippingFee,
            items: verified.items.map((it) => ({
              name: it.name,
              size: it.size,
              color: it.color,
              quantity: it.quantity,
              price: it.price,
            })),
            address: address,
            paymentId: razorpay_payment_id,
          }).catch((emailErr) => {
            console.warn("[POST /api/verify-payment] Email send error:", emailErr);
            return { success: false, error: String(emailErr) };
          });
          console.log(`[POST /api/verify-payment] Confirmation email result:`, emailResult);
        }

        return NextResponse.json({
          success: true,
          message: "Payment verified and order created successfully.",
          orderId: (order as { id: string }).id,
        });
      } catch (dbErr) {
        console.error("[POST /api/verify-payment] Database save error:", dbErr);
        return NextResponse.json(
          {
            success: true,
            warning: "Payment verified, but database persistence encountered an issue.",
          },
          { status: 200 }
        );
      }
    }

    // Standard verification response
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (err: unknown) {
    console.error("[POST /api/verify-payment] Error:", err);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
