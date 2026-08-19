const toDateInputValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const getCurrentMonthDateRange = () => {
  const today = new Date()
  return {
    fromDate: toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)),
    toDate: toDateInputValue(today),
  }
}
