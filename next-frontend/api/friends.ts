import baseApi, { handleResponse } from "@/api/baseApi";
import { FriendRequest } from "@/api/definitions/requests/friends/friend";
import {
  FriendResponse,
  FriendResponseSchema,
} from "@/api/definitions/responses/friends/friend";
import { Result } from "@badrap/result";

const BASE_URL = "/friends/friend";

export const read = async (): Promise<Result<FriendResponse["read"]>> => {
  const { data } = await baseApi.get(BASE_URL);
  return await handleResponse(data, FriendResponseSchema.read);
};

export const remove = async (
  params: FriendRequest["remove"],
): Promise<Result<FriendResponse["remove"]>> => {
  const { data } = await baseApi.delete(BASE_URL, { data: { ...params } });
  return await handleResponse(data, FriendResponseSchema.remove);
};
