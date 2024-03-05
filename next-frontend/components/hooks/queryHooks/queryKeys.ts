import { CategoryApi, ScheduledSessionApi, StatisticsApi, TagApi } from "@/api";
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";
import { createQueryKeys, mergeQueryKeys } from "@lukemorales/query-key-factory";

const sessionkeys = createQueryKeys("sessions", {
  filtered: (filters?: Partial<ScheduledSessionRequest["readMany"]>) => ({
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
    queryFn: async () => await CategoryApi.getCategories(),
  },
});

export const queryKeys = mergeQueryKeys(sessionkeys, tagKeys, statisticsKeys, categoryKeys);
