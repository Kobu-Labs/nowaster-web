import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { UserRequest } from "@/api/definitions/requests/user";
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
