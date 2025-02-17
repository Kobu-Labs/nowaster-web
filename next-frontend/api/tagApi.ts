import baseApi, { handleResponse } from "@/api/baseApi";
import { Result } from "@badrap/result";
import {
  TagRequest,
  TagResponse,
  TagResponseSchema,
} from "@/api/definitions";


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

export const addAllowedCategory = async (
  params: TagRequest["addAllowedCategory"],
): Promise<Result<TagResponse["addAllowedCategory"]>> => {
  const { data } = await baseApi.post(BASE_URL + "/category", params);
  return await handleResponse(data, TagResponseSchema.addAllowedCategory);
};

export const removeAllowedCategory = async (
  params: TagRequest["removeAllowedCategory"],
): Promise<Result<TagResponse["removeAllowedCategory"]>> => {
  const { data } = await baseApi.post(BASE_URL + "/category", params);
  return await handleResponse(data, TagResponseSchema.removeAllowedCategory);
};
