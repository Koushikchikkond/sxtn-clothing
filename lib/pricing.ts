/**
 * Authoritative pricing configuration and calculation logic for SXTN.
 *
 * Rules:
 * - Packaging charge: ₹9 (applied per checkout order).
 * - Free delivery: Applied when items cart value (subtotal without shipping/packaging) >= ₹2,000.
 * - Standard delivery: ₹99 when subtotal < ₹2,000.
 */

export const DEFAULT_SHIPPING_FEE = 99;
export const FREE_SHIPPING_THRESHOLD = 2000;
export const PACKAGING_FEE = 9;

export interface OrderPricingSummary {
  subtotal: number;
  shippingFee: number;
  packagingFee: number;
  total: number;
  isFreeShipping: boolean;
  amountNeededForFreeShipping: number;
}

export function calculateOrderPricing(subtotal: number): OrderPricingSummary {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const isFreeShipping = safeSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = safeSubtotal > 0 && !isFreeShipping ? DEFAULT_SHIPPING_FEE : 0;
  const packagingFee = safeSubtotal > 0 ? PACKAGING_FEE : 0;
  const total = safeSubtotal + shippingFee + packagingFee;
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - safeSubtotal);

  return {
    subtotal: safeSubtotal,
    shippingFee,
    packagingFee,
    total,
    isFreeShipping,
    amountNeededForFreeShipping,
  };
}
