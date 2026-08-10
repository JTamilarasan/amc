import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { executiveService } from '../../services/executiveService'

const initialState = {
  items: [],
  loading: false,
  error: null,
  successMessage: null,
}

export const fetchExecutives = createAsyncThunk('executives/fetchExecutives', async () => {
  return executiveService.getExecutives()
})

export const addExecutive = createAsyncThunk('executives/addExecutive', async (name, { rejectWithValue }) => {
  try {
    const executive = await executiveService.createExecutive(name)
    return executive
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to add executive.')
  }
})

export const editExecutive = createAsyncThunk('executives/editExecutive', async ({ id, name }, { rejectWithValue }) => {
  try {
    const executive = await executiveService.updateExecutive(id, name)
    return executive
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to update executive.')
  }
})

export const removeExecutive = createAsyncThunk('executives/removeExecutive', async (id, { rejectWithValue }) => {
  try {
    await executiveService.deleteExecutive(id)
    return id
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to delete executive.')
  }
})

const executiveSlice = createSlice({
  name: 'executives',
  initialState,
  reducers: {
    clearExecutiveMessage: (state) => {
      state.successMessage = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExecutives.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(fetchExecutives.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchExecutives.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load executives.'
      })
      .addCase(addExecutive.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(addExecutive.fulfilled, (state, action) => {
        state.loading = false
        state.items = [action.payload, ...state.items]
        state.successMessage = 'Executive added successfully.'
      })
      .addCase(addExecutive.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to add executive.'
      })
      .addCase(editExecutive.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(editExecutive.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item))
        state.successMessage = 'Executive updated successfully.'
      })
      .addCase(editExecutive.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to update executive.'
      })
      .addCase(removeExecutive.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(removeExecutive.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter((item) => item.id !== action.payload)
        state.successMessage = 'Executive deleted successfully.'
      })
      .addCase(removeExecutive.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to delete executive.'
      })
  },
})

export const { clearExecutiveMessage } = executiveSlice.actions
export const selectExecutives = (state) => state.executives.items
export const selectActiveExecutives = createSelector([selectExecutives], (items) => items.filter((item) => item.status === 'Active'))
export const selectExecutiveState = (state) => state.executives
export default executiveSlice.reducer
