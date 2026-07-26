import { useAppSelector, useAppDispatch } from "@/store/hooks" // ✅ NOW EXISTS
import {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
} from "@/store/slices/cartSlice"
import type { MenuItem } from "@/types"

export const useCart = () => {
  const dispatch = useAppDispatch()
  const items = useAppSelector((state) => state.cart.items)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return {
    items,
    totalItems,
    totalPrice,
    addItem: (item: MenuItem) => dispatch(addItem(item)),
    removeItem: (id: string) => dispatch(removeItem(id)),
    updateQuantity: (id: string, quantity: number) =>
      dispatch(updateQuantity({ id, quantity })),
    clearCart: () => dispatch(clearCart()),
  }
}
