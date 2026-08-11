import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { salesVoucherService } from '../../services/salesVoucherService'

const initialState = {
  items: [],
  nextVoucherNumber: null,
  startingNumber: null,
  loading: false,
  error: null,
  successMessage: null,
}

export const fetchSalesVouchers = createAsyncThunk('salesVouchers/fetchSalesVouchers', async () => {
  return salesVoucherService.getSalesVouchers()
})

export const fetchNextVoucherNumber = createAsyncThunk('salesVouchers/fetchNextVoucherNumber', async (startingNumber) => {
  return salesVoucherService.getNextAvailableVoucherNumber(startingNumber)
})

export const fetchVoucherSequence = createAsyncThunk('salesVouchers/fetchVoucherSequence', async () => {
  return salesVoucherService.getVoucherSequence()
})

export const initializeVoucherCounter = createAsyncThunk('salesVouchers/initializeVoucherCounter', async (startingNumber, { rejectWithValue }) => {
  try {
    return await salesVoucherService.initializeVoucherCounter(startingNumber)
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to initialize voucher number.')
  }
})

export const addSalesVoucher = createAsyncThunk('salesVouchers/addSalesVoucher', async (voucherData, { rejectWithValue }) => {
  try {
    return await salesVoucherService.createSalesVoucher(voucherData)
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to save sales voucher.')
  }
})

export const editSalesVoucher = createAsyncThunk('salesVouchers/editSalesVoucher', async ({ id, voucherData }, { rejectWithValue }) => {
  try {
    return await salesVoucherService.updateSalesVoucher(id, voucherData)
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to update sales voucher.')
  }
})

export const removeSalesVoucher = createAsyncThunk('salesVouchers/removeSalesVoucher', async (id, { rejectWithValue }) => {
  try {
    await salesVoucherService.deleteSalesVoucher(id)
    return id
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to delete sales voucher.')
  }
})

const salesVoucherSlice = createSlice({
  name: 'salesVouchers',
  initialState,
  reducers: {
    clearSalesVoucherMessage: (state) => {
      state.successMessage = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesVouchers.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(fetchSalesVouchers.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchSalesVouchers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load sales vouchers.'
      })
      .addCase(fetchNextVoucherNumber.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNextVoucherNumber.fulfilled, (state, action) => {
        state.loading = false
        state.nextVoucherNumber = action.payload
      })
      .addCase(fetchNextVoucherNumber.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load next voucher number.'
      })
      .addCase(fetchVoucherSequence.fulfilled, (state, action) => {
        state.startingNumber = action.payload?.startingNumber ?? null
        state.nextVoucherNumber = action.payload?.nextVoucherNumber ?? null
      })
      .addCase(fetchVoucherSequence.rejected, (state, action) => {
        state.error = action.error?.message || 'Failed to load voucher sequence.'
      })
      .addCase(initializeVoucherCounter.fulfilled, (state, action) => {
        state.nextVoucherNumber = action.payload
        state.error = null
      })
      .addCase(initializeVoucherCounter.rejected, (state, action) => {
        state.error = action.payload || 'Failed to initialize voucher number.'
      })
      .addCase(addSalesVoucher.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(addSalesVoucher.fulfilled, (state, action) => {
        state.loading = false
        state.items = [action.payload, ...state.items]
        state.successMessage = 'Sales voucher saved successfully.'
        state.nextVoucherNumber = null
      })
      .addCase(addSalesVoucher.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to save sales voucher.'
      })
      .addCase(editSalesVoucher.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(editSalesVoucher.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item))
        state.successMessage = 'Sales voucher updated successfully.'
      })
      .addCase(editSalesVoucher.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to update sales voucher.'
      })
      .addCase(removeSalesVoucher.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(removeSalesVoucher.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter((item) => item.id !== action.payload)
        state.successMessage = 'Sales voucher deleted successfully.'
      })
      .addCase(removeSalesVoucher.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to delete sales voucher.'
      })
  },
})

export const { clearSalesVoucherMessage } = salesVoucherSlice.actions
export const selectSalesVouchers = (state) => state.salesVouchers.items
export const selectNextVoucherNumber = (state) => state.salesVouchers.nextVoucherNumber
export const selectSalesVoucherById = (state, id) => state.salesVouchers.items.find((item) => item.id === id)
export const selectSalesVoucherState = (state) => state.salesVouchers
export default salesVoucherSlice.reducer
