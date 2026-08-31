import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

const COLLECTION = 'freeSupportVouchers'
const counterRef = (year) => doc(db, 'voucherSettings', `freeSupportVoucher_${year}`)
const claimRef = (year, sequence) => doc(db, 'freeSupportVoucherNumberClaims', `${year}_${sequence}`)
const mapVoucher = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })
const numberValue = (value) => Math.max(0, Math.trunc(Number(value) || 0))
const voucherYear = (value) => { const year = Number(String(value || '').slice(0, 4)); if (!year) throw new Error('Voucher date is required.'); return year }
const savedSequence = (voucher, year) => Number(voucher.voucherYear) === year ? numberValue(voucher.voucherSequence) : 0
const highestSequence = async (year) => (await getDocs(collection(db, COLLECTION))).docs.reduce((highest, item) => Math.max(highest, savedSequence(item.data(), year)), 0)
const cleanItem = (item = {}) => ({ serialNo: (item.serialNo || '').trim(), productId: item.productId || '', itemName: item.itemName || '', duration: item.duration || '', unit: item.unit || '', amcApplicable: true, amcFromDate: item.amcFromDate || '', amcToDate: item.amcToDate || '', amount: Number(item.amount) })

export const getNextFreeSupportVoucherNumber = async (voucherDate) => {
  const year = voucherYear(voucherDate)
  const [counter, highest] = await Promise.all([getDoc(counterRef(year)), highestSequence(year)])
  return `${Math.max(numberValue(counter.exists() ? counter.data().lastVoucherNumber : 0), highest) + 1}/${year}`
}

