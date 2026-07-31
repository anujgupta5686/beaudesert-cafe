import type { ComponentType } from "react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MenuItemImage } from "@/components/shared/MenuItemImage"
import { formatPrice } from "@/lib/formatPrice"
import {
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Phone,
  User,
  Package,
  ExternalLink,
} from "lucide-react"
import type { Order } from "@/types"
import {
  googleMapsUrl,
  hasValidCoords,
  staticMapPreviewUrl,
} from "@/lib/maps"

interface OrderDetailsDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success") {
    return (
      <Badge className="w-fit gap-1 bg-emerald-600 text-white">
        <CheckCircle className="h-3 w-3" />
        Completed
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="w-fit gap-1">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  )
}

export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  if (!order) return null

  const orderDate = new Date(order.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const displayId =
    order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 sm:max-w-2xl">
        <DialogHeader className="space-y-2 border-b pb-4">
          <DialogTitle className="text-lg sm:text-xl">
            Order {displayId}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Placed {orderDate}
          </DialogDescription>
          <StatusBadge status={order.status || "pending"} />
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5 pt-4"
        >
          <section>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-primary" />
              Customer
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoTile
                icon={User}
                label="Name"
                value={order.customerName}
              />
              <InfoTile
                icon={Mail}
                label="Email"
                value={order.email || "—"}
              />
              <InfoTile icon={Phone} label="Mobile" value={order.mobile} />
              <InfoTile
                icon={MapPin}
                label="Address"
                value={order.address}
                className="sm:col-span-2"
              />
            </div>
            {hasValidCoords(order.location) && (
              <a
                href={googleMapsUrl(order.location.lat, order.location.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-3 rounded-xl border bg-muted/30 p-3 transition hover:border-primary/40 hover:bg-primary/5"
              >
                <img
                  src={staticMapPreviewUrl(
                    order.location.lat,
                    order.location.lng,
                    "160x120"
                  )}
                  alt="Customer location"
                  width={96}
                  height={72}
                  className="h-[72px] w-24 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    Current location
                  </p>
                  <p className="text-sm font-medium">
                    {order.location.lat.toFixed(5)},{" "}
                    {order.location.lng.toFixed(5)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Open in Google Maps
                    <ExternalLink className="h-3 w-3" />
                  </p>
                </div>
              </a>
            )}
            {order.specialInstructions && (
              <div className="mt-3 rounded-xl border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Special instructions
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {order.specialInstructions}
                </p>
              </div>
            )}
          </section>

          <Separator />

          <section>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-primary" />
              Items ({order.items.length})
            </h4>
            <ul className="space-y-2">
              {order.items.map((item, index) => (
                <li
                  key={`${item.menuItemId}-${index}`}
                  className="flex gap-3 rounded-xl border bg-card p-3"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <MenuItemImage
                      src={item.image}
                      alt={item.name}
                      className="object-contain p-1"
                      iconClassName="h-5 w-5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {item.name}
                      </p>
                      <p className="shrink-0 text-sm font-bold text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatPrice(item.price)} × {item.quantity}
                      {item.size ? ` · ${item.size}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="text-sm font-semibold">Grand total</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </section>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={`flex gap-2.5 rounded-xl border bg-muted/30 p-3 ${className || ""}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
