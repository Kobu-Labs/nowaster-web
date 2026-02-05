import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { ProjectRequest } from "@/api/definitions";
import { ProjectResponseSchema } from "@/api/definitions";

const BASE_URL = "/project";

export const getProjects = async (params?: ProjectRequest["readMany"]) => {
  const { data } = await baseApi.get(BASE_URL, { params: { ...params } });
  return await parseResponseUnsafe(data, ProjectResponseSchema.readMany);
};

export const getProjectById = async (params: ProjectRequest["readById"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, ProjectResponseSchema.readById);
};

export const createProject = async (params: ProjectRequest["create"]) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, ProjectResponseSchema.create);
};

export const updateProject = async (params: ProjectRequest["update"]) => {
  const { data } = await baseApi.patch(BASE_URL, { ...params });
  return await parseResponseUnsafe(data, ProjectResponseSchema.update);
};

export const deleteProject = async (
  params: ProjectRequest["deleteProject"],
) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, ProjectResponseSchema.delete);
};

export const getProjectsDetails = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/details`);
  return await parseResponseUnsafe(data, ProjectResponseSchema.details);
};

export const getProjectStatistics = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/statistics`);
  return await parseResponseUnsafe(data, ProjectResponseSchema.statistics);
};

export const getTasksByProject = async (
  params: ProjectRequest["getTasksByProject"],
) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.project_id}/tasks`);
  return await parseResponseUnsafe(
    data,
    ProjectResponseSchema.getTasksByProject,
  );
};
