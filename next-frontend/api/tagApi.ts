import baseApi, { handleResponse } from "@/api/baseApi";
import { Result } from "@badrap/result";
import { TagRequest, TagResponse, TagResponseSchema } from "@/api/definitions";

const BASE_URL = "/tag";

export const readMany = async (
  params?: TagRequest["readMany"],
): Promise<Result<TagResponse["readMany"]>> => {
  const { data } = await baseApi.get(BASE_URL, { params: { ...params } });
  return await handleResponse(data, TagResponseSchema.readMany);
};

export const create = async (
  params: TagRequest["create"],
): Promise<Result<TagResponse["create"]>> => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await handleResponse(data, TagResponseSchema.create);
};

export const deleteTag = async (
  params: TagRequest["deleteTag"],
): Promise<Result<TagResponse["deleteTag"]>> => {
  const { data } = await baseApi.delete(BASE_URL + "/" + params.id);
  return await handleResponse(data, TagResponseSchema.deleteTag);
};

export const addAllowedCategory = async (
  params: TagRequest["addAllowedCategory"],
): Promise<Result<TagResponse["addAllowedCategory"]>> => {
  const { data } = await baseApi.post(BASE_URL + "/category", params);
  return await handleResponse(data, TagResponseSchema.addAllowedCategory);
};

export const update = async (
  params: TagRequest["update"],
): Promise<Result<TagResponse["update"]>> => {
  const { data } = await baseApi.patch(BASE_URL + "/" + params.id, {
    label: params.label,
    color: params.color,
    allowedCategories: params.allowedCategories,
  });
  return await handleResponse(data, TagResponseSchema.addAllowedCategory);
};

export const removeAllowedCategory = async (
  params: TagRequest["removeAllowedCategory"],
): Promise<Result<TagResponse["removeAllowedCategory"]>> => {
  const { data } = await baseApi.post(BASE_URL + "/category", params);
  return await handleResponse(data, TagResponseSchema.removeAllowedCategory);
};

export const getById = async (
  params: TagRequest["getById"],
): Promise<Result<TagResponse["getById"]>> => {
  const { data } = await baseApi.get(BASE_URL + "/" + params.id);
  return await handleResponse(data, TagResponseSchema.getById);
};
