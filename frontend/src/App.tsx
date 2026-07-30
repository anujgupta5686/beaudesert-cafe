import { lazy, Suspense } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Toaster } from "sonner"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { ShopClosedBanner } from "@/components/shared/ShopClosedBanner"
import { useAuth } from "@/hooks/useAuth"

const Home = lazy(() => import("@/pages/Home"))
const Menu = lazy(() => import("@/pages/Menu"))
const Cart = lazy(() => import("@/pages/Cart"))
const Checkout = lazy(() => import("@/pages/Checkout"))
const Contact = lazy(() => import("@/pages/Contact"))
const Feedback = lazy(() => import("@/pages/Feedback"))

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"))
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"))
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"))
const AdminProfile = lazy(() => import("@/pages/admin/AdminProfile"))
const Products = lazy(() => import("@/pages/admin/Products"))
const Orders = lazy(() => import("@/pages/admin/Orders"))
const AddProduct = lazy(() => import("@/pages/admin/AddProduct"))
const Categories = lazy(() => import("@/pages/admin/Categories"))
const Combos = lazy(() => import("@/pages/admin/Combos"))
const CafeSettings = lazy(() => import("@/pages/admin/CafeSettings"))
const Messages = lazy(() => import("@/pages/admin/Messages"))
const ForgotPassword = lazy(() => import("@/pages/admin/ForgotPassword"))
const VerifyOTP = lazy(() => import("@/pages/admin/VerifyOTP"))
const ResetPasswordOTP = lazy(() => import("@/pages/admin/ResetPasswordOTP"))

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}

const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith("/admin")
  const isFeedbackRoute = location.pathname.startsWith("/feedback")

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminRoute && !isFeedbackRoute && (
        <>
          <ShopClosedBanner />
          <Navbar />
        </>
      )}

      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/feedback/:token" element={<Feedback />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/verify-otp" element={<VerifyOTP />} />
            <Route path="/admin/reset-password" element={<ResetPasswordOTP />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/edit/:id" element={<AddProduct />} />
              <Route path="categories" element={<Categories />} />
              <Route path="combos" element={<Combos />} />
              <Route path="orders" element={<Orders />} />
              <Route path="cafe-settings" element={<CafeSettings />} />
              <Route path="messages" element={<Messages />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdminRoute && !isFeedbackRoute && <Footer />}
      <Toaster richColors position="top-right" />
    </div>
  )
}

export default App
