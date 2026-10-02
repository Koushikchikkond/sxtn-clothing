import { Resend } from "resend";
import {
  getOrderConfirmationHtml,
  getOrderStatusUpdateHtml,
  getPaymentFailedHtml,
  EmailOrderItem,
  EmailAddress,
} from "./templates";

export type EmailSenderType =
  | "orders"
  | "shipping"
  | "support"
  | "billing"
  | "updates"
  | "hello"
  | "default";

export function getSenderEmail(type: EmailSenderType = "default"): string {
  const base =
    process.env.RESEND_FROM_EMAIL?.trim().replace(/^["']|["']$/g, "") ||
    "SXTN <orders@6xtn.in>";

  // Extract domain from base, e.g. "6xtn.in"
  const domainMatch = base.match(/@([a-zA-Z0-9.-]+)/);
  const domain = domainMatch ? domainMatch[1] : "6xtn.in";

  if (type === "orders") {
    const custom = process.env.RESEND_FROM_ORDERS?.trim().replace(/^["']|["']$/g, "");
    if (custom) return custom;
    return `SXTN Orders <orders@${domain}>`;
  }

  if (type === "shipping") {
    const custom = process.env.RESEND_FROM_SHIPPING?.trim().replace(/^["']|["']$/g, "");
    if (custom) return custom;
    return `SXTN Shipping <shipping@${domain}>`;
  }

  if (type === "support") {
    const custom = process.env.RESEND_FROM_SUPPORT?.trim().replace(/^["']|["']$/g, "");
    if (custom) return custom;
    return `SXTN Support <support@${domain}>`;
  }

  if (type === "billing") {
    const custom = process.env.RESEND_FROM_BILLING?.trim().replace(/^["']|["']$/g, "");
    if (custom) return custom;
    return `SXTN Billing <billing@${domain}>`;
  }

  if (type === "updates") {
    const custom = process.env.RESEND_FROM_UPDATES?.trim().replace(/^["']|["']$/g, "");
    if (custom) return custom;
    return `SXTN Updates <updates@${domain}>`;
  }

  if (type === "hello") {
    const custom = process.env.RESEND_FROM_HELLO?.trim().replace(/^["']|["']$/g, "");
    if (custom) return custom;
    return `SXTN <hello@${domain}>`;
  }

  return base;
}

export function getFromEmail(): string {
  return getSenderEmail("default");
}

export const DEFAULT_FROM_EMAIL = getFromEmail();

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[Resend] RESEND_API_KEY is not defined in environment variables. Email will be skipped."
    );
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send Order Confirmation & Payment Receipt Email
 */
export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  items: EmailOrderItem[];
  address: EmailAddress;
  paymentId?: string;
}) {
  const resend = getResendClient();
  if (!resend) return { success: false, skipped: true, error: "RESEND_API_KEY missing" };

  try {
    const html = getOrderConfirmationHtml(params);
    const shortId = params.orderId.slice(0, 8).toUpperCase();
    const sender = getSenderEmail("orders");

    const { data, error } = await resend.emails.send({
      from: sender,
      to: [params.to],
      subject: `Order #${shortId} Confirmed — SXTN`,
      html,
    });

    if (error) {
      console.error("[Resend] Failed to send order confirmation email:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Order confirmation email sent to ${params.to} from ${sender} (ID: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err: unknown) {
    console.error("[Resend] Unexpected error sending confirmation email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

/**
 * Send Order Status Update Email (Confirmed, Shipped, Delivered, Cancelled)
 */
export async function sendOrderStatusEmail(params: {
  to: string;
  orderId: string;
  status: "confirmed" | "shipped" | "delivered" | "cancelled";
  recipientName: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  reason?: string | null;
  notes?: string | null;
  total?: number;
}) {
  const resend = getResendClient();
  if (!resend) return { success: false, skipped: true, error: "RESEND_API_KEY missing" };

  try {
    const html = getOrderStatusUpdateHtml(params);
    const shortId = params.orderId.slice(0, 8).toUpperCase();

    const subjects: Record<string, string> = {
      confirmed: `Order #${shortId} Confirmed & Preparing — SXTN`,
      shipped: `Order #${shortId} Dispatched & Out for Delivery — SXTN`,
      delivered: `Order #${shortId} Delivered Successfully — SXTN`,
      cancelled: `Order #${shortId} Cancelled — SXTN`,
    };

    const subject = subjects[params.status] || `Order #${shortId} Status Update — SXTN`;

    const senderType =
      params.status === "cancelled"
        ? "support"
        : params.status === "shipped" || params.status === "delivered"
        ? "shipping"
        : "orders";

    const sender = getSenderEmail(senderType);

    const { data, error } = await resend.emails.send({
      from: sender,
      to: [params.to],
      subject,
      html,
    });

    if (error) {
      console.error(`[Resend] Failed to send ${params.status} email:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Status email (${params.status}) sent to ${params.to} from ${sender} (ID: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err: unknown) {
    console.error("[Resend] Unexpected error sending status email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send status email",
    };
  }
}

/**
 * Send Payment Failed Email
 */
export async function sendPaymentFailedEmail(params: {
  to: string;
  orderId?: string;
  total?: number;
  recipientName?: string;
  retryUrl?: string;
}) {
  const resend = getResendClient();
  if (!resend) return { success: false, skipped: true, error: "RESEND_API_KEY missing" };

  try {
    const html = getPaymentFailedHtml(params);
    const sender = getSenderEmail("support");

    const { data, error } = await resend.emails.send({
      from: sender,
      to: [params.to],
      subject: `Payment Incomplete — SXTN Order`,
      html,
    });

    if (error) {
      console.error("[Resend] Failed to send payment failed email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    console.error("[Resend] Unexpected error sending payment failed email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send payment failed email",
    };
  }
}

export const AVAILABLE_SENDERS = [
  { id: "orders", email: "orders@6xtn.in", label: "SXTN Orders", desc: "Order confirmation, payment receipts, order received" },
  { id: "shipping", email: "shipping@6xtn.in", label: "SXTN Shipping", desc: "Out for delivery, dispatched, tracking numbers, delivered" },
  { id: "support", email: "support@6xtn.in", label: "SXTN Support", desc: "Order cancellation with reasons, refund updates, failed payments" },
  { id: "billing", email: "billing@6xtn.in", label: "SXTN Billing", desc: "Invoices, payment reconciliation, tax queries" },
  { id: "updates", email: "updates@6xtn.in", label: "SXTN Updates", desc: "Product drops, restocks, brand notifications" },
  { id: "hello", email: "hello@6xtn.in", label: "SXTN Concierge", desc: "General brand touchpoint & customer queries" },
] as const;

