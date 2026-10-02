/**
 * SXTN Branded Transactional Email Templates
 * Premium dark-mode minimalist aesthetic.
 */

export interface EmailOrderItem {
  name: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  price: number;
}

export interface EmailAddress {
  fullName?: string;
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
}

const BRAND_NAME = "SXTN";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sxtnclothing.com";

const baseEmailWrapper = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #050505;
      color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px 20px;
    }
    .card {
      background-color: #0e0e0e;
      border: 1px solid #222222;
      border-radius: 4px;
      padding: 32px;
    }
    .header {
      border-bottom: 1px solid #1f1f1f;
      padding-bottom: 24px;
      margin-bottom: 28px;
      text-align: center;
    }
    .brand {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 0.2em;
      color: #ffffff;
      text-transform: uppercase;
      margin: 0;
    }
    .subbrand {
      font-size: 11px;
      letter-spacing: 0.15em;
      color: #666666;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .heading {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #ffffff;
      text-transform: uppercase;
      margin: 0 0 12px 0;
    }
    .lead {
      font-size: 14px;
      line-height: 1.6;
      color: #999999;
      margin: 0 0 24px 0;
    }
    .order-box {
      background: #141414;
      border: 1px solid #222222;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
    }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #666666;
      margin-bottom: 4px;
    }
    .value {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      font-family: monospace;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #666666;
      border-bottom: 1px solid #1f1f1f;
      padding: 8px 0;
    }
    .items-table td {
      padding: 12px 0;
      border-bottom: 1px solid #181818;
      font-size: 13px;
      color: #cccccc;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
      color: #888888;
    }
    .grand-total {
      display: flex;
      justify-content: space-between;
      padding: 12px 0 0 0;
      border-top: 1px solid #222222;
      margin-top: 8px;
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
    }
    .btn {
      display: inline-block;
      background-color: #ffffff;
      color: #000000 !important;
      text-decoration: none;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 14px 28px;
      border-radius: 2px;
      margin-top: 24px;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding-top: 32px;
      font-size: 11px;
      color: #555555;
      letter-spacing: 0.05em;
      line-height: 1.6;
    }
    .footer a {
      color: #777777;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1 class="brand">${BRAND_NAME}</h1>
        <div class="subbrand">Official Store</div>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      <p>Questions? Reach out to support at <a href="mailto:support@sxtnclothing.com">support@sxtnclothing.com</a></p>
    </div>
  </div>
</body>
</html>
`;

/**
 * 1. Order Confirmation & Payment Successful Template
 */
export function getOrderConfirmationHtml(params: {
  orderId: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  items: EmailOrderItem[];
  address: EmailAddress;
  paymentId?: string;
}): string {
  const { orderId, total, subtotal, shippingFee, items, address, paymentId } = params;
  const shortId = orderId.slice(0, 8).toUpperCase();
  const recipient = address.fullName || address.full_name || "Customer";

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="font-weight: 600; color: #ffffff;">
          ${item.name}
          ${item.size ? `<span style="font-size: 11px; color: #777; display: block;">Size: ${item.size}</span>` : ""}
        </td>
        <td style="text-align: center; color: #888;">${item.quantity}</td>
        <td style="text-align: right; font-weight: 600; color: #ffffff;">
          ₹${(item.price * item.quantity).toLocaleString("en-IN")}
        </td>
      </tr>
    `
    )
    .join("");

  const content = `
    <h2 class="heading">Payment Successful</h2>
    <p class="lead">
      Thank you for your order, <strong>${recipient}</strong>. Your payment has been received and verified. We are now preparing your pieces for shipment.
    </p>

    <div style="background: #141414; border: 1px solid #222222; padding: 14px 18px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td>
            <div class="label">Order Reference</div>
            <div class="value">#${shortId}</div>
          </td>
          ${
            paymentId
              ? `
          <td style="text-align: right;">
            <div class="label">Razorpay Payment ID</div>
            <div class="value" style="font-size: 11px;">${paymentId}</div>
          </td>
          `
              : ""
          }
        </tr>
      </table>
    </div>

    <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #fff; margin-bottom: 12px;">
      Items Ordered
    </h3>
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Order Totals -->
    <div style="border-top: 1px solid #1f1f1f; padding-top: 12px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td style="font-size: 13px; color: #777; padding: 3px 0;">Subtotal</td>
          <td style="font-size: 13px; color: #ccc; text-align: right;">₹${subtotal.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="font-size: 13px; color: #777; padding: 3px 0;">Shipping</td>
          <td style="font-size: 13px; color: ${shippingFee === 0 ? "#4ade80" : "#ccc"}; text-align: right;">
            ${shippingFee === 0 ? "FREE" : `₹${shippingFee.toLocaleString("en-IN")}`}
          </td>
        </tr>
        <tr>
          <td style="font-size: 16px; font-weight: 800; color: #fff; padding-top: 8px;">Total Paid</td>
          <td style="font-size: 16px; font-weight: 800; color: #fff; text-align: right; padding-top: 8px;">
            ₹${total.toLocaleString("en-IN")}
          </td>
        </tr>
      </table>
    </div>

    <!-- Shipping Address -->
    <div style="background: #121212; border: 1px solid #1f1f1f; padding: 16px; margin-bottom: 24px;">
      <div class="label">Delivering To</div>
      <div style="font-size: 13px; color: #fff; font-weight: 600; margin-bottom: 4px;">${recipient}</div>
      <div style="font-size: 12px; color: #888; line-height: 1.5;">
        ${address.line1 || ""}${address.line2 ? `, ${address.line2}` : ""}<br>
        ${address.city || ""}, ${address.state || ""} — ${address.pincode || ""}<br>
        ${address.phone ? `Phone: ${address.phone}` : ""}
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${SITE_URL}/account/orders" class="btn">View Order in Account</a>
    </div>
  `;

  return baseEmailWrapper(`Order #${shortId} Confirmed — SXTN`, content);
}

