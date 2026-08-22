export const ENQUIRY_LEAD_SOURCES = ['IndiaMART', 'Google', 'Customer Reference', 'CA/STP Reference', 'Instagram', 'YouTube', 'Busy Leads', 'Live Keeping', 'Existing', 'Others']
export const ENQUIRY_REPORT_LEAD_SOURCES = [...ENQUIRY_LEAD_SOURCES]
export const ENQUIRY_PRIORITIES = ['HOT', 'WARM', 'COLD']
export const ENQUIRY_DISPOSITIONS = ['FOLLOWUP', 'NOT INTERESTED', 'DROPPED', 'COMPLETED']
export const ENQUIRY_DISPOSITIONS_BY_PRIORITY = {
  HOT: ['FOLLOWUP', 'COMPLETED'],
  WARM: ['FOLLOWUP', 'COMPLETED'],
  COLD: ['NOT INTERESTED', 'DROPPED'],
}
export const DEFAULT_ENQUIRY_PRODUCTS = ['Busy21', 'Busy Magic', 'Busy Renewal', 'TallyPrime', 'Tally Renewal', 'Cloud', 'TDL']
