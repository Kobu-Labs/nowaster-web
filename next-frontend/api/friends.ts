import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { FriendRequest } from "@/api/definitions/requests/friends/friend";
import {
  FriendResponseSchema,
} from "@/api/definitions/responses/friends/friend";

const BASE_URL = "/friends/friend";

export const read = async ()=> {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(data, FriendResponseSchema.read);
};

export const remove = async (
  params: FriendRequest["remove"],
)=> {
  const { data } = await baseApi.delete(BASE_URL, { data: { ...params } });
  return await parseResponseUnsafe(data, FriendResponseSchema.remove);
};
