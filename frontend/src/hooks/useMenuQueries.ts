import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "@/api/axios"
import { queryKeys } from "@/lib/queryClient"
import type { Category, MenuItem } from "@/types"

export function useMenuQuery(options?: { includeUnavailable?: boolean }) {
  return useQuery({
    queryKey: queryKeys.menu.list(options),
    queryFn: async () => {
      const params = options?.includeUnavailable
        ? { includeUnavailable: "true" }
        : undefined
      const res = await axios.get("/menu", { params })
      return (res.data.data || []) as MenuItem[]
    },
  })
}

export function useCategoriesQuery(all = false) {
  return useQuery({
    queryKey: queryKeys.categories.list(all),
    queryFn: async () => {
      const res = await axios.get("/categories", {
        params: all ? { all: "true" } : undefined,
      })
      return (res.data.data || []) as Category[]
    },
  })
}

export function useCreateProductMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: FormData) => {
      const res = await axios.post("/menu", data)
      return res.data.data as MenuItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.all })
    },
  })
}

export function useUpdateProductMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const res = await axios.put(`/menu/${id}`, data)
      return res.data.data as MenuItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.all })
    },
  })
}

export function useDeleteProductMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/menu/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.all })
    },
  })
}

export function useCreateComboMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: FormData) => {
      const res = await axios.post("/menu/combo", data)
      return res.data.data as MenuItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.all })
    },
  })
}

export function useUpdateComboMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const res = await axios.put(`/menu/combo/${id}`, data)
      return res.data.data as MenuItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.all })
    },
  })
}

export function useCafeSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.cafeSettings.all,
    queryFn: async () => {
      const res = await axios.get("/cafe-settings")
      return res.data.data
    },
  })
}
