import { UserApi } from "@/api";
import { useQuery } from "@tanstack/react-query";

export const useCurrentUser = () => {
  return useQuery({
    queryFn: async () => await UserApi.getCurrentUser(),
    queryKey: ["user", "current"],
  });
};
