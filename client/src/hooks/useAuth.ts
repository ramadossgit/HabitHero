// Enhanced useAuth hook - save this as hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/user");
        if (response.status === 401) {
          return null; // Not authenticated
        }
        if (!response.ok) {
          throw new Error(`Auth check failed: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Auth check error:", error);
        // Only return null for auth errors, throw for other errors
        if (error instanceof Error && error.message.includes('401')) {
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors or auth-related errors
      if (error?.message?.includes('401') || error?.message?.includes('Auth check failed')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // 5 minutes background refresh
  });

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API fails
    } finally {
      // Always clear cache and redirect on logout
      queryClient.clear();
      window.location.href = '/';
    }
  };

  return {
    user,
    isAuthenticated: !!user && !error,
    isLoading,
    error,
    logout,
    refetch
  };
}
