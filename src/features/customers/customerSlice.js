import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { customerService } from '../../services/customerService'

const initialState = {
  items: [],
  loading: false,
  error: null,
  successMessage: null,
}

export const fetchCustomers = createAsyncThunk('customers/fetchCustomers', async () => {
  return customerService.getCustomers()
})

export const addCustomer = createAsyncThunk('customers/addCustomer', async (customerData, { rejectWithValue }) => {
  try {
    return await customerService.createCustomer(customerData)
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to add customer.')
  }
})

export const editCustomer = createAsyncThunk('customers/editCustomer', async ({ id, customerData }, { rejectWithValue }) => {
  try {
    return await customerService.updateCustomer(id, customerData)
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to update customer.')
  }
})

export const removeCustomer = createAsyncThunk('customers/removeCustomer', async (id, { rejectWithValue }) => {
  try {
    await customerService.deleteCustomer(id)
    return id
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to delete customer.')
  }
})

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearCustomerMessage: (state) => {
      state.successMessage = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load customers.'
      })
      .addCase(addCustomer.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.items = [action.payload, ...state.items]
        state.successMessage = 'Customer added successfully.'
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to add customer.'
      })
      .addCase(editCustomer.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(editCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item))
        state.successMessage = 'Customer updated successfully.'
      })
      .addCase(editCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to update customer.'
      })
      .addCase(removeCustomer.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(removeCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter((item) => item.id !== action.payload)
        state.successMessage = 'Customer deleted successfully.'
      })
      .addCase(removeCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to delete customer.'
      })
  },
})

export const { clearCustomerMessage } = customerSlice.actions
export const selectCustomers = (state) => state.customers.items
export const selectActiveCustomers = createSelector([selectCustomers], (items) => items.filter((item) => item.status === 'Active'))
export const selectCustomerById = (state, id) => state.customers.items.find((item) => item.id === id)
export const selectCustomerState = (state) => state.customers
export default customerSlice.reducer
