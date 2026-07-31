import { useEffect, useState } from "react"
import { motion } from "framer-motion"
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

interface MenuCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem, size?: string | null) => void
  quantity?: number
  onUpdateQuantity?: (cartKey: string, quantity: number) => void
  onClick?: () => void
  getQuantity?: (id: string, size?: string | null) => number
}

const MenuCard = ({
  item,
  onAddToCart,
  quantity: quantityProp,
  onUpdateQuantity,
  onClick,
  getQuantity,
}: MenuCardProps) => {
  const defaultSize = item.hasVariants
    ? item.variants?.find((v) => v.isDefault)?.label ||
      item.variants?.[0]?.label ||
      null
    : null

  const [localSize, setLocalSize] = useState<string | null>(defaultSize)

  useEffect(() => {
    setLocalSize(defaultSize)
  }, [item._id, defaultSize])

  const size = item.hasVariants ? localSize : null
  const unitPrice = resolveItemPrice(item, size)
  const cartKey = buildCartKey(item._id, size)
  const quantity = getQuantity?.(item._id, size) ?? quantityProp ?? 0
  const isCombo = item.productType === "combo"
  const unavailable = item.isAvailable === false
  const hasDiscount =
    isCombo && item.originalPrice != null && item.originalPrice > item.price

  return (
    <motion.article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onClick()
        }
      }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm",
        "cursor-pointer ring-1 ring-foreground/5 transition-shadow hover:shadow-md",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        unavailable && "opacity-60"
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <ImageCarousel item={item} />
        {isCombo && (
          <Badge className="pointer-events-none absolute top-2 left-2 z-20 shadow-sm">
            Combo
          </Badge>
        )}
        {unavailable && (
          <Badge className="pointer-events-none absolute top-2 right-2 z-20 bg-zinc-900 text-white">
            Out of stock
          </Badge>
        )}
        {hasDiscount && !unavailable && (
          <Badge className="pointer-events-none absolute top-2 right-2 z-20 bg-emerald-600 text-white">
            Deal
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-3.5">
        <h3 className="line-clamp-1 text-sm font-semibold sm:text-base">
          {item.name}
        </h3>
        <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
          {item.description || "No description available."}
        </p>

        <div className="mt-auto flex items-baseline gap-1.5 pt-1">
          <p className="text-base font-bold text-primary tabular-nums">
            {formatPrice(unitPrice)}
          </p>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(item.originalPrice!)}
            </span>
          )}
        </div>

        <div
          className="pt-1.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {unavailable ? (
            <Button
              size="sm"
              variant="secondary"
              disabled
              className="h-8 w-auto cursor-not-allowed px-3 text-xs"
            >
              Not in stock
            </Button>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                {item.hasVariants && item.variants && item.variants.length > 0 ? (
                  <>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      Size
                    </span>
                    <div className="flex min-w-0 flex-wrap gap-1">
                      {item.variants.map((v) => (
                        <button
                          key={v.label}
                          type="button"
                          className={cn(
                            "cursor-pointer rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                            size === v.label
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50"
                          )}
                          onClick={() => setLocalSize(v.label)}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <span />
                )}
              </div>
              <QuantityControls
                size="xs"
                compact
                className="shrink-0"
                quantity={quantity}
                onAdd={() => onAddToCart(item, size)}
                onIncrease={() => onUpdateQuantity?.(cartKey, quantity + 1)}
                onDecrease={() => onUpdateQuantity?.(cartKey, quantity - 1)}
                stopPropagation
              />
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default MenuCard
