import { UserApi } from "@/api";
import { useQuery } from "@tanstack/react-query";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["user", "current"],
    queryFn: async () => await UserApi.getCurrentUser(),
  });
};
