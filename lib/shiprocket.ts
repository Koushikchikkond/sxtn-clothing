/**
 * lib/shiprocket.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shiprocket API client for SXTN.
 *
 * Handles:
 *   • JWT authentication (auto-refresh using cached token)
 *   • Create Shiprocket order (with channel/courier assignment)
 *   • Request AWB + assign courier
 *   • Generate pickup
 *   • Track shipment by AWB
 *   • Cancel shipment
 *
 * Environment variables required:
 *   SHIPROCKET_EMAIL        — your Shiprocket login email
 *   SHIPROCKET_PASSWORD     — your Shiprocket login password
 *   SHIPROCKET_CHANNEL_ID   — (optional) Shiprocket sales channel ID
 *   SHIPROCKET_PICKUP_LOCATION — (optional) pickup location name (default: "Primary")
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SHIPROCKET_API = "https://apiv2.shiprocket.in/v1/external";

// ── In-memory token cache (per serverless instance lifetime) ─────────────────
let _cachedToken: string | null = null;
let _tokenExpiresAt: number = 0;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface ShiprocketOrderPayload {
  order_id: string;          // Your internal order ID (used as Shiprocket order_id)
  order_date: string;        // ISO date string  e.g. "2024-01-15 14:30:00"
  channel_id?: number;       // Shiprocket channel ID (optional)
  pickup_location?: string;  // Pickup location name (default: "Primary")
  comment?: string;

  // Billing (same as shipping for most DTC)
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  billing_alternate_phone?: string;

  // Shipping — mark as same_as_billing if identical
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;

  // Order items
  order_items: ShiprocketOrderItem[];

  // Financials
  payment_method: "Prepaid" | "COD";
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;  // cm
  breadth: number; // cm
  height: number;  // cm
  weight: number;  // kg
}

export interface ShiprocketCreatedOrder {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: boolean;
  awb_assign_status: number;
  response: {
    data: {
      awb_code: string;
      courier_name: string;
      courier_company_id: number;
      shipment_id: number;
      pickup_scheduled_date?: string;
      pickup_token_number?: string;
      routing_code?: string;
      remark?: string;
      label_url?: string;
      invoice_url?: string;
      manifest_url?: string;
    };
  };
}

export interface ShiprocketTrackingPayload {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: Array<{
      id: number;
      awb_code: string;
      courier_company_id: number;
      shipment_id: number;
      order_id: number;
      pickup_date: string | null;
      delivered_date: string | null;
      weight: string;
      packages: number;
      current_status: string;
      delivered_to: string;
      destination: string;
      consignee_name: string;
      origin: string;
      courier_agent_details: string | null;
    }>;
    shipment_track_activities: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
      "sr-status": string;
      "sr-status-label": string;
    }>;
    qc_enabled: boolean;
    etd: string | null;
    promise: string | null;
    help_center: string | null;
    destination_sensitive_zone: boolean;
    source_sensitive_zone: boolean;
  };
}

// ── Authentication ────────────────────────────────────────────────────────────

/**
 * Get a valid Shiprocket JWT token.
 * Caches the token for 9 days (Shiprocket tokens are valid for 10 days).
 */
export async function getShiprocketToken(): Promise<string> {
  const now = Date.now();

  if (_cachedToken && _tokenExpiresAt > now) {
    return _cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "[Shiprocket] SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD environment variables are required."
    );
  }

  const res = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[Shiprocket] Auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();

  if (!data.token) {
    throw new Error("[Shiprocket] Auth response did not contain a token.");
  }

  // Cache for 9 days (in milliseconds)
  _cachedToken = data.token as string;
  _tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;

  console.log("[Shiprocket] Authenticated successfully. Token cached for 9 days.");
  return _cachedToken;
}

// Helper to make authenticated requests
async function shiprocketFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getShiprocketToken();

  const res = await fetch(`${SHIPROCKET_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    // Clear cached token on 401 so next call re-authenticates
    if (res.status === 401) {
      _cachedToken = null;
      _tokenExpiresAt = 0;
    }
    const body = await res.text();
    throw new Error(`[Shiprocket] ${options.method || "GET"} ${path} failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Order Management ──────────────────────────────────────────────────────────

/**
 * Create a new order in Shiprocket.
 * Returns the Shiprocket order ID and shipment ID.
 */
export async function createShiprocketOrder(
  payload: ShiprocketOrderPayload
): Promise<{ shiprocketOrderId: number; shipmentId: number; status: string }> {
  const data = await shiprocketFetch<{
    order_id: number;
    shipment_id: number;
    status: string;
    payload?: unknown;
  }>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data.order_id) {
    throw new Error(
      `[Shiprocket] Order creation failed. Response: ${JSON.stringify(data)}`
    );
  }

  console.log(
    `[Shiprocket] Order created — Shiprocket Order ID: ${data.order_id}, Shipment ID: ${data.shipment_id}`
  );

  return {
    shiprocketOrderId: data.order_id,
    shipmentId: data.shipment_id,
    status: data.status,
  };
}

/**
 * Assign AWB to a shipment and return the AWB code & courier name.
 * Shiprocket auto-selects the best courier if no courier_id is provided.
 */
