import { configureStore } from '@reduxjs/toolkit'
import executiveReducer from '../features/executives/executiveSlice'

export const store = configureStore({
  reducer: {
    executives: executiveReducer,
  },
})