export const createFreeSupportVoucher = async (data) => {
  if (!['Yes', 'No'].includes(data.freeSupport)) throw new Error('Free Support option is required.')
  const year = voucherYear(data.voucherDate); const highest = await highestSequence(year)
  const createdRef = await runTransaction(db, async (transaction) => {
    const sequenceRef = counterRef(year); const sequenceSnapshot = await transaction.get(sequenceRef)
    const sequence = Math.max(numberValue(sequenceSnapshot.exists() ? sequenceSnapshot.data().lastVoucherNumber : 0), highest) + 1
    const uniqueRef = claimRef(year, sequence); if ((await transaction.get(uniqueRef)).exists()) throw new Error('Free Support voucher number already exists.')
    const oldVoucherRef = data.renewalSourceVoucherId ? doc(db, COLLECTION, data.renewalSourceVoucherId) : null
    const oldVoucherSnapshot = oldVoucherRef ? await transaction.get(oldVoucherRef) : null
    if (oldVoucherRef && !oldVoucherSnapshot?.exists()) throw new Error('The Free Support voucher selected for renewal no longer exists.')
    if (oldVoucherSnapshot?.data()?.expiryRenewed === true) throw new Error('This Free Support voucher has already been renewed.')
    const voucherRef = doc(collection(db, COLLECTION)); const voucherNumber = `${sequence}/${year}`
    const payload = { voucherNumber, voucherSequence: sequence, voucherYear: year, voucherDate: data.voucherDate, customerId: data.customerId, customerName: data.customerName, executiveId: data.executiveId, executiveName: data.executiveName, category: data.category, narration: (data.narration || '').trim(), freeSupport: data.freeSupport, renewedFromVoucherId: data.renewalSourceVoucherId || '', renewedFromVoucherNumber: data.renewalSourceVoucherNumber || '', items: [cleanItem(data.items?.[0])], totalAmount: Number(data.totalAmount), status: 'Active', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
    transaction.set(voucherRef, payload); transaction.set(uniqueRef, { voucherId: voucherRef.id, voucherNumber, voucherSequence: sequence, voucherYear: year, createdAt: serverTimestamp() }); transaction.set(sequenceRef, { lastVoucherNumber: sequence, voucherYear: year, updatedAt: serverTimestamp() }, { merge: true }); if (oldVoucherRef) transaction.update(oldVoucherRef, { expiryRenewed: true, renewedVoucherId: voucherRef.id, renewedVoucherNumber: voucherNumber, status: 'Renewed', updatedAt: serverTimestamp() })
    return voucherRef
  })
  return mapVoucher(await getDoc(createdRef))
}

export const getFreeSupportVouchers = async () => (await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')))).docs.map(mapVoucher)
export const classifyFreeSupportRecords = (vouchers, now = new Date()) => {
  const today = dateValue(now); const warning = new Date(now); warning.setDate(warning.getDate() + 30); const warningDate = dateValue(warning)
  const latest = new Map()
  vouchers.forEach((voucher) => { if (voucher.freeSupport !== 'Yes') return; const item = voucher.items?.[0] || {}; if (!item.amcToDate) return; const key = voucher.customerId || `name:${String(voucher.customerName || '').trim().toLowerCase()}`; const existing = latest.get(key); if (!existing || item.amcToDate > existing.item.amcToDate) latest.set(key, { ...voucher, item }) })
  const current = [...latest.values()]; const dropped = current.filter((record) => record.status === 'Dropped' || record.dropped === true); const available = current.filter((record) => !dropped.includes(record) && record.status !== 'Renewed')
  const active = available.filter((record) => record.item.amcToDate >= today); const expired = available.filter((record) => record.item.amcToDate < today); const goingToExpire = active.filter((record) => record.item.amcToDate <= warningDate); const newFs = vouchers.filter((voucher) => voucher.freeSupport === 'Yes' && voucher.category === 'New')
  return { active, expired, newFs, goingToExpire, dropped }
}
export const getFreeSupportDashboardData = async () => classifyFreeSupportRecords(await getFreeSupportVouchers())
export const markFreeSupportDropped = async (id) => { const ref = doc(db, COLLECTION, id); await updateDoc(ref, { status: 'Dropped', dropped: true, updatedAt: serverTimestamp() }); return mapVoucher(await getDoc(ref)) }
export const getFreeSupportCustomerCallsReport = async (fromDate, toDate) => {
  const [freeSupportSnapshot, customerSnapshot, callsSnapshot] = await Promise.all([getDocs(collection(db, COLLECTION)), getDocs(collection(db, 'customers')), getDocs(collection(db, 'callReceiptVouchers'))])
  const today = dateValue(new Date())
  const latestByCustomer = new Map()
  freeSupportSnapshot.docs.forEach((entry) => {
    const voucher = mapVoucher(entry); const item = voucher.items?.[0] || {}; if (voucher.freeSupport !== 'Yes' || !item.amcToDate || item.amcToDate < today) return
    const key = voucher.customerId || `name:${String(voucher.customerName || '').trim().toLowerCase()}`; const existing = latestByCustomer.get(key)
    if (!existing || item.amcToDate > existing.expiryDate) latestByCustomer.set(key, { voucher, expiryDate: item.amcToDate })
  })
  const customers = new Map(customerSnapshot.docs.map((entry) => [entry.id, { id: entry.id, ...entry.data() }]))
  const calls = callsSnapshot.docs.map(mapVoucher).filter((voucher) => voucher.status !== 'Deleted' && voucher.date >= fromDate && voucher.date <= toDate)
  return [...latestByCustomer.entries()].map(([key, record]) => {
    const customer = customers.get(record.voucher.customerId) || {}; const name = customer.customerName || record.voucher.customerName
    const customerCalls = calls.filter((call) => call.partyId ? call.partyId === record.voucher.customerId : String(call.partyName || '').trim().toLowerCase() === String(name || '').trim().toLowerCase())
    return { partyId: key, customerId: record.voucher.customerId, partyName: name, contactNo: customer.mobileNo || '', areaName: customer.areaName || '', freeSupportExpiry: record.expiryDate, backupChecklist: customerCalls.filter((call) => call.category === 'Monthly Backup').length, totalCalls: customerCalls.length, totalVisits: customerCalls.filter((call) => call.category2 === 'Visit').length, callVouchers: customerCalls, backupVouchers: customerCalls.filter((call) => call.category === 'Monthly Backup'), visitVouchers: customerCalls.filter((call) => call.category2 === 'Visit') }
  }).sort((left, right) => (left.partyName || '').localeCompare(right.partyName || ''))
}
export const updateFreeSupportVoucher = async (id, data) => { const ref = doc(db, COLLECTION, id); await updateDoc(ref, { voucherDate: data.voucherDate, customerId: data.customerId, customerName: data.customerName, executiveId: data.executiveId, executiveName: data.executiveName, category: data.category, narration: (data.narration || '').trim(), freeSupport: data.freeSupport, items: [cleanItem(data.items?.[0])], totalAmount: Number(data.totalAmount), updatedAt: serverTimestamp() }); return mapVoucher(await getDoc(ref)) }
export const deleteFreeSupportVoucher = async (id) => runTransaction(db, async (transaction) => { const ref = doc(db, COLLECTION, id); if ((await transaction.get(ref)).exists()) transaction.delete(ref) })
const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const freeSupportVoucherService = { getNextFreeSupportVoucherNumber, createFreeSupportVoucher, getFreeSupportVouchers, classifyFreeSupportRecords, getFreeSupportDashboardData, markFreeSupportDropped, getFreeSupportCustomerCallsReport, updateFreeSupportVoucher, deleteFreeSupportVoucher }
