import { useQuery } from "@tanstack/react-query";

export function useChildAuth() {
  const { data: child, isLoading, error } = useQuery({
    queryKey: ["/api/auth/child"],
    retry: false,
  });

  return {
    child,
    isLoading,
    isChildAuthenticated: !!child,
    error,
  };
}