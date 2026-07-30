import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type FeedbackOrderItem = {
  menuItemId?: string
  name: string
  quantity: number
}

type FeedbackData = {
  customerName?: string
  order?: {
    items: FeedbackOrderItem[]
  }
  submitted?: boolean
}

const StarRating = ({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="rounded p-0.5 hover:scale-110"
        aria-label={`${n} stars`}
      >
        <Star
          className={cn(
            "h-6 w-6",
            n <= value
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground"
          )}
        />
      </button>
    ))}
  </div>
)

const Feedback = () => {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [data, setData] = useState<FeedbackData | null>(null)
  const [overallRating, setOverallRating] = useState(0)
  const [overallComment, setOverallComment] = useState("")
  const [itemRatings, setItemRatings] = useState<
    Record<string, { rating: number; comment: string }>
  >({})

  useEffect(() => {
    if (!token) return
    axios
      .get(`/feedback/${token}`)
      .then((res) => {
        setData(res.data.data)
        const ratings: Record<string, { rating: number; comment: string }> = {}
        res.data.data?.order?.items?.forEach(
          (item: FeedbackOrderItem, idx: number) => {
            const key = item.menuItemId || `${idx}`
            ratings[key] = { rating: 0, comment: "" }
          }
        )
        setItemRatings(ratings)
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Invalid or expired feedback link"
        )
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overallRating < 1) {
      toast.error("Please provide an overall rating")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        overallRating,
        overallComment,
        itemRatings: (data?.order?.items || []).map((item, idx) => {
          const key = item.menuItemId || `${idx}`
          return {
            menuItemId: item.menuItemId,
            name: item.name,
            rating: itemRatings[key]?.rating || overallRating,
            comment: itemRatings[key]?.comment || "",
          }
        }),
      }
      await axios.post(`/feedback/${token}`, payload)
      setDone(true)
      toast.success("Thank you for your feedback!")
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : "Failed to submit feedback"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Unable to load feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Thank you!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your feedback helps us serve you better.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-xl px-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Hi {data?.customerName || "there"}, rate your order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Overall experience</Label>
                <StarRating value={overallRating} onChange={setOverallRating} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comments (optional)</Label>
                <Textarea
                  id="comment"
                  rows={3}
                  value={overallComment}
                  onChange={(e) => setOverallComment(e.target.value)}
                  placeholder="Tell us what you loved..."
                />
              </div>

              {(data?.order?.items || []).length > 0 && (
                <div className="space-y-4">
                  <Label>Rate individual items</Label>
                  {data!.order!.items.map((item, idx) => {
                    const key = item.menuItemId || `${idx}`
                    return (
                      <div
                        key={key}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <p className="text-sm font-medium">{item.name}</p>
                        <StarRating
                          value={itemRatings[key]?.rating || 0}
                          onChange={(v) =>
                            setItemRatings((prev) => ({
                              ...prev,
                              [key]: { ...prev[key], rating: v },
                            }))
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Feedback
