import { UserApi } from "@/api";
import { useAuth } from "@/app/auth-context";
import { useSuspenseQuery } from "@tanstack/react-query";

/**
 * Hook to get the current authenticated user's full profile data.
 *
 * IMPORTANT: This hook MUST be used within an authenticated context.
 * It will throw an error if called when the user is not authenticated.
 *
 * Returns the user data directly (non-nullable) without loading states.
 * Uses Suspense for loading - wrap the component using this hook in a Suspense boundary.
 *
 * @throws Error if used outside authenticated context
 * @returns User profile data (non-nullable)
 */
export const useCurrentUser = () => {
  const { user } = useAuth();

  // Guard: must be used in authenticated context
  if (!user?.id) {
    throw new Error(
      "useCurrentUser() must be used within an authenticated context. " +
      "Make sure the user is logged in before using this hook."
    );
  }

  const { data } = useSuspenseQuery({
    queryFn: async () => await UserApi.getCurrentUser(),
    queryKey: ["user", "current", user.id],
    staleTime: Infinity,
  });

  return data;
};
