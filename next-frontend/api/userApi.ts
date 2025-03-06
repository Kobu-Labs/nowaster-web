import baseApi, { handleResponse } from "@/api/baseApi";
import { Result } from "@badrap/result";
import { UserRequest } from "@/api/definitions/requests/user";
import {
  UserResponse,
  UserResponseSchema,
} from "@/api/definitions/responses/user";

const BASE_URL = "/user";

export const update = async (
  params?: UserRequest["update"],
): Promise<Result<UserResponse["update"]>> => {
  const { data } = await baseApi.patch(BASE_URL, params);
  return await handleResponse(data, UserResponseSchema.update);
};

export const create = async (
  params: UserRequest["create"],
): Promise<Result<UserResponse["create"]>> => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await handleResponse(data, UserResponseSchema.create);
};
