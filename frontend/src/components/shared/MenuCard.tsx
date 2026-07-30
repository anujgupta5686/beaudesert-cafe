import { motion } from "framer-motion"
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

interface MenuCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem, size?: string | null) => void
  quantity?: number
  onUpdateQuantity?: (cartKey: string, quantity: number) => void
  onClick?: () => void
  selectedSize?: string | null
}

const MenuCard = ({
  item,
  onAddToCart,
  quantity = 0,
  onUpdateQuantity,
  onClick,
  selectedSize,
}: MenuCardProps) => {
  const size =
    selectedSize ??
    (item.hasVariants
      ? item.variants?.find((v) => v.isDefault)?.label ||
        item.variants?.[0]?.label ||
        null
      : null)

  const unitPrice = resolveItemPrice(item, size)
  const cartKey = buildCartKey(item._id, size)
  const isCombo = item.productType === "combo"
  const unavailable = item.isAvailable === false
  const hasDiscount =
    isCombo && item.originalPrice != null && item.originalPrice > item.price
  const fromPrice =
    item.hasVariants && item.variants?.length
      ? Math.min(...item.variants.map((v) => v.price))
      : null

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
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/50">
        <MenuItemImage
          src={item.image}
          alt={item.name}
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {isCombo && (
          <Badge className="absolute top-2 left-2 shadow-sm">Combo</Badge>
        )}
        {unavailable && (
          <Badge className="absolute top-2 right-2 bg-zinc-900 text-white">
            Out of stock
          </Badge>
        )}
        {hasDiscount && !unavailable && (
          <Badge className="absolute top-2 right-2 bg-emerald-600 text-white">
            Save
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
          <p className="text-base font-bold text-primary">
            {formatPrice(fromPrice ?? unitPrice)}
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
              className="h-9 w-full cursor-not-allowed text-xs"
            >
              Currently not in stock
            </Button>
          ) : item.hasVariants ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-9 w-full cursor-pointer text-xs"
              onClick={onClick}
            >
              Select options
            </Button>
          ) : (
            <QuantityControls
              size="xs"
              quantity={quantity}
              onAdd={() => onAddToCart(item, size)}
              onIncrease={() => onUpdateQuantity?.(cartKey, quantity + 1)}
              onDecrease={() => onUpdateQuantity?.(cartKey, quantity - 1)}
              stopPropagation
            />
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default MenuCard
