import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { toDisplayDate } from '../utils/dateUtils'

const COLLECTION = 'callReceiptVouchers'
const currentYear = () => new Date().getFullYear()
const counterRef = (year) => doc(db, 'voucherSettings', `callReceiptVoucher_${year}`)
const claimRef = (year, number) => doc(db, 'callReceiptVoucherNumberClaims', `${year}_${number}`)
const customerRef = (id) => doc(db, 'customers', id)
const executiveRef = (id) => doc(db, 'executives', id)
const mapDocument = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })
const numberValue = (value) => Math.max(0, Number(value) || 0)
const zeroDelta = () => ({ total: 0, open: 0, closed: 0, monthlyBackup: 0, visits: 0 })
const counterDelta = (voucher, direction = 1) => ({ total: direction, open: voucher.callStatus === 'Open' ? direction : 0, closed: voucher.callStatus === 'Closed' ? direction : 0, monthlyBackup: voucher.category === 'Monthly Backup' ? direction : 0, visits: voucher.category2 === 'Visit' ? direction : 0 })
const combineDelta = (left, right) => ({ total: left.total + right.total, open: left.open + right.open, closed: left.closed + right.closed, monthlyBackup: left.monthlyBackup + right.monthlyBackup, visits: (left.visits || 0) + (right.visits || 0) })
const normalizeName = (value) => String(value || '').trim().toLowerCase()
const isAmcApplicable = (value) => value === true || String(value || '').trim().toLowerCase() === 'yes'
const startOfDay = (value = new Date()) => {
  const date = toDisplayDate(value)
  return date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null
}

const latestValidAmcToDate = (salesVouchers, today = new Date()) => {
  const todayDate = startOfDay(today)
  if (!todayDate) return null

  return salesVouchers
    .flatMap((voucher) => voucher.items || [])
    .filter((item) => isAmcApplicable(item.amcApplicable))
    .map((item) => ({ value: item.amcToDate, date: startOfDay(item.amcToDate) }))
    .filter((item) => item.date && item.date >= todayDate)
    .sort((left, right) => right.date.getTime() - left.date.getTime())[0]?.value || null
}

const getMatchingSalesVouchers = (voucher, salesVouchers) => {
  const partyName = normalizeName(voucher.partyName)
  if (voucher.partyId) {
    const idMatches = salesVouchers.filter((salesVoucher) => salesVoucher.customerId === voucher.partyId)
    const legacyNameMatches = partyName
      ? salesVouchers.filter((salesVoucher) => !salesVoucher.customerId && normalizeName(salesVoucher.customerName) === partyName)
      : []
    return [...idMatches, ...legacyNameMatches]
  }
  return partyName ? salesVouchers.filter((salesVoucher) => normalizeName(salesVoucher.customerName) === partyName) : []
}

