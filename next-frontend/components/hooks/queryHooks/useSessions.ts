import { QueryOpts, useQueryFactory } from "@/components/hooks/queryHooks";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";

export const useSessions = (filter?: Partial<GetSessionsRequest>, opts?: QueryOpts) => {
  const { data: sessions, ...rest } = useQueryFactory(
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...queryKeys.sessions.filtered(filter || {}),
      ...opts,
    }
  );

  return { sessions, ...rest };
};
