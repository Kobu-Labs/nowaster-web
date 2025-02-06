import { ScheduledSessionWithId } from "@/api/definitions";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

export const useActiveSession = (): ScheduledSessionWithId[] => {
  const { data: result } = useQuery({
    ...queryKeys.sessions.active,
    retry: false,
    select: (data) => {
      return data.isOk ? data.value : [];
    },
  });

  return result ?? [];
};
