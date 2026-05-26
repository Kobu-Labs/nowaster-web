import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useAvatar = () => {
  return useQuery(queryKeys.avatar.current);
};
