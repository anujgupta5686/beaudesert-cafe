/** Google Maps link for a lat/lng pin */
export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

/** Small static map preview (OpenStreetMap — no API key) */
export function staticMapPreviewUrl(
  lat: number,
  lng: number,
  size = "120x120"
): string {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=${size}&markers=${lat},${lng},red-pushpin`
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
