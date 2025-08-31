import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { FriendRequestRequest } from "@/api/definitions/requests/friends/friend-request";
import {
  FriendRequestResponseSchema,
} from "@/api/definitions/responses/friends/friend-request";

const BASE_URL = "/friends/request";

export const update = async (
  params: FriendRequestRequest["update"],
) => {
  const { data } = await baseApi.patch(BASE_URL, params);
  return await parseResponseUnsafe(data, FriendRequestResponseSchema.update);
};

export const create = async (
  params: FriendRequestRequest["create"],
) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, FriendRequestResponseSchema.create);
};

export const read = async (
  params: FriendRequestRequest["read"],
) => {
  const { data } = await baseApi.get(BASE_URL, { params: { ...params } });
  return await parseResponseUnsafe(data, FriendRequestResponseSchema.read);
};
