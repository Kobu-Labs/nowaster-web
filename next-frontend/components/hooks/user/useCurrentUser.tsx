import { UserApi } from "@/api";
import { useAuth } from "@/app/auth-context";
import { useQuery } from "@tanstack/react-query";

export const useCurrentUser = () => {
  const { user } = useAuth();

  return useQuery({
    queryFn: async () => await UserApi.getCurrentUser(),
    queryKey: ["user", "current", user?.id],
    enabled: !!user?.id, // only fetch when authenticated
    staleTime: Infinity,
  });
};