const updateCustomerCounters = (transaction, ref, snapshot, delta) => {
  const current = snapshot.data() || {}
  transaction.set(ref, {
    customerTotalCalls: Math.max(0, numberValue(current.customerTotalCalls) + delta.total),
    customerCallOpen: Math.max(0, numberValue(current.customerCallOpen) + delta.open),
    customerCallClosed: Math.max(0, numberValue(current.customerCallClosed) + delta.closed),
    customerMonthlyBackupCount: Math.max(0, numberValue(current.customerMonthlyBackupCount) + delta.monthlyBackup),
    customerTotalVisits: Math.max(0, numberValue(current.customerTotalVisits) + (delta.visits || 0)),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

const updateExecutiveCounters = (transaction, ref, snapshot, delta) => {
  const current = snapshot.data() || {}
  transaction.set(ref, {
    executiveTotalCalls: Math.max(0, numberValue(current.executiveTotalCalls) + delta.total),
    executiveCallOpen: Math.max(0, numberValue(current.executiveCallOpen) + delta.open),
    executiveCallClosed: Math.max(0, numberValue(current.executiveCallClosed) + delta.closed),
    executiveTotalVisits: Math.max(0, numberValue(current.executiveTotalVisits) + (delta.visits || 0)),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

const cleanVoucher = (data) => ({
  date: data.date, partyId: data.partyId, partyName: data.partyName, customerExpiryDate: data.customerExpiryDate || null,
  executiveId: data.executiveId, executiveName: data.executiveName, category: data.category, category2: data.category2 || null,
  callReceiptRemarks: (data.callReceiptRemarks || '').trim(), callStatus: data.callStatus, callSubStatus: data.callSubStatus,
  nextAction: data.callStatus === 'Open' ? data.nextAction || null : null,
  when: data.callStatus === 'Open' ? data.when || null : null,
})

export const getNextCallReceiptVoucherNumber = async () => {
  const snapshot = await getDoc(counterRef(currentYear()))
  return numberValue(snapshot.exists() ? snapshot.data().lastVoucherNumber : 0) + 1
}

export const getCustomerExpiryDate = async (customerId) => {
  if (!customerId) return null
  const snapshot = await getDocs(query(collection(db, 'salesVouchers'), where('customerId', '==', customerId)))
  const dates = snapshot.docs.flatMap((item) => (item.data().items || []).map((entry) => entry.amcToDate).filter(Boolean))
  return dates.sort().at(-1) || null
}

export const createCallReceiptVoucher = async (data) => {
  const cleaned = cleanVoucher({ ...data, customerExpiryDate: data.customerExpiryDate || await getCustomerExpiryDate(data.partyId) })
  const createdRef = await runTransaction(db, async (transaction) => {
    const voucherYear = currentYear()
    const sequenceRef = counterRef(voucherYear)
    const sequenceSnapshot = await transaction.get(sequenceRef)
    const voucherSequence = numberValue(sequenceSnapshot.exists() ? sequenceSnapshot.data().lastVoucherNumber : 0) + 1
    const uniqueRef = claimRef(voucherYear, voucherSequence)
    const partyRef = customerRef(cleaned.partyId)
    const execRef = executiveRef(cleaned.executiveId)
    const uniqueSnapshot = await transaction.get(uniqueRef)
    const partySnapshot = await transaction.get(partyRef)
    const execSnapshot = await transaction.get(execRef)
    if (uniqueSnapshot.exists()) throw new Error('Voucher number already exists. Please try again.')
    if (!partySnapshot.exists()) throw new Error('Selected customer no longer exists.')
    if (!execSnapshot.exists()) throw new Error('Selected executive no longer exists.')
    const voucherRef = doc(collection(db, COLLECTION))
    const voucherNumber = `${voucherSequence}/${voucherYear}`
    transaction.set(voucherRef, { ...cleaned, voucherSequence, voucherYear, voucherNumber, voucherDate: cleaned.date, status: 'Active', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    transaction.set(uniqueRef, { voucherSequence, voucherYear, voucherNumber, voucherId: voucherRef.id, createdAt: serverTimestamp() })
    transaction.set(sequenceRef, { lastVoucherNumber: voucherSequence, voucherYear, updatedAt: serverTimestamp() }, { merge: true })
    const delta = counterDelta(cleaned)
    updateCustomerCounters(transaction, partyRef, partySnapshot, delta)
    updateExecutiveCounters(transaction, execRef, execSnapshot, delta)
    return voucherRef
  })
  return mapDocument(await getDoc(createdRef))
}

export const getCallReceiptVoucherById = async (id) => {
  const snapshot = await getDoc(doc(db, COLLECTION, id))
  return snapshot.exists() ? mapDocument(snapshot) : null
}

export const getCallReceiptVouchers = async () => {
  const snapshot = await getDocs(collection(db, COLLECTION))
  const timestampValue = (value) => {
    if (typeof value?.toMillis === 'function') return value.toMillis()
    if (typeof value?.toDate === 'function') return value.toDate().getTime()
    const parsed = value ? new Date(value).getTime() : Number.NaN
    return Number.isNaN(parsed) ? null : parsed
  }
  return snapshot.docs.map(mapDocument).filter((item) => item.status !== 'Deleted').sort((a, b) => {
    const leftCreated = timestampValue(a.createdAt)
    const rightCreated = timestampValue(b.createdAt)
    if (leftCreated !== null && rightCreated !== null && leftCreated !== rightCreated) return rightCreated - leftCreated
    return (b.date || '').localeCompare(a.date || '') || numberValue(b.voucherSequence) - numberValue(a.voucherSequence)
  })
}

export const getCallReceiptVouchersByDateRange = async (fromDate, toDate) => {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('date', '>=', fromDate), where('date', '<=', toDate)))
  return snapshot.docs.map(mapDocument).filter((item) => item.status !== 'Deleted').sort((a, b) => (a.date || '').localeCompare(b.date || '') || numberValue(a.voucherSequence) - numberValue(b.voucherSequence))
}

export const getCallRegisterReport = async (fromDate, toDate) => getCallReceiptVouchersByDateRange(fromDate, toDate)

export const getSingleCustomerCallHistory = async (customerId, customerName, fromDate, toDate) => {
  const vouchers = await getCallReceiptVouchersByDateRange(fromDate, toDate)
  const partyName = normalizeName(customerName)
  return vouchers.filter((voucher) => {
    if (voucher.partyId) return voucher.partyId === customerId
    return Boolean(partyName) && normalizeName(voucher.partyName) === partyName
  })
}

export const sortCallVouchersBySequence = (vouchers) => [...vouchers].sort((a, b) =>
  numberValue(a.voucherSequence) - numberValue(b.voucherSequence)
  || numberValue(String(a.voucherNumber || '').split('/')[0]) - numberValue(String(b.voucherNumber || '').split('/')[0])
  || (a.date || '').localeCompare(b.date || '')
)

export const groupCallVouchersByDate = (vouchers) => {
  const groups = new Map()
  vouchers.forEach((voucher) => {
    const date = voucher.date || ''
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date).push(voucher)
  })
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, entries]) => ({ date, entries: sortCallVouchersBySequence(entries) }))
}

export const getCallRegisterSummary = (vouchers) => ({
  totalEntries: vouchers.length,
  totalOpenCalls: vouchers.filter((voucher) => voucher.callStatus === 'Open').length,
  totalClosedCalls: vouchers.filter((voucher) => voucher.callStatus === 'Closed').length,
  totalCalls: vouchers.filter((voucher) => voucher.category2 === 'Call').length,
  totalVisits: vouchers.filter((voucher) => voucher.category2 === 'Visit').length,
})

export const getCustomerCallsReport = async (fromDate, toDate) => {
  const [vouchers, salesVoucherSnapshot] = await Promise.all([
    getCallReceiptVouchersByDateRange(fromDate, toDate),
    getDocs(collection(db, 'salesVouchers')),
  ])
  const salesVouchers = salesVoucherSnapshot.docs.map(mapDocument)
  const grouped = new Map()
  vouchers.forEach((voucher) => {
    const customerExpiryDate = latestValidAmcToDate(getMatchingSalesVouchers(voucher, salesVouchers))
    if (!customerExpiryDate) return
    const key = voucher.partyId || `name:${normalizeName(voucher.partyName)}`
    const current = grouped.get(key) || { partyId: key, partyName: voucher.partyName, customerExpiryDate, backupChecklist: 0, totalCalls: 0, totalVisits: 0, backupVouchers: [] }
    current.totalCalls += 1
    if (voucher.category2 === 'Visit') current.totalVisits += 1
    if (voucher.category === 'Monthly Backup') { current.backupChecklist += 1; current.backupVouchers.push(voucher) }
    grouped.set(key, current)
  })
  return [...grouped.values()].sort((a, b) => (a.partyName || '').localeCompare(b.partyName || ''))
}

export const getExecutiveCallsReport = async (fromDate, toDate) => {
  const vouchers = await getCallReceiptVouchersByDateRange(fromDate, toDate)
  const grouped = new Map()
  vouchers.forEach((voucher) => {
    const key = voucher.executiveId || voucher.executiveName
    const current = grouped.get(key) || { executiveId: voucher.executiveId, executiveName: voucher.executiveName, callsReceived: 0, callsOpen: 0, callsClosed: 0, totalVisits: 0, vouchers: [] }
    current.callsReceived += 1
    if (voucher.callStatus === 'Open') current.callsOpen += 1
    if (voucher.callStatus === 'Closed') current.callsClosed += 1
    if (voucher.category2 === 'Visit') current.totalVisits += 1
    current.vouchers.push(voucher)
    grouped.set(key, current)
  })
  return [...grouped.values()].sort((a, b) => (a.executiveName || '').localeCompare(b.executiveName || ''))
}

export const getExecutiveCallDetails = async (executiveId, fromDate, toDate, callStatus) => {
  const vouchers = await getCallReceiptVouchersByDateRange(fromDate, toDate)
  return vouchers.filter((voucher) => voucher.executiveId === executiveId && (!callStatus || (callStatus === 'Visit' ? voucher.category2 === 'Visit' : voucher.callStatus === callStatus)))
}

export const updateCallReceiptVoucher = async (id, changes) => {
  const voucherRef = doc(db, COLLECTION, id)
  await runTransaction(db, async (transaction) => {
    const oldSnapshot = await transaction.get(voucherRef)
    if (!oldSnapshot.exists()) throw new Error('Call receipt voucher not found.')
    const oldVoucher = oldSnapshot.data()
    const updated = cleanVoucher({ ...oldVoucher, ...changes })
    const customerIds = [...new Set([oldVoucher.partyId, updated.partyId])]
    const executiveIds = [...new Set([oldVoucher.executiveId, updated.executiveId])]
    const customerRefs = customerIds.map(customerRef)
    const executiveRefs = executiveIds.map(executiveRef)
    const customerSnapshots = []
    const executiveSnapshots = []
    for (const ref of customerRefs) customerSnapshots.push(await transaction.get(ref))
    for (const ref of executiveRefs) executiveSnapshots.push(await transaction.get(ref))
    const customerDeltas = new Map(customerIds.map((value) => [value, zeroDelta()]))
    const executiveDeltas = new Map(executiveIds.map((value) => [value, zeroDelta()]))
    customerDeltas.set(oldVoucher.partyId, combineDelta(customerDeltas.get(oldVoucher.partyId), counterDelta(oldVoucher, -1)))
    customerDeltas.set(updated.partyId, combineDelta(customerDeltas.get(updated.partyId), counterDelta(updated)))
    executiveDeltas.set(oldVoucher.executiveId, combineDelta(executiveDeltas.get(oldVoucher.executiveId), counterDelta(oldVoucher, -1)))
    executiveDeltas.set(updated.executiveId, combineDelta(executiveDeltas.get(updated.executiveId), counterDelta(updated)))
    customerRefs.forEach((ref, index) => updateCustomerCounters(transaction, ref, customerSnapshots[index], customerDeltas.get(customerIds[index])))
    executiveRefs.forEach((ref, index) => updateExecutiveCounters(transaction, ref, executiveSnapshots[index], executiveDeltas.get(executiveIds[index])))
    transaction.update(voucherRef, { ...updated, voucherDate: updated.date, updatedAt: serverTimestamp() })
  })
  return getCallReceiptVoucherById(id)
}

export const deleteCallReceiptVoucher = async (id) => {
  const voucherRef = doc(db, COLLECTION, id)
  await runTransaction(db, async (transaction) => {
    const voucherSnapshot = await transaction.get(voucherRef)
    if (!voucherSnapshot.exists()) return
    const voucher = voucherSnapshot.data()
    const partyRef = customerRef(voucher.partyId)
    const execRef = executiveRef(voucher.executiveId)
    const partySnapshot = await transaction.get(partyRef)
    const execSnapshot = await transaction.get(execRef)
    updateCustomerCounters(transaction, partyRef, partySnapshot, counterDelta(voucher, -1))
    updateExecutiveCounters(transaction, execRef, execSnapshot, counterDelta(voucher, -1))
    transaction.delete(voucherRef)
  })
}

export const callReceiptVoucherService = { createCallReceiptVoucher, updateCallReceiptVoucher, deleteCallReceiptVoucher, getNextCallReceiptVoucherNumber, getCallReceiptVoucherById, getCallReceiptVouchers, getCallReceiptVouchersByDateRange, getCallRegisterReport, getSingleCustomerCallHistory, getCustomerExpiryDate, getCustomerCallsReport, getExecutiveCallsReport, getExecutiveCallDetails }
