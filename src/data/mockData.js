export const executives = [
  { id: 1, name: 'Aarav Mehta', createdDate: '12 Jan 2024', status: 'Active' },
  { id: 2, name: 'Nisha Rao', createdDate: '08 Feb 2024', status: 'Active' },
  { id: 3, name: 'Siddharth Jain', createdDate: '14 Mar 2024', status: 'Inactive' },
]

export const customers = [
  {
    id: 1,
    name: 'Mohan Industries',
    contact: '+91 98765 43210',
    state: 'Maharashtra',
    gstin: '27AAAPL1234C1Z5',
    category: 'AMC',
    executive: 'Aarav Mehta',
  },
  {
    id: 2,
    name: 'Suri Traders',
    contact: '+91 99887 66554',
    state: 'Karnataka',
    gstin: '29AABCS5678D1Z2',
    category: 'Remote AMC',
    executive: 'Nisha Rao',
  },
  {
    id: 3,
    name: 'Bright Solutions',
    contact: '+91 90909 78787',
    state: 'Tamil Nadu',
    gstin: '33AACCB7890E1Z3',
    category: 'Support',
    executive: 'Siddharth Jain',
  },
]

export const products = [
  {
    id: 1,
    name: 'Tally Prime Gold',
    group: 'Tally Software',
    unit: 'License',
    amcApplicable: true,
    defaultDuration: '1 Year',
    status: 'Active',
    price: 54000,
  },
  {
    id: 2,
    name: 'AMC Support',
    group: 'Support Services',
    unit: 'Year',
    amcApplicable: true,
    defaultDuration: '1 Year',
    status: 'Active',
    price: 8000,
  },
  {
    id: 3,
    name: 'Tally Implementation',
    group: 'Tally Services',
    unit: 'Service',
    amcApplicable: false,
    defaultDuration: '-',
    status: 'Active',
    price: 25000,
  },
]

export const vouchers = [
  {
    id: 'SV-000001',
    date: '08 Aug 2026',
    party: 'Mohan Industries',
    items: 'Tally Prime Gold + AMC',
    amount: '₹62,000',
    amc: 'Yes',
  },
  {
    id: 'SV-000002',
    date: '05 Aug 2026',
    party: 'Suri Traders',
    items: 'AMC Support',
    amount: '₹8,000',
    amc: 'Yes',
  },
  {
    id: 'SV-000003',
    date: '01 Aug 2026',
    party: 'Bright Solutions',
    items: 'Implementation',
    amount: '₹25,000',
    amc: 'No',
  },
]

export const amcRecords = [
  {
    id: 1,
    customer: 'Mohan Industries',
    mobile: '+91 98765 43210',
    product: 'Tally Prime Gold',
    from: '01 Apr 2026',
    to: '31 Mar 2027',
    daysRemaining: 24,
    executive: 'Aarav Mehta',
    status: 'Active',
  },
  {
    id: 2,
    customer: 'Suri Traders',
    mobile: '+91 99887 66554',
    product: 'AMC Support',
    from: '20 Aug 2026',
    to: '19 Aug 2027',
    daysRemaining: 9,
    executive: 'Nisha Rao',
    status: 'Expiring Soon',
  },
  {
    id: 3,
    customer: 'Bright Solutions',
    mobile: '+91 90909 78787',
    product: 'Tally Prime Gold',
    from: '10 Jul 2026',
    to: '09 Jul 2026',
    daysRemaining: 0,
    executive: 'Siddharth Jain',
    status: 'Expired',
  },
]

export const expiringSoon = [
  {
    customer: 'Suri Traders',
    mobile: '+91 99887 66554',
    product: 'AMC Support',
    endDate: '19 Aug 2026',
    daysLeft: 9,
    status: 'Expiring Soon',
  },
  {
    customer: 'Vikram Logistics',
    mobile: '+91 97654 12345',
    product: 'Tally Prime Gold',
    endDate: '24 Aug 2026',
    daysLeft: 14,
    status: 'Expiring Soon',
  },
  {
    customer: 'Kiran & Co.',
    mobile: '+91 98800 32105',
    product: 'Support Services',
    endDate: '28 Aug 2026',
    daysLeft: 18,
    status: 'Follow-up',
  },
]
