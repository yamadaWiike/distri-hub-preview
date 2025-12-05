import { ProductWithVariant } from "@/services/product-service";

export function calculateMargin(product: ProductWithVariant, selectedArea: string): { value: number; percentage: number } {
  const regional = product.regions.find((r) => r.area === selectedArea) || product.regions[0];
  const basePrice = regional?.distributorPrice ?? product.distributorPrice;
  const qty = regional?.moq ?? product.moq;

  if (!basePrice || !qty || !product.consumerPrice) {
    return { value: 0, percentage: 0 };
  }

  const subtotalDistributor = qty * basePrice;
  const potentialRevenue = qty * product.consumerPrice;
  const value = potentialRevenue - subtotalDistributor;
  const percentage = potentialRevenue > 0 ? (value / potentialRevenue) * 100 : 0;

  return {
    value,
    percentage
  };
}

export function getRegionByArea(product: ProductWithVariant, selectedArea: string): { distributorPrice: number, uom: string } {
  if (!product.regions || product.regions.length === 0) {
    return {
      distributorPrice: 0,
      uom: '',
    };
  }

  const regional = selectedArea
    ? product.regions.find((r) => r.area === selectedArea) || product.regions[0]
    : product.regions[0];

  return {
    distributorPrice: regional.distributorPrice,
    uom: regional.moq_uom,
  }
}

export function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts pixels (px) to points (pt).
 * @param px - The value in pixels.
 * @returns The equivalent value in points.
 */
export function pxToPt(px: number): number {
  return px * 0.75;
}

/**
 * Converts pixels (px) to millimeters (mm).
 * @param px - The value in pixels.
 * @returns The equivalent value in millimeters.
 */
export function pxToMm(px: number): number {
  return px * 25.4 / 96;
}

/**
 * Safely converts a value to a string.
 * Returns a default value if the input is null, undefined, or unknown.
 * @param value - The value to convert.
 * @param defaultValue - The default string to return if value is invalid.
 * @returns The string representation of the value or the default value.
 */
export const safeString = (
  value: string | number | null | undefined | unknown,
  defaultValue = '',
): string => (value ? value.toString() : defaultValue)

/**
 * Safely converts a value to a number.
 * Handles strings, booleans, and returns a default value if conversion fails.
 * @param value - The value to convert.
 * @param defaultValue - The default number to return if value is invalid.
 * @returns The numeric representation of the value or the default value.
 */
export const safeNumber = (
  value: string | number | boolean | null | undefined | unknown,
  defaultValue = 0,
): number => {
  if (!Number.isNaN(value) && typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/,/g, '.')
    const parsed = parseFloat(trimmed)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  return defaultValue
}

/**
 * Formats a number as Indonesian Rupiah currency.
 * Returns "-" if the input is undefined.
 * @param n - The number to format.
 * @returns The formatted currency string or "-".
 */
export const formatRp = (n?: number): string =>
  n === undefined ? "-" : `Rp${n.toLocaleString("id-ID")}`;
