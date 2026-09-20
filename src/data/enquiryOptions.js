export const ENQUIRY_LEAD_SOURCES = ['IndiaMART', 'Google', 'Customer Reference', 'CA/STP Reference', 'Instagram', 'YouTube', 'Busy Leads', 'Live Keeping', 'Existing', 'Others']
export const ENQUIRY_REPORT_LEAD_SOURCES = [...ENQUIRY_LEAD_SOURCES]
export const CUSTOMER_CATEGORY_2_OPTIONS = ['Direct', 'Reference', ...ENQUIRY_LEAD_SOURCES].filter((value, index, options) => options.indexOf(value) === index)
export const ENQUIRY_PRIORITIES = ['HOT', 'WARM', 'COLD']
export const ENQUIRY_DISPOSITIONS = ['FOLLOWUP', 'NOT INTERESTED', 'DROPPED', 'COMPLETED']
export const ENQUIRY_DISPOSITIONS_BY_PRIORITY = {
  HOT: ['FOLLOWUP', 'COMPLETED'],
  WARM: ['FOLLOWUP', 'COMPLETED'],
  COLD: ['NOT INTERESTED', 'DROPPED'],
}
export const ENQUIRY_DROPPED_REASONS = ['Expect low price', 'Not responded quickly', 'Another software taken', 'Another Partner taken the order', 'Distance with direct visit', 'Others']
export const DEFAULT_ENQUIRY_PRODUCTS = ['Busy21', 'Busy Magic', 'Busy Renewal', 'TallyPrime', 'Tally Renewal', 'Cloud', 'TDL']
