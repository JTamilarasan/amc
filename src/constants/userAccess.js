export const USER_ROLES = ['admin', 'manager', 'user']
export const USER_STATUSES = ['active', 'inactive']
export const CRUD_ACTIONS = ['view', 'add', 'edit', 'delete']

export const PERMISSION_MODULES = [
  { key: 'dashboard', label: 'Dashboard', defaultView: true },
  { key: 'customers', label: 'Customers' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'executives', label: 'Executives' },
  { key: 'products', label: 'Products' },
  { key: 'salesVouchers', label: 'Sales Vouchers' },
  { key: 'voucherSettings', label: 'Voucher Settings' },
  { key: 'areas', label: 'Areas' },
  { key: 'reports', label: 'Reports', actions: ['view'] },
]

export const PERMISSION_KEYS = Object.fromEntries(PERMISSION_MODULES.map(({ key }) => [key, key]))
export const getModuleActions = (module) => module.actions || CRUD_ACTIONS
export const DEFAULT_USER_PERMISSIONS = Object.fromEntries(PERMISSION_MODULES.map((module) => [module.key, Object.fromEntries(getModuleActions(module).map((action) => [action, action === 'view' && module.defaultView === true]))]))

export const normalizeUserRole = (role) => USER_ROLES.includes(role) ? role : 'user'
export const fullCrudPermission = () => ({ view: true, add: true, edit: true, delete: true })
export const fullModulePermission = (module) => Object.fromEntries(getModuleActions(module).map((action) => [action, true]))
export const normalizePermissions = (permissions = {}) => Object.fromEntries(PERMISSION_MODULES.map((module) => {
  const { key } = module
  const actions = getModuleActions(module)
  const saved = permissions[key]
  if (saved === true) return [key, Object.fromEntries(actions.map((action) => [action, action === 'view']))]
  const view = saved?.view === true
  return [key, Object.fromEntries(actions.map((action) => [action, action === 'view' ? view : view && saved?.[action] === true]))]
}))
