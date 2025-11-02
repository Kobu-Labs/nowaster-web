import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { TaskRequest } from "@/api/definitions";
import { TaskResponseSchema } from "@/api/definitions";

const BASE_URL = "/task";

export const getTasks = async (params?: TaskRequest["readMany"]) => {
  const { data } = await baseApi.get(BASE_URL, { params: { ...params } });
  return await parseResponseUnsafe(data, TaskResponseSchema.readMany);
};

export const getTaskById = async (params: TaskRequest["readById"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, TaskResponseSchema.readById);
};

export const createTask = async (params: TaskRequest["create"]) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, TaskResponseSchema.create);
};

export const updateTask = async (params: TaskRequest["update"]) => {
  const { data } = await baseApi.patch(BASE_URL, { ...params });
  return await parseResponseUnsafe(data, TaskResponseSchema.update);
};

export const deleteTask = async (params: TaskRequest["deleteTask"]) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, TaskResponseSchema.delete);
};

export const getTasksWithSessionCount = async (params?: TaskRequest["details"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/details`, { params: { ...params } });
  return await parseResponseUnsafe(data, TaskResponseSchema.details);
};

export const getTaskStatistics = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/statistics`);
  return await parseResponseUnsafe(data, TaskResponseSchema.statistics);
};
