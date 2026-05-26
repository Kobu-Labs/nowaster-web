import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useLatestRun = () => {
  return useQuery({
    ...queryKeys.avatar.latestRun,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 3000 : false,
  });
};
