import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export type SearchableSelectOption = {
  value: string
  label: string
}

type Props = {
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  id?: string
  className?: string
}

/**
 * Searchable select: trigger stays visible; option panel opens BELOW with
 * an in-panel search bar (does not cover the trigger).
 */
export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search to Select",
  emptyText = "No results found",
  disabled,
  id,
  className,
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const placePanel = () => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 6
    const maxHeight = Math.min(280, window.innerHeight - rect.bottom - gap - 12)
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(160, maxHeight),
      zIndex: 80,
    })
  }

  useEffect(() => {
    if (!open) return
    placePanel()
    const onScroll = () => placePanel()
    const onResize = () => placePanel()
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)
    const t = window.setTimeout(() => searchRef.current?.focus(), 40)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
      window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest?.("[data-searchable-select-panel]")
      ) {
        setOpen(false)
        setQuery("")
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const pick = (next: string) => {
    onValueChange(next)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30 dark:hover:bg-input/50",
          open && "border-ring ring-3 ring-ring/50"
        )}
        onClick={() => {
          if (disabled) return
          setOpen((o) => !o)
          if (open) setQuery("")
        }}
      >
        <span
          className={cn(
            "truncate text-left",
            !selected && "text-muted-foreground"
          )}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                data-searchable-select-panel
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={panelStyle}
                className="flex flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
              >
                <div className="shrink-0 border-b p-2">
                  <div className="relative">
                    <Input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="h-9 pr-9"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && filtered[0]) {
                          e.preventDefault()
                          pick(filtered[0].value)
                        }
                      }}
                    />
                    <Search className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <ul
                  id={listId}
                  role="listbox"
                  className="scrollbar-thin-theme min-h-0 flex-1 overflow-y-auto p-1"
                >
                  {filtered.length === 0 ? (
                    <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                      {emptyText}
                    </li>
                  ) : (
                    filtered.map((opt) => {
                      const active = opt.value === value
                      return (
                        <li
                          key={opt.value}
                          role="option"
                          aria-selected={active}
                        >
                          <button
                            type="button"
                            className={cn(
                              "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              active && "bg-muted"
                            )}
                            onClick={() => pick(opt.value)}
                          >
                            <span className="truncate">{opt.label}</span>
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
