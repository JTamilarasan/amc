import { configureStore } from '@reduxjs/toolkit'
import executiveReducer from '../features/executives/executiveSlice'
import customerReducer from '../features/customers/customerSlice'
import productReducer from '../features/products/productSlice'

export const store = configureStore({
  reducer: {
    executives: executiveReducer,
    customers: customerReducer,
    products: productReducer,
  },
})
