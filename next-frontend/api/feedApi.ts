import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { FeedResponseSchema } from "@/api/definitions/responses/feed";
import { 
  FeedQueryRequest, 
  CreateFeedReactionRequest, 
  RemoveFeedReactionRequest 
} from "@/api/definitions/requests/feed";

const BASE_URL = "/feed";

export const getFeed = async (params?: FeedQueryRequest) => {
  const { data } = await baseApi.get(BASE_URL, { 
    params: params 
  });
  return await parseResponseUnsafe(data, FeedResponseSchema.getFeed);
};

export const addReaction = async (params: CreateFeedReactionRequest) => {
  const { data } = await baseApi.post(`${BASE_URL}/reaction`, params);
  return await parseResponseUnsafe(data, FeedResponseSchema.addReaction);
};

export const removeReaction = async (params: RemoveFeedReactionRequest) => {
  const { data } = await baseApi.post(`${BASE_URL}/reaction/remove`, params);
  return await parseResponseUnsafe(data, FeedResponseSchema.removeReaction);
};