/** Google Maps link for a lat/lng pin */
export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

/** Google Maps search by address text */
export function googleMapsAddressUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}`
}

/**
 * OpenStreetMap embed URL (no API key).
 * Works in iframes — staticmap.openstreetmap.de is unreliable/down.
 */
export function osmEmbedUrl(lat: number, lng: number, delta = 0.008): string {
  const left = lng - delta
  const right = lng + delta
  const top = lat + delta
  const bottom = lat - delta
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`
}

/** Google Maps embed (fallback / address-based) */
export function googleEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
}

export function googleAddressEmbedUrl(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`
}

export function hasValidCoords(
  location?: { lat?: number | null; lng?: number | null } | null
): location is { lat: number; lng: number } {
  return (
    !!location &&
    typeof location.lat === "number" &&
    typeof location.lng === "number" &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  )
}
