import { Minus, Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuantityControlsProps {
  quantity: number
  onAdd: () => void
  onIncrease: () => void
  onDecrease: () => void
  size?: "xs" | "sm" | "md"
  className?: string
  stopPropagation?: boolean
  /** Compact Add button — width fits content instead of full row */
  compact?: boolean
}

export function QuantityControls({
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
  size = "sm",
  className,
  stopPropagation = false,
  compact = false,
}: QuantityControlsProps) {
  const height = size === "xs" ? "h-8" : size === "sm" ? "h-9" : "h-10"
  const iconSize =
    size === "xs" ? "h-3 w-3" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const btnWidth = size === "xs" ? "w-8" : "w-9"

  const wrapClick =
    (handler: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      if (stopPropagation) {
        e.stopPropagation()
        e.preventDefault()
      }
      handler()
    }

  if (quantity === 0) {
    return (
      <Button
        size="sm"
        className={cn(
          "gap-1.5 rounded-lg text-xs font-semibold shadow-sm",
          height,
          compact ? "w-auto shrink-0 px-3" : "w-full",
          className
        )}
        onClick={wrapClick(onAdd)}
      >
        <ShoppingCart className={iconSize} />
        Add
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center overflow-hidden rounded-lg border bg-background shadow-xs",
        height,
        compact ? "w-auto shrink-0" : "w-full",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 cursor-pointer rounded-none hover:bg-muted",
          height,
          btnWidth
        )}
        onClick={wrapClick(onDecrease)}
        aria-label="Decrease quantity"
      >
        <Minus className={iconSize} />
      </Button>
      <span
        className={cn(
          "text-center text-xs font-semibold tabular-nums",
          compact ? "min-w-7 px-1" : "flex-1"
        )}
      >
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 cursor-pointer rounded-none hover:bg-muted",
          height,
          btnWidth
        )}
        onClick={wrapClick(onIncrease)}
        aria-label="Increase quantity"
      >
        <Plus className={iconSize} />
      </Button>
    </div>
  )
}
