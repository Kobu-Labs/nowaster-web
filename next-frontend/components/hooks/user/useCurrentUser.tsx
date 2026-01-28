import { UserApi } from "@/api";
import { useAuth } from "@/components/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to get the current authenticated user's full profile data.
 *
 * IMPORTANT: This hook MUST be used within a route protected by AuthGuard.
 * It assumes the user is authenticated and will throw an error if not.
 *
 * Immediately returns basic user data (id, username, role) from auth state,
 * then silently upgrades to the full profile (including avatarUrl, visibilityFlags)
 * once the background fetch completes. No loading states or Suspense needed.
 */
export const useCurrentUser = () => {
  const { user } = useAuth();

  if (!user?.id) {
    throw new Error(
      "useCurrentUser called without authenticated user. "
      + "Make sure this component is wrapped in AuthGuard.",
    );
  }

  const { data } = useQuery({
    initialData: { id: user.id, role: user.role, username: user.username },
    initialDataUpdatedAt: 0,
    queryFn: async () => await UserApi.getCurrentUser(),
    queryKey: ["user", "current", user.id],
    staleTime: Infinity,
  });

  return data;
};
