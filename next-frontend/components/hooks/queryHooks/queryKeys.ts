import { CategoryApi, ScheduledSessionApi, StatisticsApi, TagApi } from "@/api";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import {
  createQueryKeys,
  mergeQueryKeys,
} from "@lukemorales/query-key-factory";

import { translateFilterPrecursor } from "@/lib/utils";

const sessionkeys = createQueryKeys("sessions", {
  filtered: (precursor?: SessionFilterPrecursor) => ({
    queryKey: [precursor ?? {}],
    queryFn: async () => {
      const filter = translateFilterPrecursor(precursor);
      return await ScheduledSessionApi.getSessions(filter);
    },
  }),
  active: {
    queryKey: ["active"],
    queryFn: async () => await ScheduledSessionApi.getActiveSessions(),
  },
});

const tagKeys = createQueryKeys("tags", {
  all: {
    queryFn: async () => await TagApi.readMany(),
    queryKey: null,
  },
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
  byId: (id: string) => ({
    queryKey: [id],
    queryFn: async () => await CategoryApi.readById({ id: id }),
  }),
});

export const queryKeys = mergeQueryKeys(
  sessionkeys,
  tagKeys,
  statisticsKeys,
  categoryKeys,
);
