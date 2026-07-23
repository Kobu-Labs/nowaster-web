import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { CommunityRequest } from "@/api/definitions";
import { CommunityResponseSchema } from "@/api/definitions";

const BASE_URL = "/community";

export const listMine = async () => {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(data, CommunityResponseSchema.listMine);
};

export const getById = async (params: CommunityRequest["getById"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.getById);
};

export const create = async (params: CommunityRequest["create"]) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, CommunityResponseSchema.create);
};

export const update = async (params: CommunityRequest["update"]) => {
  const { data } = await baseApi.patch(`${BASE_URL}/${params.id}`, params);
  return await parseResponseUnsafe(data, CommunityResponseSchema.update);
};

export const archive = async (params: CommunityRequest["archive"]) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.archive);
};
