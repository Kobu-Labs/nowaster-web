import { CategoryApi, ProjectsApi, ScheduledSessionApi, StatisticsApi, TagApi, TasksApi } from "@/api";
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

const projectKeys = createQueryKeys("projects", {
  all: {
    queryFn: async () => await ProjectsApi.getProjects(),
    queryKey: null,
  },
  byId: (id: string) => ({
    queryFn: async () => await ProjectsApi.getProjectById({ id }),
    queryKey: [id],
  }),
  withTaskCount: {
    queryFn: async () => await ProjectsApi.getProjectsDetails(),
    queryKey: ["withTaskCount"],
  },
  stats: {
    queryFn: async () => await ProjectsApi.getProjectStatistics(),
    queryKey: ["stats"],
  },
  tasks: (projectId: string) => ({
    queryFn: async () =>
      await ProjectsApi.getTasksByProject({ project_id: projectId }),
    queryKey: [projectId, "tasks"],
  }),
});

const taskKeys = createQueryKeys("tasks", {
  all: {
    queryFn: async () => await TasksApi.getTasks(),
    queryKey: null,
  },
  byId: (id: string) => ({
    queryFn: async () => await TasksApi.getTaskById({ id }),
    queryKey: [id],
  }),
  stats: {
    queryFn: async () => await TasksApi.getTaskStatistics(),
    queryKey: ["stats"],
  },
});

export const queryKeys = mergeQueryKeys(
  sessionkeys,
  tagKeys,
  statisticsKeys,
  categoryKeys,
  projectKeys,
  taskKeys,
);
