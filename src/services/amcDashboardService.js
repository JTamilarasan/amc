import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { toDisplayDate } from '../utils/dateUtils'

export const EXPIRY_WARNING_DAYS = 30

const normalizeName = (value) => String(value || '').trim().toLowerCase()
const isAmcApplicable = (value) => value === true || String(value || '').trim().toLowerCase() === 'yes'
const startOfDay = (value = new Date()) => {
  const date = toDisplayDate(value)
  return date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null
}
const customerKey = (voucher) => voucher.customerId || `name:${normalizeName(voucher.customerName)}`

const getCurrentCustomerAmcRecords = (vouchers, today) => {
  const latest = new Map()
  vouchers.forEach((voucher) => {
    ;(voucher.items || []).forEach((item) => {
      if (!isAmcApplicable(item.amcApplicable) || !item.amcToDate) return
      const amcTo = startOfDay(item.amcToDate)
      const key = customerKey(voucher)
      if (!key || key === 'name:' || !amcTo) return
      const existing = latest.get(key)
      if (!existing || amcTo > existing.amcTo) latest.set(key, { ...voucher, item, amcTo, today })
    })
  })
  return [...latest.values()]
}

export const classifyAmcDashboardRecords = (vouchers, now = new Date()) => {
  const today = startOfDay(now)
  const warningEnd = new Date(today)
  warningEnd.setDate(warningEnd.getDate() + EXPIRY_WARNING_DAYS)
  const currentCustomerRecords = getCurrentCustomerAmcRecords(vouchers, today)
  const active = currentCustomerRecords.filter((record) => record.amcTo >= today)
  const expired = currentCustomerRecords.filter((record) => record.amcTo < today)
  const goingToExpire = active.filter((record) => record.amcTo <= warningEnd).sort((a, b) => a.amcTo - b.amcTo)
  const newAmc = vouchers.filter((voucher) => voucher.category === 'New')
  const renewed = vouchers.filter((voucher) => voucher.category === 'Renewal')
  return { active, expired, newAmc, goingToExpire, renewed }
}

export const getAmcDashboardData = async () => {
  const snapshot = await getDocs(collection(db, 'salesVouchers'))
  const vouchers = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))
  return classifyAmcDashboardRecords(vouchers)
}

export const getActiveAMCRecords = async () => (await getAmcDashboardData()).active
export const getExpiredAMCRecords = async () => (await getAmcDashboardData()).expired
export const getNewAMCRecords = async () => (await getAmcDashboardData()).newAmc
export const getGoingToExpireAMCRecords = async () => (await getAmcDashboardData()).goingToExpire
export const getRenewedAMCRecords = async () => (await getAmcDashboardData()).renewed

export const amcDashboardService = { getAmcDashboardData, getActiveAMCRecords, getExpiredAMCRecords, getNewAMCRecords, getGoingToExpireAMCRecords, getRenewedAMCRecords }
