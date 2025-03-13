import baseApi, { handleResponse } from "@/api/baseApi";
import { Result } from "@badrap/result";
import {
  CategoryRequest,
  CategoryResponse,
  CategoryResponseSchema,
} from "@/api/definitions";

const BASE_URL = "/category";

export const getCategories = async (): Promise<
  Result<CategoryResponse["readMany"]>
> => {
  const { data } = await baseApi.get(BASE_URL);
  return await handleResponse(data, CategoryResponseSchema.readMany);
};

export const create = async (
  params: CategoryRequest["create"],
): Promise<Result<CategoryResponse["create"]>> => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await handleResponse(data, CategoryResponseSchema.create);
};

export const readMany = async (
  params: CategoryRequest["readMany"],
): Promise<Result<CategoryResponse["readMany"]>> => {
  const { data } = await baseApi.get(BASE_URL, { params: { ...params } });
  return await handleResponse(data, CategoryResponseSchema.readMany);
};

export const update = async (
  params: CategoryRequest["update"],
): Promise<Result<CategoryResponse["update"]>> => {
  const { data } = await baseApi.patch(BASE_URL, { ...params });
  return await handleResponse(data, CategoryResponseSchema.update);
};

export const readById = async (
  params: CategoryRequest["readById"],
): Promise<Result<CategoryResponse["readById"]>> => {
  const { data } = await baseApi.get(BASE_URL + "/" + params.id);
  return await handleResponse(data, CategoryResponseSchema.readById);
};
