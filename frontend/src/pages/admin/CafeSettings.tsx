import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import axios from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import type { CafeSettings } from "@/types"

const emptyForm: CafeSettings = {
  name: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  workingHours: "",
  mapEmbedUrl: "",
  isTemporarilyClosed: false,
  closedFrom: null,
  closedTo: null,
  closureMessage: "",
}

const toDateInput = (value?: string | null) => {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

const CafeSettingsPage = () => {
  const [form, setForm] = useState<CafeSettings>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    axios
      .get("/cafe-settings")
      .then((res) => {
        const data = res.data.data as CafeSettings
        setForm({
          ...emptyForm,
          ...data,
          closedFrom: toDateInput(data.closedFrom),
          closedTo: toDateInput(data.closedTo),
        })
      })
      .catch(() => toast.error("Failed to load cafe settings"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error("Name, address, phone, and email are required")
      return
    }

    try {
      setSaving(true)
      const payload = {
        name: form.name.trim(),
        tagline: form.tagline || "",
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        workingHours: form.workingHours || "",
        mapEmbedUrl: form.mapEmbedUrl || "",
        isTemporarilyClosed: !!form.isTemporarilyClosed,
        closedFrom: form.closedFrom || null,
        closedTo: form.closedTo || null,
        closureMessage: form.closureMessage || "",
      }
      const res = await axios.put("/cafe-settings", payload)
      const data = res.data.data as CafeSettings
      setForm({
        ...emptyForm,
        ...data,
        closedFrom: toDateInput(data.closedFrom),
        closedTo: toDateInput(data.closedTo),
      })
      toast.success("Cafe details updated")
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to update settings"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Cafe Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update cafe details shown on Contact. These fields cannot be deleted.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Restaurant details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">
                  Cafe name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={form.tagline || ""}
                  onChange={(e) =>
                    setForm({ ...form, tagline: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="address"
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="workingHours">Working hours</Label>
                <Textarea
                  id="workingHours"
                  rows={3}
                  placeholder={"Mon–Fri: 7:00 AM – 5:00 PM\nSat–Sun: 8:00 AM – 4:00 PM"}
                  value={form.workingHours || ""}
                  onChange={(e) =>
                    setForm({ ...form, workingHours: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mapEmbedUrl">Google Maps embed URL</Label>
                <Input
                  id="mapEmbedUrl"
                  placeholder="https://www.google.com/maps?q=...&output=embed"
                  value={form.mapEmbedUrl || ""}
                  onChange={(e) =>
                    setForm({ ...form, mapEmbedUrl: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Paste an embed URL (ends with output=embed). Shown on Contact.
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Temporarily closed</p>
                  <p className="text-xs text-muted-foreground">
                    Shows a banner site-wide when enabled
                  </p>
                </div>
                <Switch
                  checked={!!form.isTemporarilyClosed}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isTemporarilyClosed: checked })
                  }
                />
              </div>
              {form.isTemporarilyClosed && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="closedFrom">Closed from</Label>
                    <Input
                      id="closedFrom"
                      type="date"
                      value={(form.closedFrom as string) || ""}
                      onChange={(e) =>
                        setForm({ ...form, closedFrom: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closedTo">Closed to</Label>
                    <Input
                      id="closedTo"
                      type="date"
                      value={(form.closedTo as string) || ""}
                      onChange={(e) =>
                        setForm({ ...form, closedTo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="closureMessage">Closure message</Label>
                    <Textarea
                      id="closureMessage"
                      rows={2}
                      value={form.closureMessage || ""}
                      onChange={(e) =>
                        setForm({ ...form, closureMessage: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full cursor-pointer sm:w-auto"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default CafeSettingsPage
