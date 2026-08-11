import { formatDate, toDisplayDate } from './dateUtils'

export const getVoucherItem = (voucher) => voucher?.items?.[0] || voucher?.item || null
export const emptyReportValue = (value) => value === undefined || value === null || value === '' ? '—' : value

export const toReportDate = toDisplayDate
export const formatReportDate = formatDate

export const formatReportCurrency = (value) => {
  if (value === undefined || value === null || value === '') return '—'
  const number = Number(value)
  return Number.isFinite(number) ? `₹${number.toLocaleString('en-IN')}` : '—'
}

export const voucherMatchesReportSearch = (voucher, search) => {
  if (!search) return true
  const item = getVoucherItem(voucher)
  return [voucher.voucherNumber, voucher.customerName, voucher.executiveName, voucher.category, item?.itemName, item?.serialNo]
    .some((value) => String(value || '').toLowerCase().includes(search))
}

export const getCurrentMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const startValue = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`
  const endValue = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
  return { start, end, startValue, endValue }
}
