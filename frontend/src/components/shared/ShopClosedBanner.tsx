import { AlertTriangle } from "lucide-react"
import { useCafeSettingsQuery } from "@/hooks/useMenuQueries"

export function ShopClosedBanner() {
  const { data: settings } = useCafeSettingsQuery()

  if (!settings?.isTemporarilyClosed) return null

  const from = settings.closedFrom
    ? new Date(settings.closedFrom).toLocaleDateString("en-US", {
        dateStyle: "medium",
      })
    : null
  const to = settings.closedTo
    ? new Date(settings.closedTo).toLocaleDateString("en-US", {
        dateStyle: "medium",
      })
    : null

  const range =
    from && to ? ` from ${from} to ${to}` : from ? ` from ${from}` : ""

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-center text-sm text-amber-950 dark:text-amber-100">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p>
          <span className="font-semibold">Temporarily closed{range}.</span>{" "}
          {settings.closureMessage ||
            "We are temporarily closed. Thank you for your patience."}
        </p>
      </div>
    </div>
  )
}
