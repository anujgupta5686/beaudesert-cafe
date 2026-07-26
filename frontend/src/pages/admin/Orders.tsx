import { useEffect, useState } from "react"
import { useAppDispatch } from "@/store/hooks"
import axios from "@/api/axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, ShoppingBag, CheckCircle, Clock } from "lucide-react"
import type { Order } from "@/types"
import { toast } from "sonner"

const Orders = () => {
  const dispatch = useAppDispatch()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/orders")
      setOrders(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching orders:", error)
      setLoading(false)
    }
  }

  const handleMarkSuccess = async (orderId: string) => {
    try {
      setUpdatingId(orderId)
      const response = await axios.put(`/orders/${orderId}/status`, {
        status: "success",
      })
      toast.success("Order marked as successful!")

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: "success" } : order
        )
      )
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status")
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.mobile.includes(searchTerm)
  )

  const totalOrders = orders.length

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return (
        <Badge className="bg-green-500 text-white hover:bg-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          Success
        </Badge>
      )
    }
    return (
      <Badge
        variant="secondary"
        className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30"
      >
        <Clock className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    )
  }

  return (
    <div>
      {/* Header with Total Orders */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Total Orders:
          </span>
          <span className="text-xl font-bold text-primary">
            {loading ? "..." : totalOrders}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-10"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Order ID</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Mobile</TableHead>
                <TableHead className="font-semibold">Items</TableHead>
                <TableHead className="text-right font-semibold">
                  Total
                </TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-center font-semibold">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <span>Loading orders...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-lg font-medium">
                        {searchTerm
                          ? "No orders match your search"
                          : "No orders placed yet"}
                      </p>
                      {searchTerm && (
                        <p className="text-sm">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      #{order._id.slice(-6)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell>{order.mobile}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {order.items.length} items
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      ₹{order.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status || "pending")}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.status === "success" ? (
                        <span className="text-xs text-muted-foreground">
                          Completed
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleMarkSuccess(order._id)}
                          disabled={updatingId === order._id}
                        >
                          {updatingId === order._id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Mark Success
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default Orders
