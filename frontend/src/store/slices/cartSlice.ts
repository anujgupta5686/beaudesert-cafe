import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { CartItem, MenuItem } from "@/types"
import { buildCartKey, resolveItemPrice } from "@/lib/formatPrice"

interface CartState {
  items: CartItem[]
}

export type AddToCartPayload = {
  item: MenuItem
  size?: string | null
}

const loadCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem("cart")
    if (!saved) return []
    const parsed = JSON.parse(saved) as CartItem[]
    // Migrate legacy cart items without cartKey
    return parsed.map((line) => ({
      ...line,
      cartKey: line.cartKey || buildCartKey(line._id, line.size),
    }))
  } catch {
    return []
  }
}

const persist = (items: CartItem[]) => {
  localStorage.setItem("cart", JSON.stringify(items))
}

const initialState: CartState = {
  items: loadCart(),
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<AddToCartPayload | MenuItem>) => {
      const payload = action.payload
      const item = "item" in payload ? payload.item : payload
      const size =
        "item" in payload
          ? payload.size ?? null
          : item.hasVariants
            ? item.variants?.find((v) => v.isDefault)?.label ||
              item.variants?.[0]?.label ||
              null
            : null

      const cartKey = buildCartKey(item._id, size)
      const unitPrice = resolveItemPrice(item, size)
      const existing = state.items.find((line) => line.cartKey === cartKey)

      if (existing) {
        existing.quantity += 1
      } else {
        state.items.push({
          _id: item._id,
          cartKey,
          name: item.name,
          description: item.description,
          price: unitPrice,
          image: item.image,
          quantity: 1,
          size,
          productType: item.productType || "normal",
          originalPrice: item.originalPrice,
          hasVariants: !!item.hasVariants,
          variants: item.variants || [],
        })
      }
      persist(state.items)
    },
    removeItem: (state, action: PayloadAction<string>) => {
      // accepts cartKey
      state.items = state.items.filter(
        (item) => item.cartKey !== action.payload && item._id !== action.payload
      )
      persist(state.items)
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const { id, quantity } = action.payload
      const item = state.items.find(
        (line) => line.cartKey === id || line._id === id
      )
      if (item) {
        item.quantity = quantity
        if (item.quantity <= 0) {
          state.items = state.items.filter(
            (line) => line.cartKey !== item.cartKey
          )
        }
      }
      persist(state.items)
    },
    /** Change size on an existing cart line (merges if target size already exists) */
    changeItemSize: (
      state,
      action: PayloadAction<{ cartKey: string; size: string }>
    ) => {
      const { cartKey, size } = action.payload
      const line = state.items.find((l) => l.cartKey === cartKey)
      if (!line || !line.hasVariants || !line.variants?.length) return
      if (line.size === size) return

      const variant = line.variants.find((v) => v.label === size)
      if (!variant) return

      const newKey = buildCartKey(line._id, size)
      const existing = state.items.find((l) => l.cartKey === newKey)

      if (existing) {
        existing.quantity += line.quantity
        state.items = state.items.filter((l) => l.cartKey !== cartKey)
      } else {
        line.cartKey = newKey
        line.size = size
        line.price = variant.price
      }
      persist(state.items)
    },
    clearCart: (state) => {
      state.items = []
      localStorage.removeItem("cart")
    },
  },
})

export const { addItem, removeItem, updateQuantity, changeItemSize, clearCart } =
  cartSlice.actions
export default cartSlice.reducer
