import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { ScheduledSession } from "@/validation/models";
import { useQuery } from "@tanstack/react-query";

export const useActiveSession = (): ScheduledSession[] => {
  const { data: result } = useQuery({
    ...queryKeys.sessions.active,
    retry: false,
    select: (data) => {
      return data.isOk ? data.value : [];
    },
  });

  return result || [];
};
