import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageCarousel } from "@/components/shared/ImageCarousel"
import { QuantityControls } from "@/components/shared/QuantityControls"
import {
  buildCartKey,
  formatPrice,
  resolveItemPrice,
} from "@/lib/formatPrice"
import { cn } from "@/lib/utils"
import type { MenuItem } from "@/types"

interface ProductDetailDialogProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  getQuantity: (id: string, size?: string | null) => number
  onAdd: (item: MenuItem, size?: string | null) => void
  onUpdateQuantity: (cartKey: string, quantity: number) => void
}

function includedUnitPrice(
  product: Pick<MenuItem, "price" | "hasVariants" | "variants">,
  variantLabel?: string | null
) {
  if (variantLabel && product.hasVariants) {
    const v = product.variants?.find((x) => x.label === variantLabel)
    if (v) return v.price
  }
  return product.price
}

export function ProductDetailDialog({
  item,
  open,
  onOpenChange,
  getQuantity,
  onAdd,
  onUpdateQuantity,
}: ProductDetailDialogProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    if (item.hasVariants && item.variants?.length) {
      const def = item.variants.find((v) => v.isDefault) || item.variants[0]
      setSelectedSize(def.label)
    } else {
      setSelectedSize(null)
    }
  }, [item])

  const isCombo = item?.productType === "combo"
  const unitPrice = item ? resolveItemPrice(item, selectedSize) : 0
  const qty = item ? getQuantity(item._id, selectedSize) : 0
  const cartKey = item ? buildCartKey(item._id, selectedSize) : ""
  const unavailable = item?.isAvailable === false

  const comboLines = useMemo(() => {
    if (!item?.comboItems?.length) return []
    return item.comboItems
      .map((ci, idx) => {
        if (typeof ci.item !== "object" || !ci.item) return null
        const product = ci.item
        return {
          key: `${product._id}-${idx}`,
          product,
          quantity: ci.quantity,
          variantLabel: ci.variantLabel ?? null,
          unit: includedUnitPrice(product, ci.variantLabel),
        }
      })
      .filter(Boolean) as {
      key: string
      product: MenuItem
      quantity: number
      variantLabel: string | null
      unit: number
    }[]
  }, [item])

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        bodyClassName="p-0 pr-0 pt-0 sm:p-0 sm:pr-0"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
          <ImageCarousel item={item} />
        </div>

        <motion.div
          className="space-y-4 p-4 pr-12 sm:p-5 sm:pr-14"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DialogHeader className="gap-2 space-y-0 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {isCombo && <Badge>Combo</Badge>}
              {unavailable && (
                <Badge variant="secondary">Out of stock</Badge>
              )}
            </div>
            <DialogTitle className="text-lg leading-snug sm:text-xl">
              {item.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {item.description || item.name}
            </DialogDescription>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-semibold text-primary">
                {formatPrice(unitPrice)}
              </span>
              {isCombo &&
                item.originalPrice != null &&
                item.originalPrice > item.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(item.originalPrice)}
                  </span>
                )}
            </div>
          </DialogHeader>

          <Separator />

          {item.hasVariants && item.variants && item.variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Select size</p>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => (
                  <Button
                    key={v.label}
                    type="button"
                    size="sm"
                    variant={selectedSize === v.label ? "default" : "outline"}
                    className={cn("min-w-[88px] cursor-pointer")}
                    onClick={() => setSelectedSize(v.label)}
                    disabled={unavailable}
                  >
                    {v.label}
                    <span className="ml-1 text-xs opacity-80">
                      {formatPrice(v.price)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {isCombo && comboLines.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Includes</p>
              <ul className="space-y-3">
                {comboLines.map((line) => (
                  <li
                    key={line.key}
                    className="flex gap-3 rounded-lg border bg-muted/20 p-2"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted/40">
                      <ImageCarousel item={line.product} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {line.quantity}× {line.product.name}
                        {line.variantLabel ? ` (${line.variantLabel})` : ""}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {line.product.description || "—"}
                      </p>
                      <p className="mt-1 text-xs font-medium text-primary">
                        {formatPrice(line.unit)}
                        {line.quantity > 1
                          ? ` × ${line.quantity} = ${formatPrice(line.unit * line.quantity)}`
                          : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
                <span className="text-muted-foreground">Combo price</span>
                <span className="font-semibold text-primary">
                  {formatPrice(item.price)}
                </span>
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-1 text-sm font-medium">Description</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.description || "No description available."}
            </p>
          </div>

          <DialogFooter className="sm:justify-between">
            <span className="text-sm text-muted-foreground">
              {unavailable
                ? "Currently not in stock"
                : qty > 0
                  ? `${qty} in cart`
                  : "Not in cart yet"}
            </span>
            {!unavailable && (
              <div className="w-full sm:w-auto sm:min-w-[180px]">
                <QuantityControls
                  size="md"
                  quantity={qty}
                  onAdd={() => onAdd(item, selectedSize)}
                  onIncrease={() => onUpdateQuantity(cartKey, qty + 1)}
                  onDecrease={() => onUpdateQuantity(cartKey, qty - 1)}
                />
              </div>
            )}
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
