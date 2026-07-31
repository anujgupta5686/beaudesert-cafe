import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  googleAddressEmbedUrl,
  googleMapsAddressUrl,
  googleMapsUrl,
  hasValidCoords,
  osmEmbedUrl,
} from "@/lib/maps"

type Props = {
  location?: { lat?: number | null; lng?: number | null } | null
  address?: string
  /** pixel size of the square thumb */
  size?: number
  className?: string
  /** larger preview for order details */
  variant?: "thumb" | "card"
}

/**
 * Square map preview for admin Orders table / order details.
 * Uses OSM embed iframe (reliable). Falls back to address embed or pin.
 */
export function LocationMapThumb({
  location,
  address,
  size = 48,
  className,
  variant = "thumb",
}: Props) {
  const coords = hasValidCoords(location) ? location : null
  const href = coords
    ? googleMapsUrl(coords.lat, coords.lng)
    : address?.trim()
      ? googleMapsAddressUrl(address.trim())
      : null

  const embedSrc = coords
    ? osmEmbedUrl(coords.lat, coords.lng)
    : address?.trim()
      ? googleAddressEmbedUrl(address.trim())
      : null

  if (!href || !embedSrc) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-dashed bg-muted/40 text-muted-foreground",
          className
        )}
        style={
          variant === "thumb"
            ? { width: size, height: size }
            : undefined
        }
        title="No location"
      >
        <MapPin className="h-4 w-4 opacity-50" />
      </span>
    )
  }

  if (variant === "card") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-stretch gap-3 overflow-hidden rounded-xl border bg-muted/30 transition hover:border-primary/40 hover:bg-primary/5",
          className
        )}
        title="Open in Google Maps"
      >
        <div className="relative h-[88px] w-[120px] shrink-0 overflow-hidden bg-muted">
          <iframe
            title="Order location map"
            src={embedSrc}
            className="pointer-events-none absolute inset-0 h-full w-full border-0 scale-[1.35] origin-center"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <span className="absolute bottom-1 right-1 rounded bg-background/90 px-1 py-0.5 text-[9px] font-medium shadow">
            Map
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-3">
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="truncate text-sm font-medium">
            {coords
              ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
              : address}
          </p>
          <p className="mt-1 text-xs font-medium text-primary">
            Open in Google Maps →
          </p>
        </div>
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Google Maps"
      className={cn(
        "relative inline-flex overflow-hidden rounded-md border border-primary/30 bg-muted shadow-sm transition hover:border-primary hover:ring-2 hover:ring-primary/25",
        className
      )}
      style={{ width: size, height: size }}
    >
      <iframe
        title="Order location"
        src={embedSrc}
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.8] origin-center border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <span className="absolute inset-x-0 bottom-0 bg-background/80 py-0.5 text-center text-[8px] font-semibold leading-none text-foreground">
        Map
      </span>
    </a>
  )
}
