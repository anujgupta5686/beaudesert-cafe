import { useCallback, useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchMenu } from "@/store/slices/menuSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Star,
  Loader2,
  RefreshCw,
} from "lucide-react"
import axios from "@/api/axios"
import { formatPrice } from "@/lib/formatPrice"
import type { Order } from "@/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type TabType = "products" | "orders" | "customers" | "feedback"

interface ProductStats {
  name: string
  count: number
  revenue: number
}

interface CustomerStats {
  name: string
  mobile: string
  totalOrders: number
  totalSpent: number
}

interface FeedbackRow {
  _id: string
  customerName?: string
  email?: string
  overallRating?: number
  overallComment?: string
  submittedAt?: string
}

const AdminDashboard = () => {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((state) => state.menu)
  const [orders, setOrders] = useState<Order[]>([])
  const [orderTotal, setOrderTotal] = useState(0)
  const [customerCount, setCustomerCount] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [feedbackCount, setFeedbackCount] = useState(0)
  const [recentFeedback, setRecentFeedback] = useState<FeedbackRow[]>([])
  const [topProducts, setTopProducts] = useState<ProductStats[]>([])
  const [customers, setCustomers] = useState<CustomerStats[]>([])
  const [activeTab, setActiveTab] = useState<TabType>("products")
  const [loadingData, setLoadingData] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboard = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true)
      else setLoadingData(true)

      const [statsRes, feedbackSettled] = await Promise.all([
        axios.get("/orders/dashboard-stats"),
        axios.get("/feedback/analytics").catch(() => null),
      ])

      const stats = statsRes.data.data || {}
      setOrderTotal(Number(stats.orderTotal) || 0)
      setCustomerCount(Number(stats.customerCount) || 0)
      setTopProducts(
        Array.isArray(stats.topProducts) ? stats.topProducts : []
      )
      setCustomers(
        Array.isArray(stats.topCustomers) ? stats.topCustomers : []
      )
      setOrders(Array.isArray(stats.recentOrders) ? stats.recentOrders : [])

      if (feedbackSettled?.data?.data) {
        setAvgRating(feedbackSettled.data.data.averageRating || 0)
        setFeedbackCount(feedbackSettled.data.data.totalFeedback || 0)
        setRecentFeedback(feedbackSettled.data.data.recent || [])
      } else {
        setAvgRating(0)
        setFeedbackCount(0)
        setRecentFeedback([])
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoadingData(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    dispatch(fetchMenu({ includeUnavailable: true }))
    loadDashboard()
  }, [dispatch, loadDashboard])

  const handleRefresh = () => {
    dispatch(fetchMenu({ includeUnavailable: true }))
    loadDashboard(true)
  }

  const stats = [
    {
      title: "Total Products",
      value: items.length,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      tab: "products" as TabType,
    },
    {
      title: "Total Orders",
      value: orderTotal,
      icon: ShoppingBag,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      tab: "orders" as TabType,
    },
    {
      title: "Total Customers",
      value: customerCount,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      tab: "customers" as TabType,
    },
    {
      title: "Avg Feedback",
      value: feedbackCount ? avgRating : "—",
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      tab: "feedback" as TabType,
    },
  ]

  const orderLabel = (order: Order) =>
    order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`

  const busy = loading || loadingData

  const renderTable = () => {
    if (activeTab === "products") {
      return (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Top 10 Products</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={refreshing || busy}
              onClick={handleRefresh}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    No products have been ordered yet.
                  </TableCell>
                </TableRow>
              ) : (
                topProducts.map((product, index) => (
                  <TableRow key={`${product.name}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.count}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatPrice(product.revenue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )
    }

    if (activeTab === "orders") {
      return (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Recent Orders</h3>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={refreshing || busy}
              onClick={handleRefresh}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    No orders placed yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {orderLabel(order)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatPrice(order.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )
    }

    if (activeTab === "customers") {
      return (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Customer List</h3>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={refreshing || busy}
              onClick={handleRefresh}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No customers yet.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, index) => (
                  <TableRow key={`${customer.mobile}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.mobile}</TableCell>
                    <TableCell className="text-right">
                      {customer.totalOrders}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatPrice(customer.totalSpent)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )
    }

    return (
      <>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-semibold">Recent Feedback</h3>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={refreshing || busy}
            onClick={handleRefresh}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentFeedback.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No feedback submitted yet.
                </TableCell>
              </TableRow>
            ) : (
              recentFeedback.map((fb) => (
                <TableRow key={fb._id}>
                  <TableCell className="font-medium">
                    {fb.customerName || "—"}
                  </TableCell>
                  <TableCell>
                    {fb.overallRating != null ? `${fb.overallRating}★` : "—"}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-muted-foreground">
                    {fb.overallComment || "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {fb.submittedAt
                      ? new Date(fb.submittedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={cn(
              "cursor-pointer border shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
              activeTab === stat.tab && "ring-2 ring-primary/70"
            )}
            onClick={() => setActiveTab(stat.tab)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn("rounded-full p-2", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {busy ? "..." : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm">
        <CardContent className="pt-5">
          {busy && !refreshing ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            renderTable()
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
