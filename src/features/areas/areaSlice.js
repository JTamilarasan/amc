import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { areaService } from '../../services/areaService'

const initialState = { items: [], loading: false, error: null, successMessage: null }

export const fetchAreas = createAsyncThunk('areas/fetchAreas', () => areaService.getAreas())
export const createArea = createAsyncThunk('areas/createArea', async (areaName, { rejectWithValue }) => {
  try { return await areaService.createArea(areaName) } catch (error) { return rejectWithValue(error.message || 'Failed to add area.') }
})
export const editArea = createAsyncThunk('areas/editArea', async ({ id, areaName }, { rejectWithValue }) => {
  try { return await areaService.updateArea(id, areaName) } catch (error) { return rejectWithValue(error.message || 'Failed to update area.') }
})
export const removeArea = createAsyncThunk('areas/removeArea', async (id, { rejectWithValue }) => {
  try { await areaService.deleteArea(id); return id } catch (error) { return rejectWithValue(error.message || 'Failed to delete area.') }
})

const areaSlice = createSlice({
  name: 'areas', initialState,
  reducers: { clearAreaMessage: (state) => { state.error = null; state.successMessage = null } },
  extraReducers: (builder) => builder
    .addCase(fetchAreas.pending, (state) => { state.loading = true; state.error = null })
    .addCase(fetchAreas.fulfilled, (state, action) => { state.loading = false; state.items = action.payload })
    .addCase(fetchAreas.rejected, (state, action) => { state.loading = false; state.error = action.error?.message || 'Failed to load areas.' })
    .addCase(createArea.pending, (state) => { state.loading = true; state.error = null; state.successMessage = null })
    .addCase(createArea.fulfilled, (state, action) => { state.loading = false; state.items.unshift(action.payload); state.successMessage = 'Area added successfully.' })
    .addCase(createArea.rejected, (state, action) => { state.loading = false; state.error = action.payload })
    .addCase(editArea.pending, (state) => { state.loading = true; state.error = null; state.successMessage = null })
    .addCase(editArea.fulfilled, (state, action) => { state.loading = false; state.items = state.items.map((item) => item.id === action.payload.id ? action.payload : item); state.successMessage = 'Area updated successfully.' })
    .addCase(editArea.rejected, (state, action) => { state.loading = false; state.error = action.payload })
    .addCase(removeArea.pending, (state) => { state.loading = true; state.error = null; state.successMessage = null })
    .addCase(removeArea.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((item) => item.id !== action.payload); state.successMessage = 'Area deleted successfully.' })
    .addCase(removeArea.rejected, (state, action) => { state.loading = false; state.error = action.payload }),
})

export const { clearAreaMessage } = areaSlice.actions
export const selectAreas = (state) => state.areas.items
export const selectAreaState = (state) => state.areas
export default areaSlice.reducer
