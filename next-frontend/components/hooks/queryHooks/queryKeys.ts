import { ScheduledSessionApi, StatisticsApi, TagApi } from "@/api";
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

const tagKeys = createQueryKeys("tags", {
  all: {
    queryFn: async () => await TagApi.readMany(),
    queryKey: null
  }
});

const statisticsKeys = createQueryKeys("statistics", {
  dashboard: {
    queryKey: ["dashboard"],
    queryFn: async () => await StatisticsApi.getDashboardData(),
  },
});

const categoryKeys = createQueryKeys("categories", {
  all: {
    queryKey: null,
    queryFn: async () => await ScheduledSessionApi.getCategories(),
  },
});

export const queryKeys = mergeQueryKeys(sessionkeys, tagKeys, statisticsKeys, categoryKeys);
