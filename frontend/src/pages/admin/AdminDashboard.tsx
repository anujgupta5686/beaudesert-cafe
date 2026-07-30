import { useEffect, useState } from "react"
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
import { Package, ShoppingBag, Users, TrendingUp, Star } from "lucide-react"
import axios from "@/api/axios"
import { formatPrice } from "@/lib/formatPrice"
import type { Order } from "@/types"

type TabType = "products" | "orders" | "customers"

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

const AdminDashboard = () => {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((state) => state.menu)
  const [orders, setOrders] = useState<Order[]>([])
  const [customerCount, setCustomerCount] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [feedbackCount, setFeedbackCount] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>("products")
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    dispatch(fetchMenu({ includeUnavailable: true }))
    fetchOrdersAndCustomers()
  }, [dispatch])

  const fetchOrdersAndCustomers = async () => {
    try {
      setLoadingData(true)
      const ordersResponse = await axios.get("/orders")
      setOrders(ordersResponse.data.data)

      const customerResponse = await axios.get("/orders/customers/count")
      setCustomerCount(customerResponse.data.data.totalCustomers)

      try {
        const feedbackRes = await axios.get("/feedback/analytics")
        setAvgRating(feedbackRes.data.data?.averageRating || 0)
        setFeedbackCount(feedbackRes.data.data?.totalFeedback || 0)
      } catch {
        // analytics optional if no feedback yet
      }

      setLoadingData(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setLoadingData(false)
    }
  }

  // Get top 10 products by order count
  const getTopProducts = (): ProductStats[] => {
    const productCount: {
      [key: string]: ProductStats
    } = {}

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const quantity = item.quantity || 1
        if (productCount[item.menuItemId]) {
          productCount[item.menuItemId].count += quantity
          productCount[item.menuItemId].revenue += item.price * quantity
        } else {
          productCount[item.menuItemId] = {
            name: item.name,
            count: quantity,
            revenue: item.price * quantity,
          }
        }
      })
    })

    return Object.values(productCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
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
      value: orders.length,
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
      value: feedbackCount ? `${avgRating}★ (${feedbackCount})` : "—",
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      tab: "orders" as TabType,
    },
  ]

  const topProducts = getTopProducts()

  // Get unique customers
  const getUniqueCustomers = (): CustomerStats[] => {
    const uniqueCustomers: { [key: string]: CustomerStats } = {}

    orders.forEach((order) => {
      const key = `${order.customerName}-${order.mobile}`
      if (!uniqueCustomers[key]) {
        uniqueCustomers[key] = {
          name: order.customerName,
          mobile: order.mobile,
          totalOrders: 0,
          totalSpent: 0,
        }
      }
      uniqueCustomers[key].totalOrders += 1
      uniqueCustomers[key].totalSpent += order.totalAmount
    })

    return Object.values(uniqueCustomers)
  }

  const customers = getUniqueCustomers()

  const renderTable = () => {
    if (activeTab === "products") {
      return (
        <>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Top 10 Products</h3>
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
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.count}
                    </TableCell>
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
          <h3 className="mb-4 font-semibold">Recent Orders</h3>
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
                orders.slice(0, 10).map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-mono text-xs">
                      #{order._id.slice(-6)}
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
          <h3 className="mb-4 font-semibold">Customer List</h3>
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
                customers.slice(0, 10).map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
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

    return null
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={`cursor-pointer border-0 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
              activeTab === stat.tab ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setActiveTab(stat.tab)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full ${stat.bgColor} p-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading || loadingData ? "..." : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {activeTab === "products" && "Top 10 Products"}
            {activeTab === "orders" && "Recent Orders"}
            {activeTab === "customers" && "Customer List"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading || loadingData ? (
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
