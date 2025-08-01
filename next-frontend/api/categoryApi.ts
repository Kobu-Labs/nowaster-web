import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { CategoryRequest, CategoryResponseSchema } from "@/api/definitions";
import { z } from "zod";

const BASE_URL = "/category";

export const getSessionCountByCategory = async () => {
  const { data } = await baseApi.get(BASE_URL + "/group-sessions");
  return await parseResponseUnsafe(
    data,
    z.array(CategoryResponseSchema.groupBySession),
  );
};

export const getCategories = async () => {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(data, CategoryResponseSchema.readMany);
};

export const create = async (params: CategoryRequest["create"]) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, CategoryResponseSchema.create);
};

export const readMany = async (params: CategoryRequest["readMany"]) => {
  const { data } = await baseApi.get(BASE_URL, { params: { ...params } });
  return await parseResponseUnsafe(data, CategoryResponseSchema.readMany);
};

export const update = async (params: CategoryRequest["update"]) => {
  const { data } = await baseApi.patch(BASE_URL, { ...params });
  return await parseResponseUnsafe(data, CategoryResponseSchema.update);
};

export const readById = async (params: CategoryRequest["readById"]) => {
  const { data } = await baseApi.get(BASE_URL + "/" + params.id);
  return await parseResponseUnsafe(data, CategoryResponseSchema.readById);
};

export const getStatistics = async () => {
  const { data } = await baseApi.get(BASE_URL + "/statistics");
  return await parseResponseUnsafe(data, CategoryResponseSchema.statistics);
};

export const deleteCategory = async (params: CategoryRequest["deleteCategory"]) => {
  const { data } = await baseApi.delete(BASE_URL + "/" + params.id);
  return await parseResponseUnsafe(data, CategoryResponseSchema.delete);
};
