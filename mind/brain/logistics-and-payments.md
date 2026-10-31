---
title: "SXTN Logistics, Payments & Email Integrations"
date: 2026-10-29
tags:
  - brain
  - razorpay
  - shiprocket
  - resend
  - payments
  - logistics
---

# 💳 SXTN Logistics, Payments & Email Integrations

> [!abstract] Overview
> SXTN integrates three major external enterprise service providers: **Razorpay** (domestic payment orchestration in INR), **Shiprocket** (automated courier dispatch across Delhivery/Bluedart/DTDC), and **Resend** (transactional emails).

---

## 1. Razorpay Integration (`lib/razorpay.ts`)

### Configuration & Credentials
Required environment variables:
```bash
RAZORPAY_KEY_ID="rzp_live_..."          # Public key (safe for client checkout modal)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."               # Server secret — NEVER expose to browser
RAZORPAY_WEBHOOK_SECRET="..."           # Webhook signing secret
```

### Server-Side Price Recalculation
To eliminate client price tampering, the server recalculates the exact checkout price:
```typescript
export async function calculateVerifiedCartTotal(items: { variantId: string; quantity: number }[]) {
  // Queries DB for unit prices
  // Subtotal = sum(unit_price * quantity)
  // Shipping Fee = Subtotal >= 999 ? 0 : 99
  // Total = Subtotal + Shipping Fee
}
```

### Signature Verification Algorithm
Validates that payments originated from Razorpay's authentic server:
```typescript
const body = `${razorpay_order_id}|${razorpay_payment_id}`;
const expectedSignature = crypto
  .createHmac("sha256", keySecret)
  .update(body)
  .digest("hex");

const isValid = expectedSignature === razorpay_signature;
```

### Webhook Event Handling (`app/api/webhooks/razorpay/route.ts`)
- **Events handled**: `order.paid`, `payment.captured`, `payment.failed`
- Verifies `x-razorpay-signature` using `crypto.timingSafeEqual`.
- Updates order status to `paid` if client connection was interrupted before callback.

---

## 2. Shiprocket Logistics Integration (`lib/shiprocket.ts`)

### Configuration
Required environment variables:
```bash
SHIPROCKET_EMAIL="logistics@6xtn.in"
SHIPROCKET_PASSWORD="..."
SHIPROCKET_CHANNEL_ID="12345"             # Optional custom sales channel ID
SHIPROCKET_PICKUP_LOCATION="Primary"      # Pickup warehouse location name
SHIPROCKET_WEBHOOK_TOKEN="..."            # Webhook authentication header
```

### In-Memory JWT Authentication Caching
Avoids redundant authentication HTTP requests by caching the JWT token in memory for the duration of the serverless instance lifecycle with a 24-hour expiration buffer.

### Order Fulfillment Workflow (`app/api/admin/orders/[id]/fulfill/route.ts`)
Admin can dispatch an order with one click:
1. Validates admin permissions (`requireAdmin()`).
2. Compiles order weight, dimensions (length/breadth/height), and line items.
3. Submits `createShiprocketOrder()`.
4. Automatically calls `assignCourierAndGenerateAWB()`.
5. Updates `public.orders` with:
   - `shiprocket_order_id`
   - `shiprocket_shipment_id`
   - `awb_number`
   - `courier_name`
   - `tracking_url`
   - Status transitioned to `'confirmed'` or `'shipped'`.

### Webhook Status Mapping (`app/api/webhooks/shiprocket/route.ts`)
Shiprocket notifies our webhook as the parcel travels through checkpoints:

| Status Code | Shiprocket Status | Internal Order Status | Customer Action |
|---|---|---|---|
| `7` | Picked Up | Internal milestone | None |
| `8` | In Transit | Internal milestone | None |
| `17` | Out for Delivery | `shipped` | Resend "Out for Delivery" email |
| `9` | Delivered | `delivered` | Resend "Delivered" confirmation email |
| `10` | Undelivered | Internal alert | Support team notified |
| `48` | RTO Initiated | Internal alert | Return to origin notification |

---

## 3. Resend Transactional Email System (`lib/email/resend.ts`)

### Configuration
```bash
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="6XTN <orders@6xtn.in>"
RESEND_FROM_ORDERS="6XTN Orders <orders@6xtn.in>"
RESEND_FROM_SHIPPING="6XTN Shipping <shipping@6xtn.in>"
RESEND_FROM_SUPPORT="6XTN Support <support@6xtn.in>"
```

### Dynamic Sender Routing
Emails are intelligently dispatched from specialized domain aliases:
- Orders & receipts: `orders@6xtn.in`
- Shipments & tracking: `shipping@6xtn.in`
- Customer care: `support@6xtn.in`

### Transactional Email Templates (`lib/email/templates.ts`)
Designed with brutalist monochrome aesthetics, high readability, and responsive mobile layouts:
1. **Order Confirmation**: Line items, sizes, prices, order ID, delivery address, and payment ID.
2. **Order Status Update**: Live tracking link, courier name, and current shipping status.
3. **Payment Failed Notification**: Direct link to re-attempt checkout without losing cart contents.

