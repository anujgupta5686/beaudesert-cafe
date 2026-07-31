import type { MenuItem } from "@/types"

/** Normalize product gallery — always returns at least cover `image` (max 6) */
export function getProductImages(
  item: Pick<MenuItem, "image" | "images"> | null | undefined
): string[] {
  if (!item) return []
  const list = Array.isArray(item.images)
    ? item.images.filter(Boolean)
    : []
  let result: string[]
  if (item.image && !list.includes(item.image)) {
    result = [item.image, ...list]
  } else if (list.length) {
    result = list
  } else {
    result = item.image ? [item.image] : []
  }
  return result.slice(0, 6)
}
