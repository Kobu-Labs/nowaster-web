import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

export const useActiveSessions = () => {
  const query = useQuery({
    ...queryKeys.sessions.active,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return query;
};
