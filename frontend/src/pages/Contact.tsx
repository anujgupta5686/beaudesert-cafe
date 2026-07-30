import { useEffect, useState } from "react"
import axios from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import type { CafeSettings } from "@/types"

const Contact = () => {
  const [settings, setSettings] = useState<CafeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  })

  useEffect(() => {
    axios
      .get("/cafe-settings")
      .then((res) => setSettings(res.data.data))
      .catch(() => toast.error("Failed to load cafe details"))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSending(true)
      await axios.post("/contact", form)
      toast.success("Thanks! We'll get back to you soon.")
      setForm({ name: "", email: "", message: "" })
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to send message"
      toast.error(message)
    } finally {
      setSending(false)
    }
  }

  const hoursLines = (settings?.workingHours || "")
    .split("\n")
    .filter(Boolean)

  return (
    <div className="min-h-screen py-10 md:py-14">
      <div className="container mx-auto max-w-5xl px-4">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Contact Us
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Visit us or send a message — we&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {loading ? "Cafe Details" : settings?.name || "Cafe Details"}
                </CardTitle>
                {settings?.tagline && (
                  <p className="text-sm text-muted-foreground">
                    {settings.tagline}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-muted-foreground whitespace-pre-line">
                          {settings?.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Phone className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="font-medium">Phone</p>
                        <a
                          href={`tel:${settings?.phone}`}
                          className="cursor-pointer text-muted-foreground hover:text-primary"
                        >
                          {settings?.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Mail className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="font-medium">Email</p>
                        <a
                          href={`mailto:${settings?.email}`}
                          className="cursor-pointer text-muted-foreground hover:text-primary"
                        >
                          {settings?.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="font-medium">Hours</p>
                        <p className="text-muted-foreground">
                          {hoursLines.map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {settings?.mapEmbedUrl && (
              <div className="overflow-hidden rounded-2xl border shadow-sm">
                <iframe
                  title={`${settings.name} Map`}
                  src={settings.mapEmbedUrl}
                  className="h-64 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="h-full border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full cursor-pointer"
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Contact
