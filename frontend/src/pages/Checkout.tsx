import { Navigate, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/useCart"
import { formatPrice } from "@/lib/formatPrice"
import { ArrowLeft } from "lucide-react"
import axios from "@/api/axios"
import { toast } from "sonner"
import { useState } from "react"

const Checkout = () => {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    mobile: "",
    address: "",
    specialInstructions: "",
  })

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
          quantity: item.quantity,
          image: item.image,
          size: item.size || null,
          productType: item.productType || "normal",
        })),
      }

      const response = await axios.post("/orders", orderData)

      if (response.data.success) {
        clearCart()
        if (response.data.userEmailSent) {
          toast.success(
            "Order placed successfully! Check your email for confirmation."
          )
        } else {
          toast.success("Order placed successfully!")
          if (response.data.emailError) {
            toast.error(
              `Confirmation email could not be sent: ${response.data.emailError}`
            )
          }
        }
        navigate("/")
      }
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to place order. Please try again."
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-10 md:py-14">
      <div className="container mx-auto max-w-3xl px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/cart")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden border shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-2xl tracking-tight md:text-3xl">
                Checkout
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter your details to complete the order
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    required
                    placeholder="John Doe"
                    value={formData.customerName}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">
                      Mobile <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={formData.mobile}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Delivery Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    required
                    placeholder="123 Main Street, City"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialInstructions">
                    Special Instructions
                  </Label>
                  <Textarea
                    id="specialInstructions"
                    name="specialInstructions"
                    placeholder="Any special requests..."
                    value={formData.specialInstructions}
                    onChange={handleChange}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
                  <h4 className="text-sm font-semibold">Order Summary</h4>
                  {items.map((item) => (
                    <div
                      key={item.cartKey}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.name}
                        {item.size ? ` (${item.size})` : ""} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-3 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatPrice(totalPrice)}
                    </span>
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
        </motion.div>
      </div>
    </div>
  )
}

export default Checkout
