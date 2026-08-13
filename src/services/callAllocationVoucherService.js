import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/firebase'

const collectionName = 'callAllocationVouchers'
const counterRef = () => doc(db, 'voucherSettings', 'callAllocationVoucher')
const claimRef = (number) => doc(db, 'callAllocationVoucherNumberClaims', String(number))
const mapDocument = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })

export const getNextCallAllocationVoucherNumber = async () => {
  const snapshot = await getDoc(counterRef())
  return Number(snapshot.exists() ? snapshot.data().lastVoucherNumber || 0 : 0) + 1
}

export const createCallAllocationVoucher = async (data) => {
  const createdRef = await runTransaction(db, async (transaction) => {
    const receiptRef = doc(db, 'callReceiptVouchers', data.callReceiptVoucherId)
    const receiptSnapshot = await transaction.get(receiptRef)
    if (!receiptSnapshot.exists()) throw new Error('The selected call no longer exists.')
    if (receiptSnapshot.data().allocationStatus === 'Allocated') throw new Error('The selected call is already allocated.')
    const sequenceRef = counterRef()
    const sequenceSnapshot = await transaction.get(sequenceRef)
    const allocationVoucherNumber = Number(sequenceSnapshot.exists() ? sequenceSnapshot.data().lastVoucherNumber || 0 : 0) + 1
    const uniqueRef = claimRef(allocationVoucherNumber)
    const uniqueSnapshot = await transaction.get(uniqueRef)
    if (uniqueSnapshot.exists()) throw new Error('Allocation voucher number already exists. Please try again.')
    const allocationRef = doc(collection(db, collectionName))
    const payload = {
      allocationVoucherNumber, date: data.date, executiveId: data.executiveId, executiveName: data.executiveName,
      narration: (data.narration || '').trim(), callReceiptVoucherId: data.callReceiptVoucherId,
      callNumber: data.callNumber, partyId: data.partyId, partyName: data.partyName, receiptDate: data.receiptDate,
      callSubStatus: data.callSubStatus, nextAction: data.nextAction, actionDate: data.actionDate,
      actionTime: data.actionTime || '', allocationStatus: 'Allocated', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }
    transaction.set(allocationRef, payload)
    transaction.update(receiptRef, { allocationStatus: 'Allocated', allocationVoucherId: allocationRef.id, updatedAt: serverTimestamp() })
    transaction.set(uniqueRef, { allocationVoucherNumber, allocationVoucherId: allocationRef.id, createdAt: serverTimestamp() })
    transaction.set(sequenceRef, { lastVoucherNumber: allocationVoucherNumber, updatedAt: serverTimestamp() }, { merge: true })
    return allocationRef
  })
  return mapDocument(await getDoc(createdRef))
}

export const callAllocationVoucherService = { createCallAllocationVoucher, getNextCallAllocationVoucherNumber }
