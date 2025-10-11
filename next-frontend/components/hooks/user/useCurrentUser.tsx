import { UserApi } from "@/api";
import { useAuth } from "@/components/hooks/useAuth";
import { useSuspenseQuery } from "@tanstack/react-query";

/**
 * Hook to get the current authenticated user's full profile data.
 *
 * IMPORTANT: This hook MUST be used within a route protected by AuthGuard.
 * It assumes the user is authenticated and will throw an error if not.
 *
 * Returns the user data directly (non-nullable) without loading states.
 * Uses Suspense for loading - wrap the component using this hook in a Suspense boundary.
 *
 * @throws Error if user is not authenticated (should never happen with AuthGuard)
 * @returns User profile data (non-nullable)
 */
export const useCurrentUser = () => {
  const { user } = useAuth();

  // This should never happen if AuthGuard is properly protecting the route
  if (!user?.id) {
    throw new Error(
      "useCurrentUser called without authenticated user. " +
      "Make sure this component is wrapped in AuthGuard."
    );
  }

  const { data } = useSuspenseQuery({
    queryFn: async () => await UserApi.getCurrentUser(),
    queryKey: ["user", "current", user.id],
    staleTime: Infinity,
  });

  return data;
};
