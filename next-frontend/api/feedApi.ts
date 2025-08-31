import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { FeedResponseSchema } from "@/api/definitions/responses/feed";
import type {
  CreateFeedReactionRequest,
  FeedQueryRequest,
  RemoveFeedReactionRequest,
  UnsubscribeRequest,
  UpdateFeedSubscriptionRequest,
} from "@/api/definitions/requests/feed";

const BASE_URL = "/feed";

export const getFeed = async (params?: FeedQueryRequest) => {
  const { data } = await baseApi.get(BASE_URL, {
    params,
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

export const getSubscriptions = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/subscriptions`);
  return await parseResponseUnsafe(data, FeedResponseSchema.getSubscriptions);
};

export const updateSubscription = async (params: UpdateFeedSubscriptionRequest) => {
  const { data } = await baseApi.post(`${BASE_URL}/subscriptions`, params);
  return await parseResponseUnsafe(data, FeedResponseSchema.updateSubscription);
};

export const unsubscribe = async (params: UnsubscribeRequest) => {
  const { data } = await baseApi.post(`${BASE_URL}/subscriptions/unsubscribe`, params);
  return await parseResponseUnsafe(data, FeedResponseSchema.unsubscribe);
};
