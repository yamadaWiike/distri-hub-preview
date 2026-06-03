import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate a URL-safe slug from product details
 * Format: category-slug/product-name-size-slug
 */
export function generateProductSlug(product: { category: string; name: string; size?: string; id: string }): string {
  const categorySlug = product.category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const nameSlug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const sizeSlug = product.size
    ? product.size.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : '';
  
  const fullSlug = sizeSlug 
    ? `${categorySlug}/${nameSlug}-${sizeSlug}`
    : `${categorySlug}/${nameSlug}`;
  
  // Append first 8 chars of ID to ensure uniqueness
  return `${fullSlug}-${product.id.slice(0, 8)}`;
}

/**
 * Extract product ID from slug
 * The ID is appended at the end after the last hyphen (8 characters)
 */
export function getProductIdFromSlug(slug: string): string {
  // Slug format: category/name-size-[first-8-of-id]
  const parts = slug.split('/');
  if (parts.length < 2) return slug; // Fallback to original if format unexpected
  
  const lastPart = parts[parts.length - 1];
  // The ID prefix is appended as the final 8 characters. It may contain
  // hyphens itself, e.g. DUMMY-NO, so splitting by "-" loses information.
  const idPrefix = lastPart.slice(-8);
  
  // Return the ID prefix - we'll use it to find the product
  return idPrefix;
}
