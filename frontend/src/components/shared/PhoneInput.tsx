import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  DEFAULT_PHONE_COUNTRY,
  filterCountries,
  sanitizeNationalNumber,
  type PhoneCountry,
} from "@/lib/phone"

type Props = {
  country: PhoneCountry
  nationalNumber: string
  onCountryChange: (country: PhoneCountry) => void
  onNationalChange: (national: string) => void
  disabled?: boolean
  id?: string
  className?: string
  error?: string
}

/**
 * Country flag + dial code searchable picker + national number input
 * limited to the selected country's mobile digit length.
 */
export function PhoneInput({
  country,
  nationalNumber,
  onCountryChange,
  onNationalChange,
  disabled,
  id,
  className,
  error,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})

  const filtered = useMemo(() => filterCountries(query), [query])

  const placePanel = () => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 6
    const maxHeight = Math.min(320, window.innerHeight - rect.bottom - gap - 12)
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + gap,
      left: rect.left,
      width: Math.max(rect.width, 280),
      maxHeight: Math.max(180, maxHeight),
      zIndex: 80,
    })
  }

  useEffect(() => {
    if (!open) return
    placePanel()
    const onScroll = () => placePanel()
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", placePanel)
    const t = window.setTimeout(() => searchRef.current?.focus(), 40)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", placePanel)
      window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        rootRef.current &&
        !rootRef.current.contains(target) &&
        !target.closest?.("[data-phone-country-panel]")
      ) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const pick = (next: PhoneCountry) => {
    onCountryChange(next)
    onNationalChange(sanitizeNationalNumber(nationalNumber, next))
    setOpen(false)
    setQuery("")
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        ref={rootRef}
        className={cn(
          "flex h-11 overflow-hidden rounded-lg border border-input bg-transparent dark:bg-input/30",
          error && "border-destructive",
          disabled && "opacity-50"
        )}
      >
        <button
          type="button"
          disabled={disabled}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 border-r px-2.5 text-sm hover:bg-muted/50"
          onClick={() => !disabled && setOpen((o) => !o)}
          aria-label="Select country code"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="font-medium tabular-nums">{country.dialCode}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          placeholder={`${country.nationalLength} digits`}
          value={nationalNumber}
          maxLength={country.nationalLength}
          onChange={(e) =>
            onNationalChange(sanitizeNationalNumber(e.target.value, country))
          }
          className="h-full flex-1 rounded-none border-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {country.name}: enter exactly {country.nationalLength} digits after{" "}
        {country.dialCode}
        {nationalNumber
          ? ` · ${nationalNumber.length}/${country.nationalLength}`
          : ""}
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                data-phone-country-panel
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={panelStyle}
                className="flex flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
              >
                <div className="shrink-0 border-b p-2">
                  <div className="relative">
                    <Input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search country or code…"
                      className="h-9 pr-9"
                    />
                    <Search className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <ul className="scrollbar-thin-theme min-h-0 flex-1 overflow-y-auto p-1">
                  {filtered.length === 0 ? (
                    <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No countries found
                    </li>
                  ) : (
                    filtered.map((c) => {
                      const active = c.iso === country.iso
                      return (
                        <li key={c.iso}>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                              active && "bg-muted"
                            )}
                            onClick={() => pick(c)}
                          >
                            <span className="text-base">{c.flag}</span>
                            <span className="min-w-0 flex-1 truncate">
                              {c.name}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {c.dialCode}
                            </span>
                            {active && (
                              <Check className="h-4 w-4 shrink-0 text-primary" />
                            )}
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}

export { DEFAULT_PHONE_COUNTRY }
