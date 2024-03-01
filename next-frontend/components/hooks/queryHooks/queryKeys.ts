import { ScheduledSessionApi } from "@/api";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { createQueryKeys, mergeQueryKeys } from "@lukemorales/query-key-factory";

const sessionkeys = createQueryKeys("sessions", {
  filtered: (filters?: Partial<GetSessionsRequest>) => ({
    queryKey: [filters ?? {}],
    queryFn: async () => await ScheduledSessionApi.getSessions(filters),
  }),
  active: {
    queryKey: ["active"],
    queryFn: async () => await ScheduledSessionApi.getActiveSessions(),
  },
});

export const queryKeys = mergeQueryKeys(sessionkeys);
