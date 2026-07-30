import { useMemo } from "react"
import { useCart } from "@/hooks/useCart"
import { buildCartKey } from "@/lib/formatPrice"

export function useCartQuantity() {
  const { items: cartItems } = useCart()

  const quantityMap = useMemo(() => {
    const map = new Map<string, number>()
    cartItems.forEach((item) => {
      map.set(item.cartKey, item.quantity)
      // Also index by bare id for items without size (legacy)
      if (!item.size) {
        map.set(item._id, item.quantity)
      }
    })
    return map
  }, [cartItems])

  const getQuantity = (id: string, size?: string | null) =>
    quantityMap.get(buildCartKey(id, size)) ?? 0

  return { getQuantity }
}
