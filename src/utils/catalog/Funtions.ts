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

