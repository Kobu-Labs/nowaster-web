import { CategoryApi, ScheduledSessionApi, StatisticsApi, TagApi } from "@/api";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import {
  createQueryKeys,
  mergeQueryKeys,
} from "@lukemorales/query-key-factory";

import { translateFilterPrecursor } from "@/lib/utils";

const sessionkeys = createQueryKeys("sessions", {
  active: {
    queryFn: async () => await ScheduledSessionApi.getActiveSessions(),
    queryKey: ["active"],
  },
  filtered: (precursor?: SessionFilterPrecursor) => ({
    queryFn: async () => {
      const filter = translateFilterPrecursor(precursor);
      return await ScheduledSessionApi.getSessions(filter);
    },
    queryKey: [precursor ?? {}],
  }),
});

const tagKeys = createQueryKeys("tags", {
  all: {
    queryFn: async () => await TagApi.readMany(),
    queryKey: null,
  },
  byId: (id: string) => ({
    queryFn: async () => await TagApi.getById({ id }),
    queryKey: [id],
  }),
});

const statisticsKeys = createQueryKeys("statistics", {
  dashboard: {
    queryFn: async () => await StatisticsApi.getDashboardData(),
    queryKey: ["dashboard"],
  },
});

const categoryKeys = createQueryKeys("categories", {
  all: {
    queryFn: async () => await CategoryApi.getSessionCountByCategory(),
    queryKey: null,
  },
  byId: (id: string) => ({
    queryFn: async () => await CategoryApi.readById({ id }),
    queryKey: [id],
  }),
});

export const queryKeys = mergeQueryKeys(
  sessionkeys,
  tagKeys,
  statisticsKeys,
  categoryKeys,
);
