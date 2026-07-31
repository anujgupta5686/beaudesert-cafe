import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrderDetailsDialog } from "@/components/shared/OrderDetailsDialog"
import { formatPrice } from "@/lib/formatPrice"
import {
  Search,
  ShoppingBag,
  CheckCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Order } from "@/types"
import { toast } from "sonner"

type Meta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<Meta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [sortKey, setSortKey] = useState("createdAt-desc")
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [sortBy, sortOrder] = sortKey.split("-")

  useEffect(() => {
    const orderParam = searchParams.get("order")
    if (!orderParam) return
    setSearchInput(orderParam)
    setSearch(orderParam)
    setPage(1)
  }, [searchParams])

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, 400)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/orders", {
        params: {
          search: search || undefined,
          status: status === "all" ? undefined : status,
          page,
          limit: meta.limit,
          sortBy,
          sortOrder,
        },
      })
      setOrders(response.data.data || [])
      if (response.data.meta) setMeta(response.data.meta)
    } catch {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page, sortBy, sortOrder])

  useEffect(() => {
    const orderParam = searchParams.get("order")
    if (!orderParam || loading || !orders.length) return
    const match = orders.find(
      (o) => o.orderNumber === orderParam || o._id === orderParam
    )
    if (match) {
      setSelectedOrder(match)
      setDialogOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete("order")
      setSearchParams(next, { replace: true })
    }
  }, [orders, loading, searchParams, setSearchParams])

  const handleMarkSuccess = async (orderId: string) => {
    try {
      setUpdatingId(orderId)
      const res = await axios.put(`/orders/${orderId}/status`, {
        status: "success",
      })
      toast.success("Order marked as completed")
      if (res.data?.emailSent) {
        toast.success("Completion email sent to the customer")
      } else if (res.data?.emailError) {
        toast.error(`Could not send email: ${res.data.emailError}`)
      }
      fetchOrders()
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to update status"
      toast.error(message)
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (s: string) => {
    if (s === "success") {
      return (
        <Badge className="gap-1 bg-emerald-600 text-white">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    )
  }

  const orderLabel = (order: Order) =>
    order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <div className="flex items-center gap-3 rounded-xl border bg-primary/5 px-4 py-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-primary">
            {loading ? "..." : meta.total}
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search order ID, name, email, mobile..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              debouncedSearch(e.target.value)
            }}
            className="h-11 pl-10"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            if (v != null) {
              setStatus(String(v))
              setPage(1)
            }
          }}
        >
          <SelectTrigger className="h-11 w-full min-w-[160px] cursor-pointer lg:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent side="bottom" align="start">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="success">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortKey}
          onValueChange={(v) => {
            if (v != null) {
              setSortKey(String(v))
              setPage(1)
            }
          }}
        >
          <SelectTrigger className="h-11 w-full min-w-[180px] cursor-pointer lg:w-[210px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent side="bottom" align="start">
            <SelectItem value="createdAt-desc">Newest first</SelectItem>
            <SelectItem value="createdAt-asc">Oldest first</SelectItem>
            <SelectItem value="totalAmount-desc">Amount high → low</SelectItem>
            <SelectItem value="totalAmount-asc">Amount low → high</SelectItem>
            <SelectItem value="orderNumber-asc">Order ID A → Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="scrollbar-thin-theme p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <ShoppingBag className="mx-auto mb-2 h-10 w-10 opacity-30" />
                    <p className="font-medium">
                      {search ? "No orders match your search" : "No orders yet"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {orders.map((order, i) => {
                    const completed = order.status === "success"
                    return (
                      <motion.tr
                        key={order._id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{
                          duration: 0.28,
                          delay: Math.min(i * 0.03, 0.2),
                        }}
                        className="border-b hover:bg-muted/30"
                      >
                        <TableCell className="font-mono text-xs font-semibold">
                          {orderLabel(order)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.customerName}
                        </TableCell>
                        <TableCell className="hidden text-sm md:table-cell">
                          {order.email || "—"}
                        </TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatPrice(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status || "pending")}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="cursor-pointer"
                              title="View order"
                              onClick={() => {
                                setSelectedOrder(order)
                                setDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                              title={
                                completed
                                  ? "Already completed"
                                  : "Mark as completed"
                              }
                              onClick={() => handleMarkSuccess(order._id)}
                              disabled={
                                completed || updatingId === order._id
                              }
                            >
                              {updatingId === order._id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {meta.page} of {meta.totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

export default Orders