/**
 * 2. Order Status Update Email (Confirmed, Shipped, Delivered, Cancelled)
 */
export function getOrderStatusUpdateHtml(params: {
  orderId: string;
  status: "confirmed" | "shipped" | "delivered" | "cancelled";
  recipientName: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  total?: number;
}): string {
  const { orderId, status, recipientName, trackingNumber, courierName, trackingUrl } = params;
  const shortId = orderId.slice(0, 8).toUpperCase();

  let statusTitle = "Order Update";
  let statusMessage = "Your order status has been updated.";
  let badgeColor = "#ffffff";
  let badgeBg = "#1f1f1f";

  if (status === "confirmed") {
    statusTitle = "Order Confirmed";
    statusMessage = "Your order has been accepted and is currently being packed with precision.";
    badgeColor = "#a78bfa";
    badgeBg = "#2e1065";
  } else if (status === "shipped") {
    statusTitle = "Your Order is On the Way";
    statusMessage = "Good news! Your order has been dispatched and is out for delivery.";
    badgeColor = "#38bdf8";
    badgeBg = "#082f49";
  } else if (status === "delivered") {
    statusTitle = "Order Delivered";
    statusMessage = "Your package has been successfully delivered. We hope you love your pieces.";
    badgeColor = "#4ade80";
    badgeBg = "#052e16";
  } else if (status === "cancelled") {
    statusTitle = "Order Cancelled";
    statusMessage = "Your order has been cancelled. If you already made a payment, your refund will be processed within 5-7 business days.";
    badgeColor = "#f87171";
    badgeBg = "#450a0a";
  }

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background: ${badgeBg}; color: ${badgeColor}; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 12px; border-radius: 999px;">
        ${status.toUpperCase()}
      </span>
    </div>

    <h2 class="heading" style="text-align: center;">${statusTitle}</h2>
    <p class="lead" style="text-align: center;">
      Hello <strong>${recipientName}</strong>, ${statusMessage}
    </p>

    <div style="background: #141414; border: 1px solid #222222; padding: 16px 20px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td>
            <div class="label">Order Number</div>
            <div class="value">#${shortId}</div>
          </td>
          ${
            trackingNumber
              ? `
          <td style="text-align: right;">
            <div class="label">Tracking Number (${courierName || "Courier"})</div>
            <div class="value">${trackingNumber}</div>
          </td>
          `
              : ""
          }
        </tr>
      </table>
    </div>

    ${
      trackingUrl
        ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${trackingUrl}" target="_blank" class="btn" style="background: #38bdf8; color: #000;">
          Track Shipment →
        </a>
      </div>
    `
        : `
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${SITE_URL}/account/orders" class="btn">
          View Order Details
        </a>
      </div>
    `
    }
  `;

  return baseEmailWrapper(`Order #${shortId}: ${statusTitle} — SXTN`, content);
}

/**
 * 3. Payment Failed Template
 */
export function getPaymentFailedHtml(params: {
  orderId?: string;
  total?: number;
  recipientName?: string;
  retryUrl?: string;
}): string {
  const { orderId, total, recipientName = "Customer", retryUrl = `${SITE_URL}/cart` } = params;

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background: #450a0a; color: #f87171; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 12px; border-radius: 999px;">
        Payment Unsuccessful
      </span>
    </div>

    <h2 class="heading" style="text-align: center;">Payment Incomplete</h2>
    <p class="lead" style="text-align: center;">
      Hello <strong>${recipientName}</strong>, your recent payment attempt was not completed or was declined by the bank. No funds were debited, and your cart items are still saved for you.
    </p>

    ${
      total
        ? `
    <div style="background: #141414; border: 1px solid #222222; padding: 14px 18px; margin-bottom: 24px; text-align: center;">
      <div class="label">Order Amount</div>
      <div class="value">₹${total.toLocaleString("en-IN")}</div>
    </div>
    `
        : ""
    }

    <div style="text-align: center; margin-top: 24px;">
      <a href="${retryUrl}" class="btn">
        Return to Checkout & Retry
      </a>
    </div>
  `;

  return baseEmailWrapper("Payment Incomplete — SXTN", content);
}

/**
 * 4. Test Email Template
 */
export function getTestEmailHtml(email: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background: #052e16; color: #4ade80; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 12px; border-radius: 999px;">
        API Connected
      </span>
    </div>

    <h2 class="heading" style="text-align: center;">Resend is Working!</h2>
    <p class="lead" style="text-align: center;">
      This is a test notification confirming that your <strong>RESEND_API_KEY</strong> is fully functional and ready to send transactional emails for <strong>SXTN</strong>.
    </p>

    <div style="background: #141414; border: 1px solid #222222; padding: 16px 20px; margin-bottom: 24px;">
      <div class="label">Recipient Verified</div>
      <div class="value" style="font-size: 13px;">${email}</div>
      <div class="label" style="margin-top: 12px;">Timestamp</div>
      <div class="value" style="font-size: 12px; color: #888;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</div>
    </div>

    <p style="font-size: 12px; color: #666; text-align: center; line-height: 1.6;">
      Once you verify your custom domain in Resend Dashboard, you will be able to send to any customer address from <code>orders@yourdomain.com</code>.
    </p>
  `;

  return baseEmailWrapper("SXTN — Resend Test Verification", content);
}