export async function assignAWB(shipmentId: number): Promise<{
  awbCode: string;
  courierName: string;
  courierCompanyId: number;
  labelUrl?: string;
}> {
  const data = await shiprocketFetch<{
    awb_assign_status: number;
    response: {
      data: {
        awb_code: string;
        courier_name: string;
        courier_company_id: number;
        label_url?: string;
      };
    };
  }>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: String(shipmentId) }),
  });

  if (!data.response?.data?.awb_code) {
    throw new Error(
      `[Shiprocket] AWB assignment failed. Response: ${JSON.stringify(data)}`
    );
  }

  const { awb_code, courier_name, courier_company_id, label_url } =
    data.response.data;

  console.log(
    `[Shiprocket] AWB ${awb_code} assigned via ${courier_name} for shipment ${shipmentId}`
  );

  return {
    awbCode: awb_code,
    courierName: courier_name,
    courierCompanyId: courier_company_id,
    labelUrl: label_url,
  };
}

/**
 * Schedule a pickup for a given shipment.
 */
export async function generatePickup(shipmentIds: number[]): Promise<boolean> {
  try {
    await shiprocketFetch<unknown>("/courier/generate/pickup", {
      method: "POST",
      body: JSON.stringify({ shipment_id: shipmentIds }),
    });
    console.log(`[Shiprocket] Pickup scheduled for shipments: ${shipmentIds.join(", ")}`);
    return true;
  } catch (err) {
    console.error("[Shiprocket] Pickup scheduling error:", err);
    return false;
  }
}

/**
 * Full fulfillment flow: create order → assign AWB → schedule pickup.
 * Returns all IDs needed to store in the database.
 */
export async function fulfillOrder(payload: ShiprocketOrderPayload): Promise<{
  shiprocketOrderId: number;
  shipmentId: number;
  awbCode: string;
  courierName: string;
  trackingUrl: string;
}> {
  // Step 1: Create order
  const { shiprocketOrderId, shipmentId } = await createShiprocketOrder(payload);

  // Step 2: Assign AWB
  const { awbCode, courierName } = await assignAWB(shipmentId);

  // Step 3: Schedule pickup (non-blocking — failure doesn't stop the flow)
  await generatePickup([shipmentId]);

  // Build standard Shiprocket tracking URL
  const trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;

  return {
    shiprocketOrderId,
    shipmentId,
    awbCode,
    courierName,
    trackingUrl,
  };
}

// ── Tracking ──────────────────────────────────────────────────────────────────

/**
 * Get tracking details for a shipment via AWB number.
 */
export async function trackShipment(awbCode: string): Promise<ShiprocketTrackingPayload | null> {
  try {
    const data = await shiprocketFetch<ShiprocketTrackingPayload>(
      `/courier/track/awb/${awbCode}`
    );
    return data;
  } catch (err) {
    console.error(`[Shiprocket] Track shipment error for AWB ${awbCode}:`, err);
    return null;
  }
}

// ── Cancellation ──────────────────────────────────────────────────────────────

/**
 * Cancel Shiprocket orders by their Shiprocket order IDs.
 */
export async function cancelShiprocketOrders(
  shiprocketOrderIds: number[]
): Promise<boolean> {
  try {
    await shiprocketFetch<unknown>("/orders/cancel", {
      method: "POST",
      body: JSON.stringify({ ids: shiprocketOrderIds }),
    });
    console.log(`[Shiprocket] Orders cancelled: ${shiprocketOrderIds.join(", ")}`);
    return true;
  } catch (err) {
    console.error("[Shiprocket] Cancel order error:", err);
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a ShiprocketOrderPayload from a Supabase order row.
 * Call this before invoking fulfillOrder().
 */
export function buildShiprocketPayload(order: {
  id: string;
  created_at: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  shipping_address: Record<string, unknown> | null;
  order_items: Array<{
    product_name: string;
    size?: string | null;
    color?: string | null;
    quantity: number;
    unit_price: number;
  }>;
}): ShiprocketOrderPayload {
  const addr = (order.shipping_address || {}) as Record<string, string>;
  const channelId = process.env.SHIPROCKET_CHANNEL_ID
    ? Number(process.env.SHIPROCKET_CHANNEL_ID)
    : undefined;
  const pickupLocation =
    process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";

  // Format date for Shiprocket: "YYYY-MM-DD HH:MM"
  const orderDate = new Date(order.created_at)
    .toISOString()
    .replace("T", " ")
    .slice(0, 16);

  return {
    order_id: order.id,
    order_date: orderDate,
    channel_id: channelId,
    pickup_location: pickupLocation,
    billing_customer_name: addr.full_name || addr.fullName || "Customer",
    billing_address: addr.line1 || addr.address || "",
    billing_address_2: addr.line2 || "",
    billing_city: addr.city || "",
    billing_pincode: addr.pincode || addr.zip || "",
    billing_state: addr.state || "",
    billing_country: addr.country || "India",
    billing_email: addr.email || "",
    billing_phone: addr.phone || "",
    shipping_is_billing: true,
    payment_method: "Prepaid",
    sub_total: order.subtotal,
    shipping_charges: order.shipping_fee,
    order_items: order.order_items.map((item) => ({
      name: [item.product_name, item.size, item.color]
        .filter(Boolean)
        .join(" – "),
      sku: `SXTN-${item.product_name.slice(0, 8).toUpperCase().replace(/\s+/g, "-")}`,
      units: item.quantity,
      selling_price: item.unit_price,
    })),
    // Default package dimensions for clothing (in cm/kg)
    length: 30,
    breadth: 25,
    height: 5,
    weight: 0.5 * (order.order_items.reduce((s, i) => s + i.quantity, 0)),
  };
}
