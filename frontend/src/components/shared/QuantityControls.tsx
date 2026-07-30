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
}

export function QuantityControls({
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
  size = "sm",
  className,
  stopPropagation = false,
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
          "w-full gap-1.5 rounded-lg text-xs font-semibold shadow-sm",
          height,
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
        "flex w-full items-center overflow-hidden rounded-lg border bg-background shadow-xs",
        height,
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 rounded-none hover:bg-muted",
          height,
          btnWidth
        )}
        onClick={wrapClick(onDecrease)}
        aria-label="Decrease quantity"
      >
        <Minus className={iconSize} />
      </Button>
      <span className="flex-1 text-center text-xs font-semibold tabular-nums">
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 rounded-none hover:bg-muted",
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
