import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export const useLatestRun = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    ...queryKeys.avatar.latestRun,
    refetchInterval: (q) =>
      q.state.data?.status === "running" ? 3000 : false,
  });

  const previousStatus = useRef(query.data?.status);

  useEffect(() => {
    const prev = previousStatus.current;
    const current = query.data?.status;

    if (prev === "running" && (current === "success" || current === "failed")) {
      queryClient.invalidateQueries(queryKeys.avatar.current);
      queryClient.invalidateQueries(queryKeys.avatar.history);
      queryClient.invalidateQueries(queryKeys.avatar.runs);
      queryClient.invalidateQueries(queryKeys.avatar.recentRuns);
    }

    previousStatus.current = current;
  }, [query.data?.status, queryClient]);

  return query;
};
