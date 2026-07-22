import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useAvatarHistory = () => {
  return useQuery(queryKeys.avatar.history);
};
