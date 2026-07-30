import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCart } from "@/hooks/useCart"
import { formatPrice } from "@/lib/formatPrice"
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react"

const Cart = () => {
  const navigate = useNavigate()
  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart()

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center py-12">
        <motion.div
          className="mx-auto max-w-md px-4 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">
            Your cart is empty
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Browse the menu and add something delicious.
          </p>
          <Button className="h-11 px-6" onClick={() => navigate("/menu")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Menu
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-10 md:py-14">
      <div className="container mx-auto max-w-4xl px-4">
        <motion.h1
          className="mb-8 text-3xl font-bold tracking-tight md:text-4xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Your Cart
        </motion.h1>

        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.cartKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="overflow-hidden border shadow-sm">
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl object-cover ring-1 ring-foreground/5"
                    />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.size && (
                        <p className="text-xs text-muted-foreground">
                          Size: {item.size}
                        </p>
                      )}
                      <p className="mt-0.5 font-bold text-primary">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.cartKey, item.quantity - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.cartKey, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="min-w-[88px] text-center sm:text-right">
                      <p className="font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.cartKey)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="mt-8 border shadow-sm">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total items</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-primary">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="h-11 flex-1" onClick={clearCart}>
              Clear Cart
            </Button>
            <Button
              className="h-11 flex-1"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Cart
