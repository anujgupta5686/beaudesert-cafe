import { useEffect, useState } from "react"
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
import { MenuItemImage } from "@/components/shared/MenuItemImage"
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

  if (!item) return null

  const unitPrice = resolveItemPrice(item, selectedSize)
  const qty = getQuantity(item._id, selectedSize)
  const cartKey = buildCartKey(item._id, selectedSize)
  const isCombo = item.productType === "combo"
  const unavailable = item.isAvailable === false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        bodyClassName="p-0 pr-0 pt-0 sm:p-0 sm:pr-0"
      >
        <div className="relative aspect-[16/10] w-full bg-muted/40">
          <MenuItemImage
            src={item.image}
            alt={item.name}
            className="object-contain p-3"
            iconClassName="h-14 w-14 sm:h-16 sm:w-16"
          />
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
            <DialogDescription asChild>
              <div className="flex items-baseline gap-2">
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
            </DialogDescription>
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

          {isCombo && item.comboItems && item.comboItems.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Includes</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {item.comboItems.map((ci, idx) => {
                  const name =
                    typeof ci.item === "object" && ci.item
                      ? ci.item.name
                      : "Item"
                  return (
                    <li key={idx}>
                      {ci.quantity}× {name}
                      {ci.variantLabel ? ` (${ci.variantLabel})` : ""}
                    </li>
                  )
                })}
              </ul>
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
