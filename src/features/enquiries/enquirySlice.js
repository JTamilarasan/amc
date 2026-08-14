import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { enquiryService } from '../../services/enquiryService'

const initialState = { items: [], loading: false, error: null, successMessage: null }
export const fetchEnquiries = createAsyncThunk('enquiries/fetch', () => enquiryService.getEnquiries())
export const addEnquiry = createAsyncThunk('enquiries/add', async (data, { rejectWithValue }) => { try { return await enquiryService.createEnquiry(data) } catch (error) { return rejectWithValue(error.message) } })
export const editEnquiry = createAsyncThunk('enquiries/edit', async ({ id, data }, { rejectWithValue }) => { try { return await enquiryService.updateEnquiry(id, data) } catch (error) { return rejectWithValue(error.message) } })
const slice = createSlice({ name: 'enquiries', initialState, reducers: { clearEnquiryMessage: (state) => { state.error = null; state.successMessage = null } }, extraReducers: (builder) => builder
  .addCase(fetchEnquiries.pending, (state) => { state.loading = true; state.error = null })
  .addCase(fetchEnquiries.fulfilled, (state, action) => { state.loading = false; state.items = action.payload })
  .addCase(fetchEnquiries.rejected, (state, action) => { state.loading = false; state.error = action.error?.message || 'Failed to load enquiries.' })
  .addCase(addEnquiry.pending, (state) => { state.loading = true; state.error = null; state.successMessage = null })
  .addCase(addEnquiry.fulfilled, (state, action) => { state.loading = false; state.items = [action.payload, ...state.items]; state.successMessage = 'Enquiry saved successfully.' })
  .addCase(addEnquiry.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to save enquiry.' })
  .addCase(editEnquiry.pending, (state) => { state.loading = true; state.error = null; state.successMessage = null })
  .addCase(editEnquiry.fulfilled, (state, action) => { state.loading = false; state.items = state.items.map((item) => item.id === action.payload.id ? action.payload : item); state.successMessage = 'Enquiry updated successfully.' })
  .addCase(editEnquiry.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to update enquiry.' }) })
export const { clearEnquiryMessage } = slice.actions
export const selectEnquiryState = (state) => state.enquiries
export default slice.reducer
