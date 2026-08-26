export const USER_ROLES = ['admin', 'manager', 'user']
export const USER_STATUSES = ['active', 'inactive']

export const PERMISSION_LABELS = {
  dashboard: 'Dashboard', customers: 'Customers', enquiries: 'Enquiries', executives: 'Executives', products: 'Products', salesVouchers: 'Sales Vouchers', voucherSettings: 'Voucher Settings', areas: 'Areas',
}

export const DEFAULT_USER_PERMISSIONS = {
  dashboard: true, customers: false, enquiries: false, executives: false, products: false, salesVouchers: false, voucherSettings: false, areas: false,
}

export const normalizeUserRole = (role) => USER_ROLES.includes(role) ? role : 'user'
export const normalizePermissions = (permissions = {}) => Object.fromEntries(Object.keys(PERMISSION_LABELS).map((key) => [key, permissions[key] === true]))
