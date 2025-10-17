// Application routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CART: '/cart',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_DISTRIBUTORS: '/admin/distributors',
  ADMIN_APPROVALS: '/admin/approvals'
} as const;

// Route generators
export const generateRoute = {
  productDetail: (id: string) => `/products/${id}`,
  orderDetail: (id: string) => `/orders/${id}`,
  adminUserDetail: (id: string) => `/admin/users/${id}`
} as const;

// Route groups for navigation
export const ROUTE_GROUPS = {
  PUBLIC: [ROUTES.HOME, ROUTES.LOGIN, ROUTES.REGISTER],
  AUTHENTICATED: [ROUTES.DASHBOARD, ROUTES.PRODUCTS, ROUTES.CART, ROUTES.ORDERS, ROUTES.PROFILE],
  ADMIN: [ROUTES.ADMIN, ROUTES.ADMIN_USERS, ROUTES.ADMIN_PRODUCTS, ROUTES.ADMIN_ORDERS, ROUTES.ADMIN_DISTRIBUTORS, ROUTES.ADMIN_APPROVALS]
} as const;