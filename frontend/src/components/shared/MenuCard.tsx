import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Coffee } from "lucide-react"
import type { MenuItem } from "@/types"

interface MenuCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem) => void
}

const MenuCard = ({ item, onAddToCart }: MenuCardProps) => {
  return (
    <Card className="group overflow-hidden border border-border/50 bg-background shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Image - Fixed height 140px */}
      <div className="relative h-[180px] w-full overflow-hidden bg-muted/20">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Coffee className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Content - Compact */}
      <CardContent className="space-y-0.5 p-3 pb-1">
        <h3 className="line-clamp-1 text-sm leading-tight font-semibold">
          {item.name}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {item.description}
        </p>
        <p className="pt-1 text-base font-bold text-primary">₹{item.price}</p>
      </CardContent>

      {/* Footer - Compact */}
      <CardFooter className="p-3 pt-1">
        <Button
          size="sm"
          className="h-8 w-full text-xs"
          onClick={() => onAddToCart(item)}
        >
          <ShoppingCart className="mr-1.5 h-3 w-3" />
          Add
        </Button>
      </CardFooter>
    </Card>
  )
}

export default MenuCard
