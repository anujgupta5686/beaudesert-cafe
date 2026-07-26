import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, ArrowLeft, Clock } from "lucide-react"
import { toast } from "sonner"
import axios from "@/api/axios"

const VerifyOTP = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ""
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timer, setTimer] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (!email) {
      navigate("/admin/forgot-password")
      return
    }

    // Timer for resend
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [email, navigate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)
    try {
      await axios.post("/admin/verify-otp", { email, otp })
      toast.success("OTP verified!")
      navigate("/admin/reset-password", { state: { email, otp } })
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await axios.post("/admin/forgot-password", { email })
      toast.success("New OTP sent to your email!")
      setTimer(600)
      setCanResend(false)
      // Reset timer
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resend OTP")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Coffee className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit OTP sent to{" "}
            <strong className="text-primary">{email}</strong>
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Input - Using shadcn InputOTP */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot
                    index={0}
                    className="h-14 w-14 text-2xl font-semibold"
                  />
                  <InputOTPSlot
                    index={1}
                    className="h-14 w-14 text-2xl font-semibold"
                  />
                  <InputOTPSlot
                    index={2}
                    className="h-14 w-14 text-2xl font-semibold"
                  />
                  <InputOTPSlot
                    index={3}
                    className="h-14 w-14 text-2xl font-semibold"
                  />
                  <InputOTPSlot
                    index={4}
                    className="h-14 w-14 text-2xl font-semibold"
                  />
                  <InputOTPSlot
                    index={5}
                    className="h-14 w-14 text-2xl font-semibold"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Timer and Resend */}
            <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Expires in:{" "}
                  <span className="font-semibold text-foreground">
                    {formatTime(timer)}
                  </span>
                </span>
              </div>
              {canResend ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Resend available after timer
                </span>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => navigate("/admin/forgot-password")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forgot Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyOTP
