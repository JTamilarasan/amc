import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { productService } from '../../services/productService'

const initialState = {
  items: [],
  loading: false,
  error: null,
  successMessage: null,
}

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  return productService.getProducts()
})

export const addProduct = createAsyncThunk('products/addProduct', async (productData, { rejectWithValue }) => {
  try {
    return await productService.createProduct(productData)
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to add product.')
  }
})

export const editProduct = createAsyncThunk('products/editProduct', async ({ id, productData }, { rejectWithValue }) => {
  try {
    return await productService.updateProduct(id, productData)
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to update product.')
  }
})

export const removeProduct = createAsyncThunk('products/removeProduct', async (id, { rejectWithValue }) => {
  try {
    await productService.deleteProduct(id)
    return id
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to delete product.')
  }
})

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProductMessage: (state) => {
      state.successMessage = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load products.'
      })
      .addCase(addProduct.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false
        state.items = [action.payload, ...state.items]
        state.successMessage = 'Product added successfully.'
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to add product.'
      })
      .addCase(editProduct.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(editProduct.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item))
        state.successMessage = 'Product updated successfully.'
      })
      .addCase(editProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to update product.'
      })
      .addCase(removeProduct.pending, (state) => {
        state.loading = true
        state.error = null
        state.successMessage = null
      })
      .addCase(removeProduct.fulfilled, (state, action) => {
        state.loading = false
        state.items = state.items.filter((item) => item.id !== action.payload)
        state.successMessage = 'Product deleted successfully.'
      })
      .addCase(removeProduct.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to delete product.'
      })
  },
})

export const { clearProductMessage } = productSlice.actions
export const selectProducts = (state) => state.products.items
export const selectActiveProducts = createSelector([selectProducts], (items) => items.filter((item) => item.status === 'Active'))
export const selectProductById = (state, id) => state.products.items.find((item) => item.id === id)
export const selectProductState = (state) => state.products
export default productSlice.reducer
