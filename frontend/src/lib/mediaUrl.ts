import { API_URL } from "@/utils/constants"

/** API origin without `/api` — used for `/uploads/...` media */
export function getApiOrigin(): string {
  try {
    const base = API_URL.replace(/\/api\/?$/, "")
    if (base.startsWith("http")) return base.replace(/\/$/, "")
  } catch {
    /* fall through */
  }
  return "http://localhost:5000"
}

/**
 * Resolve product/media URLs for local, development, and production.
 * - Absolute CDN / Cloudinary / S3 URLs → unchanged
 * - Relative `/uploads/...` → prefixed with API origin
 * - Legacy `http://localhost:5000/...` → rewritten to current API origin
 */
export function resolveMediaUrl(
  url: string | null | undefined
): string {
  if (!url) return ""
  const trimmed = String(url).trim()
  if (!trimmed) return ""

  // Protocol-relative
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`
  }

  // Already a cloud / remote absolute URL (not localhost)
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed)
      const host = parsed.hostname.toLowerCase()
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "0.0.0.0"
      ) {
        return `${getApiOrigin()}${parsed.pathname}${parsed.search}`
      }
      return trimmed
    } catch {
      return trimmed
    }
  }

  // Relative path from local storage
  if (trimmed.startsWith("/")) {
    return `${getApiOrigin()}${trimmed}`
  }

  return trimmed
}
