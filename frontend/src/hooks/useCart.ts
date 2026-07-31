import { useAppSelector, useAppDispatch } from "@/store/hooks"
import {
  addItem,
  removeItem,
  updateQuantity,
  changeItemSize,
  clearCart,
} from "@/store/slices/cartSlice"
import type { MenuItem } from "@/types"
import { buildCartKey } from "@/lib/formatPrice"

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
    addItem: (item: MenuItem, size?: string | null) =>
      dispatch(addItem({ item, size })),
    removeItem: (cartKey: string) => dispatch(removeItem(cartKey)),
    updateQuantity: (cartKey: string, quantity: number) =>
      dispatch(updateQuantity({ id: cartKey, quantity })),
    changeItemSize: (cartKey: string, size: string) =>
      dispatch(changeItemSize({ cartKey, size })),
    clearCart: () => dispatch(clearCart()),
    getQuantity: (id: string, size?: string | null) => {
      const key = buildCartKey(id, size)
      return items.find((i) => i.cartKey === key)?.quantity ?? 0
    },
  }
}
