export const isEnquiryPending = (item) => item.callDisposition === 'FOLLOWUP'

export const matchesEnquiryExecutive = (item, executiveId) => !executiveId
  || item.followUpLeadId === executiveId
  || item.assignedExecutiveId === executiveId

export const isUpcomingEnquiry = (item, today) => isEnquiryPending(item)
  && Boolean(item.nextFollowUp)
  && item.nextFollowUp > today
