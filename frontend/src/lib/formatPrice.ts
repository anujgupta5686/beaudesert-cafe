export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

/** Build a stable cart line key for product + size */
export function buildCartKey(id: string, size?: string | null): string {
  return size ? `${id}__${size}` : id
}

/** Resolve display / cart unit price for a menu item */
export function resolveItemPrice(
  item: { price: number; hasVariants?: boolean; variants?: { label: string; price: number; isDefault?: boolean }[] },
  size?: string | null
): number {
  if (item.hasVariants && item.variants?.length) {
    const selected =
      (size && item.variants.find((v) => v.label === size)) ||
      item.variants.find((v) => v.isDefault) ||
      item.variants[0]
    return selected.price
  }
  return item.price
}
