import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCart } from "@/hooks/useCart"
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
      <div className="flex min-h-screen items-center justify-center py-12">
        <div className="mx-auto max-w-md px-4 text-center">
          <ShoppingBag className="mx-auto mb-4 h-20 w-20 text-muted-foreground" />
          <h2 className="mb-4 text-3xl font-bold">Your Cart is Empty</h2>
          <p className="mb-8 text-muted-foreground">
            Start adding some delicious items!
          </p>
          <Button onClick={() => navigate("/menu")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Menu
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="mb-8 text-3xl font-bold md:text-4xl">Your Cart</h1>

        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item._id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <img
                    src={item.image || "https://via.placeholder.com/80"}
                    alt={item.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="font-bold text-primary">₹{item.price}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantity(item._id, item.quantity - 1)
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantity(item._id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="min-w-[80px] text-center sm:text-right">
                    <p className="font-bold">₹{item.price * item.quantity}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeItem(item._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-primary">
                <span>Total Amount:</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={clearCart}>
              Clear Cart
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
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
