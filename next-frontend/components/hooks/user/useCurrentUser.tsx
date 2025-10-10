import { UserApi } from "@/api";
import { useAuth } from "@/app/auth-context";
import { useSuspenseQuery } from "@tanstack/react-query";

/**
 * Hook to get the current authenticated user's full profile data.
 *
 * IMPORTANT: This hook MUST be used within an authenticated context.
 * If called when user is not authenticated (e.g., during logout), it will
 * suspend indefinitely until the user is redirected.
 *
 * Returns the user data directly (non-nullable) without loading states.
 * Uses Suspense for loading - wrap the component using this hook in a Suspense boundary.
 *
 * @returns User profile data (non-nullable)
 */
export const useCurrentUser = () => {
  const { user } = useAuth();

  const { data } = useSuspenseQuery({
    queryFn: async () => {
      // If no user ID (e.g., during logout), suspend indefinitely
      // This prevents errors during the brief logout → redirect window
      if (!user?.id) {
        return new Promise(() => {}); // Never resolves - keeps suspending
      }
      return await UserApi.getCurrentUser();
    },
    queryKey: ["user", "current", user?.id],
    staleTime: Infinity,
  });

  return data;
};
