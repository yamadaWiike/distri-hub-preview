// API-related constants
export const API_ENDPOINTS = {
  AUTH: '/auth',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  DISTRIBUTORS: '/distributors',
  UOM: '/uom',
  CART: '/cart'
} as const;

export const API_METHODS = {
  GET: 'GET',
  POST: 'POST', 
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
} as const;

export const API_STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle'
} as const;

export type ApiStatus = typeof API_STATUS[keyof typeof API_STATUS];