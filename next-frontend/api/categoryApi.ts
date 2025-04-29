import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { CategoryRequest, CategoryResponseSchema } from "@/api/definitions";

const BASE_URL = "/category";

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
