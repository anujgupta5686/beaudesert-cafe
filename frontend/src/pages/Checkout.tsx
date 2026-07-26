import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/useCart"
import { ArrowLeft } from "lucide-react"
import axios from "@/api/axios"
import { toast } from "sonner"

const Checkout = () => {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: "",
    mobile: "",
    address: "",
    specialInstructions: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = {
        ...formData,
        items: items.map((item) => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity, // ✅ SEND QUANTITY
        })),
        totalAmount: totalPrice,
      }

      await axios.post("/orders", orderData)
      clearCart()
      toast.success(
        "🎉 Order placed successfully! Check your email for confirmation."
      )
      navigate("/")
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to place order. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate("/cart")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12">
      <div className="container mx-auto max-w-3xl px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/cart")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>

        <Card className="border-0 shadow-lg">
          <CardHeader className="rounded-t-lg border-b bg-primary/5">
            <CardTitle className="text-3xl">Checkout</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill in your details to place your order
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  placeholder="John Doe"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Delivery Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  required
                  placeholder="123 Main Street, City, State - 123456"
                  value={formData.address}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="specialInstructions"
                  className="text-sm font-medium"
                >
                  Special Instructions
                </Label>
                <Textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  placeholder="Any special requests... (e.g. Extra sugar, No onions, etc.)"
                  value={formData.specialInstructions}
                  onChange={handleChange}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Order Summary */}
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <h4 className="font-semibold">Order Summary</h4>
                {items.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">₹{totalPrice}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full text-base font-semibold"
                size="lg"
                disabled={loading}
              >
                {loading ? "Placing Order..." : "Place Order"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Checkout
