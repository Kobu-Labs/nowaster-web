import {
  AvatarApi,
  CategoryApi,
  CommunityApi,
  ProjectsApi,
  ScheduledSessionApi,
  StatisticsApi,
  TagApi,
  TasksApi,
} from "@/api";
import type { CommunityRequest } from "@/api/definitions";
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

const communityKeys = createQueryKeys("communities", {
  mine: {
    queryFn: async () => await CommunityApi.listMine(),
    queryKey: ["mine"],
  },
  byId: (id: string) => ({
    queryFn: async () => await CommunityApi.getById({ id }),
    queryKey: [id],
  }),
  members: (communityId: string) => ({
    queryFn: async () => await CommunityApi.listMembers({ communityId }),
    queryKey: [communityId, "members"],
  }),
  capabilities: (communityId: string) => ({
    queryFn: async () => await CommunityApi.getCapabilities({ communityId }),
    queryKey: [communityId, "capabilities"],
  }),
  invites: (communityId: string) => ({
    queryFn: async () => await CommunityApi.listCommunityInvites({ communityId }),
    queryKey: [communityId, "invites"],
  }),
  inbox: {
    queryFn: async () => await CommunityApi.listIncomingInvites(),
    queryKey: ["invite-inbox"],
  },
  joinPreview: (code: string) => ({
    queryFn: async () => await CommunityApi.previewByInviteCode({ code }),
    queryKey: ["join-preview", code],
  }),
  trackedCategories: (communityId: string) => ({
    queryFn: async () =>
      await CommunityApi.listTrackedCategories({ communityId }),
    queryKey: [communityId, "tracked-categories"],
  }),
  myMappings: (communityId: string) => ({
    queryFn: async () => await CommunityApi.listMyMappings({ communityId }),
    queryKey: [communityId, "my-mappings"],
  }),
  dashboard: (communityId: string) => ({
    queryFn: async () => await CommunityApi.getDashboard({ communityId }),
    queryKey: [communityId, "dashboard"],
  }),
  discover: (params: CommunityRequest["discoverCommunities"]) => ({
    queryFn: async () => await CommunityApi.discoverCommunities(params),
    queryKey: [params],
  }),
  categoryAutocomplete: (prefix: string) => ({
    queryFn: async () => await CommunityApi.autocompleteCategories({ prefix }),
    queryKey: [prefix],
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
  details: {
    queryFn: async () => await ProjectsApi.getProjectsDetails(),
    queryKey: ["details"],
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

const avatarKeys = createQueryKeys("avatar", {
  categoryHints: (categoryId: string) => ({
    queryFn: async () =>
      await AvatarApi.listCategoryHints({ categoryId }),
    queryKey: [categoryId, "hints"],
  }),
  current: {
    queryFn: async () => await AvatarApi.getAvatar(),
    queryKey: null,
  },
  history: {
    queryFn: async () => await AvatarApi.listHistory(),
    queryKey: ["history"],
  },
  hints: (q: string) => ({
    queryFn: async () => await AvatarApi.searchHints({ q }),
    queryKey: [q],
  }),
  latestRun: {
    queryFn: async () => await AvatarApi.getLatestRun(),
    queryKey: ["latestRun"],
  },
  presets: {
    queryFn: async () => await AvatarApi.listPresets(),
    queryKey: ["presets"],
  },
  presetsAll: {
    queryFn: async () => await AvatarApi.adminListAllPresets(),
    queryKey: ["presetsAll"],
  },
  playgroundData: (userId: string, weeks: number) => ({
    queryFn: async () => await AvatarApi.adminGetPlaygroundData(userId, weeks),
    queryKey: [userId, weeks, "playgroundData"],
  }),
  recentRuns: {
    queryFn: async () => await AvatarApi.adminListRecentRuns(),
    queryKey: ["recentRuns"],
  },
  runs: {
    queryFn: async () => await AvatarApi.listRuns(),
    queryKey: ["runs"],
  },
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
  avatarKeys,
  sessionkeys,
  tagKeys,
  statisticsKeys,
  categoryKeys,
  communityKeys,
  projectKeys,
  taskKeys,
);
