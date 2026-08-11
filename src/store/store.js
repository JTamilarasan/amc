import { configureStore } from '@reduxjs/toolkit'
import executiveReducer from '../features/executives/executiveSlice'
import customerReducer from '../features/customers/customerSlice'
import productReducer from '../features/products/productSlice'
import salesVoucherReducer from '../features/salesVouchers/salesVoucherSlice'
import areaReducer from '../features/areas/areaSlice'

export const store = configureStore({
  reducer: {
    executives: executiveReducer,
    customers: customerReducer,
    products: productReducer,
    salesVouchers: salesVoucherReducer,
    areas: areaReducer,
  },
})
