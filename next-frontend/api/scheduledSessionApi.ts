import baseApi, { handleResponse } from "@/api/baseApi";
import { Result } from "@badrap/result";
import {
  ScheduledSessionRequest,
  ScheduledSessionResponse,
  ScheduledSessionResponseSchema,
  ScheduledSessionWithId,
  ScheduledSessionWithIdSchema,
} from "@/api/definitions";
import { z } from "zod";

const BASE_URL = "/session";

export const create = async (
  params: ScheduledSessionRequest["create"]
): Promise<Result<ScheduledSessionResponse["create"]>> => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await handleResponse(data, ScheduledSessionResponseSchema.create);
};

export const getActiveSessions = async (): Promise<
    Result<ScheduledSessionWithId[]>
> => {
  const { data } = await baseApi.get(BASE_URL + "/active");
  //TODO: extract this to /api/definitions as a separate response
  return await handleResponse(data, z.array(ScheduledSessionWithIdSchema));
};

export const getSessions = async (
  params?: ScheduledSessionRequest["readMany"]
): Promise<Result<ScheduledSessionResponse["readMany"]>> => {
  const { data } = await baseApi.post(BASE_URL + "/filter", params);
  return await handleResponse(data, ScheduledSessionResponseSchema.readMany);
};

export const update = async (
  params: ScheduledSessionRequest["update"]
): Promise<Result<ScheduledSessionResponse["update"]>> => {
  const { data } = await baseApi.put(BASE_URL, { ...params });
  return await handleResponse(data, ScheduledSessionResponseSchema.update);
};

export const deleteSingle = async (
  params: ScheduledSessionRequest["remove"]
): Promise<Result<ScheduledSessionResponse["remove"]>> => {
  const { data } = await baseApi.delete(BASE_URL, {
    data: params,
  });
  return await handleResponse(data, ScheduledSessionResponseSchema.remove);
};
