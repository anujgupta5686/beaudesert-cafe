import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000,
      gcTime: 10 * 60_000,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

export const queryKeys = {
  menu: {
    all: ["menu"] as const,
    list: (opts?: { includeUnavailable?: boolean }) =>
      ["menu", "list", opts ?? {}] as const,
    detail: (id: string) => ["menu", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (all?: boolean) => ["categories", "list", { all: !!all }] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (params: Record<string, unknown>) =>
      ["orders", "list", params] as const,
  },
  cafeSettings: {
    all: ["cafe-settings"] as const,
  },
  contact: {
    messages: (page: number) => ["contact", "messages", page] as const,
  },
  feedback: {
    analytics: ["feedback", "analytics"] as const,
  },
  customers: {
    count: ["customers", "count"] as const,
  },
}
