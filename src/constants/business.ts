// Business logic constants
export const USER_ROLES = {
  ADMIN: 'admin',
  DISTRIBUTOR: 'distributor', 
  CUSTOMER: 'customer'
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved', 
  REJECTED: 'rejected'
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock'
} as const;

export const UOM_TYPES = {
  PIECE: 'piece',
  KILOGRAM: 'kg',
  GRAM: 'g',
  LITER: 'l',
  MILLILITER: 'ml',
  PACK: 'pack',
  BOX: 'box'
} as const;

// Business rules
export const BUSINESS_RULES = {
  MIN_ORDER_AMOUNT: 100000, // IDR
  MAX_CART_ITEMS: 100,
  PASSWORD_MIN_LENGTH: 8,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS];
export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];
export type UomType = typeof UOM_TYPES[keyof typeof UOM_TYPES];