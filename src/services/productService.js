import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

const PRODUCTS_COLLECTION = 'products'

const mapProduct = (docSnapshot) => {
  const data = docSnapshot.data()
  return {
    id: docSnapshot.id,
    itemName: data.itemName || '',
    itemGroup: data.itemGroup || '',
    unit: data.unit || '',
    amcApplicable: Boolean(data.amcApplicable),
    status: data.status || 'Active',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export const createProduct = async (productData) => {
  const payload = {
    itemName: (productData.itemName || '').trim(),
    itemGroup: (productData.itemGroup || '').trim(),
    unit: (productData.unit || '').trim(),
    amcApplicable: Boolean(productData.amcApplicable),
    status: 'Active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), payload)
  const createdSnapshot = await getDoc(docRef)
  return mapProduct(createdSnapshot)
}

export const getProducts = async () => {
  const productsRef = collection(db, PRODUCTS_COLLECTION)
  const q = query(productsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(mapProduct)
}

export const getProductById = async (id) => {
  const snapshot = await getDoc(doc(db, PRODUCTS_COLLECTION, id))
  return snapshot.exists() ? mapProduct(snapshot) : null
}

export const updateProduct = async (id, productData) => {
  const payload = {
    itemName: (productData.itemName || '').trim(),
    itemGroup: (productData.itemGroup || '').trim(),
    unit: (productData.unit || '').trim(),
    amcApplicable: Boolean(productData.amcApplicable),
    updatedAt: serverTimestamp(),
  }

  const productRef = doc(db, PRODUCTS_COLLECTION, id)
  await updateDoc(productRef, payload)

  const updatedSnapshot = await getDoc(productRef)
  return mapProduct(updatedSnapshot)
}

export const getProductUsage = async () => {
  const snapshot = await getDocs(collection(db, 'salesVouchers'))
  const referencedItems = snapshot.docs.flatMap((voucher) => {
    const data = voucher.data()
    return [...(data.items || []), ...(data.item ? [data.item] : [])]
  })
  return {
    ids: [...new Set(referencedItems.map((item) => item.productId).filter(Boolean))],
    legacyNames: [...new Set(referencedItems.filter((item) => !item.productId).map((item) => (item.itemName || '').trim().toLowerCase()).filter(Boolean))],
  }
}

export const getUsedProductIds = async () => (await getProductUsage()).ids

export const isProductUsed = async (id) => {
  const usage = await getProductUsage()
  if (usage.ids.includes(id)) return true
  const snapshot = await getDoc(doc(db, PRODUCTS_COLLECTION, id))
  return snapshot.exists() && usage.legacyNames.includes((snapshot.data().itemName || '').trim().toLowerCase())
}

export const deleteProduct = async (id) => {
  if (await isProductUsed(id)) throw new Error('Product cannot be deleted because transactions already exist.')
  const productRef = doc(db, PRODUCTS_COLLECTION, id)
  await deleteDoc(productRef)
}

export const searchProducts = async (searchText) => {
  const normalizedSearch = (searchText || '').trim().toLowerCase()
  const productsRef = collection(db, PRODUCTS_COLLECTION)
  const snapshot = await getDocs(productsRef)
  const products = snapshot.docs.map(mapProduct)

  if (!normalizedSearch) {
    return products
  }

  return products.filter((product) => product.itemName.toLowerCase().includes(normalizedSearch))
}

export const productService = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  getUsedProductIds,
  getProductUsage,
  isProductUsed,
}
