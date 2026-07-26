import { useAppSelector } from "@/store/hooks" // ✅ NOW EXISTS

export const useAuth = () => {
  const { admin, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  )

  return { admin, isAuthenticated, isLoading, error }
}
