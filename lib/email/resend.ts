import { Resend } from "resend";
import {
  getOrderConfirmationHtml,
  getOrderStatusUpdateHtml,
  getPaymentFailedHtml,
  getTestEmailHtml,
  EmailOrderItem,
  EmailAddress,
} from "./templates";

export function getFromEmail(): string {
  const envVal = process.env.RESEND_FROM_EMAIL;
  if (!envVal) return "SXTN Store <onboarding@resend.dev>";
  return envVal.trim().replace(/^["']|["']$/g, "");
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

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [params.to],
      subject: `Order #${shortId} Confirmed — SXTN`,
      html,
    });

    if (error) {
      console.error("[Resend] Failed to send order confirmation email:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Order confirmation email sent to ${params.to} (ID: ${data?.id})`);
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
      cancelled: `Order #${shortId} Cancellation Update — SXTN`,
    };

    const subject = subjects[params.status] || `Order #${shortId} Status Update — SXTN`;

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [params.to],
      subject,
      html,
    });

    if (error) {
      console.error(`[Resend] Failed to send ${params.status} email:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Status email (${params.status}) sent to ${params.to} (ID: ${data?.id})`);
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

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
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

/**
 * Send Test Email to Verify RESEND_API_KEY
 */
export async function sendTestEmail(toEmail: string) {
  const resend = getResendClient();
  if (!resend) {
    return {
      success: false,
      error: "RESEND_API_KEY is not defined in environment variables.",
    };
  }

  try {
    const html = getTestEmailHtml(toEmail);
    const fromAddress = getFromEmail();

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `SXTN — Resend Connection Test`,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id, from: fromAddress, to: toEmail };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send test email",
    };
  }
}
