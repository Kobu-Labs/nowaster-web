import baseApi, { handleResponse } from "@/api/baseApi";
import { Result } from "@badrap/result";
import { FriendRequestRequest } from "@/api/definitions/requests/friends/friend-request";
import {
  FriendRequestResponse,
  FriendRequestResponseSchema,
} from "@/api/definitions/responses/friends/friend-request";

const BASE_URL = "/friends/request";

export const update = async (
  params: FriendRequestRequest["update"],
): Promise<Result<FriendRequestResponse["update"]>> => {
  const { data } = await baseApi.patch(BASE_URL, params);
  return await handleResponse(data, FriendRequestResponseSchema.update);
};

export const create = async (
  params: FriendRequestRequest["create"],
): Promise<Result<FriendRequestResponse["create"]>> => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await handleResponse(data, FriendRequestResponseSchema.create);
};

export const read = async (
  params: FriendRequestRequest["read"],
): Promise<Result<FriendRequestResponse["read"]>> => {
  const { data } = await baseApi.get(BASE_URL, { params: { ...params } });
  return await handleResponse(data, FriendRequestResponseSchema.read);
};
