import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useLatestRun = () => {
  return useQuery(queryKeys.avatar.latestRun);
};
