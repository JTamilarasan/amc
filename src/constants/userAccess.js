export const USER_ROLES = ['admin', 'manager', 'user']
export const USER_STATUSES = ['active', 'inactive']
export const CRUD_ACTIONS = ['view', 'add', 'edit', 'delete']

export const PERMISSION_LABELS = {
  dashboard: 'Dashboard', customers: 'Customers', enquiries: 'Enquiries', executives: 'Executives', products: 'Products', salesVouchers: 'Sales Vouchers', voucherSettings: 'Voucher Settings', areas: 'Areas',
}

export const DEFAULT_USER_PERMISSIONS = {
  dashboard: { view: true, add: false, edit: false, delete: false },
  customers: { view: false, add: false, edit: false, delete: false },
  enquiries: { view: false, add: false, edit: false, delete: false },
  executives: { view: false, add: false, edit: false, delete: false },
  products: { view: false, add: false, edit: false, delete: false },
  salesVouchers: { view: false, add: false, edit: false, delete: false },
  voucherSettings: { view: false, add: false, edit: false, delete: false },
  areas: { view: false, add: false, edit: false, delete: false },
}

export const normalizeUserRole = (role) => USER_ROLES.includes(role) ? role : 'user'
export const fullCrudPermission = () => ({ view: true, add: true, edit: true, delete: true })
export const normalizePermissions = (permissions = {}) => Object.fromEntries(Object.keys(PERMISSION_LABELS).map((key) => {
  const saved = permissions[key]
  if (saved === true) return [key, { view: true, add: false, edit: false, delete: false }]
  const view = saved?.view === true
  return [key, { view, add: view && saved?.add === true, edit: view && saved?.edit === true, delete: view && saved?.delete === true }]
}))
