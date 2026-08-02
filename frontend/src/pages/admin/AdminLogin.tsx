import { useState, useEffect } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { loginAdmin, clearError } from "@/store/slices/authSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coffee, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { toast } from "sonner"

const AdminLogin = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  )
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Handle successful login
  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Login successful! Welcome back!")
      navigate("/admin/dashboard")
    }
  }, [isAuthenticated, navigate])

  // Other-device login / session expired message
  useEffect(() => {
    const reason = searchParams.get("reason")
    if (!reason) return
    if (reason === "session_replaced") {
      toast.error(
        "Logged out: this account signed in on another device."
      )
    } else if (reason === "auth") {
      toast.error("Session expired. Please sign in again.")
    }
    searchParams.delete("reason")
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Handle login error
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // ✅ CRITICAL FIX: e.preventDefault() MUST be here
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // ✅ THIS PREVENTS PAGE REFRESH

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    dispatch(loginAdmin(formData))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Coffee className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your cafe
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@cafe.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Field with Forgot Password Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  to="/admin/forgot-password"
                  className="text-xs text-primary transition-colors hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-11 pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminLogin
