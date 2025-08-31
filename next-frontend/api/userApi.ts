import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { UserRequest } from "@/api/definitions/requests/user";
import {
  UserResponseSchema,
} from "@/api/definitions/responses/user";

const BASE_URL = "/user";

export const update = async (
  params?: UserRequest["update"],
)=> {
  const { data } = await baseApi.patch(BASE_URL, params);
  return await parseResponseUnsafe(data, UserResponseSchema.update);
};

export const create = async (
  params: UserRequest["create"],
)=> {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, UserResponseSchema.create);
};

export const updateVisibility = async (
  params: UserRequest["updateVisibility"],
) => {
  const { data } = await baseApi.patch(`${BASE_URL  }/visibility`, params);
  return await parseResponseUnsafe(data, UserResponseSchema.updateVisibility);
};

export const getCurrentUser = async () => {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(data, UserResponseSchema.getProfile);
};

export const getProfile = async (
  params?: UserRequest["getProfile"],
) => {
  const { data } = await baseApi.get(`${BASE_URL  }/profile`, {
    params: params ? { id: params.id } : undefined,
  });
  return await parseResponseUnsafe(data, UserResponseSchema.getProfile);
};
