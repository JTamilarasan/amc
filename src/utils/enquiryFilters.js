import { toDisplayDate } from './dateUtils'

export const enquiryDateValue = (value) => {
  const date = toDisplayDate(value)
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : ''
}

export const isEnquiryPending = (item) => item.callDisposition === 'FOLLOWUP'

export const matchesEnquiryExecutive = (item, executiveId) => !executiveId
  || item.followUpLeadId === executiveId
  || item.assignedExecutiveId === executiveId

export const isUpcomingEnquiry = (item, today) => isEnquiryPending(item)
  && Boolean(enquiryDateValue(item.nextFollowUp))
  && enquiryDateValue(item.nextFollowUp) > enquiryDateValue(today)
