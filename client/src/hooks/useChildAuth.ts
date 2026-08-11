import { useQuery } from "@tanstack/react-query";

export function useChildAuth() {
  const { data: child, isLoading, error } = useQuery({
    queryKey: ["/api/auth/child"],
    retry: false,
    // XP and points change on the PARENT's device (approvals), so the kid's
    // hero data must poll — otherwise the XP meter never moves
    staleTime: 15_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  return {
    child,
    isLoading,
    isChildAuthenticated: !!child,
    error,
  };
}