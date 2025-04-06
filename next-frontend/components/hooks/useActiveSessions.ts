import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

export const useActiveSessions = () => {
  const query = useQuery({
    ...queryKeys.sessions.active,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }

      return data.value;
    },
  });

  return query;
};
