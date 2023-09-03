import baseApi, { handleResponse } from "./baseApi";

import {
  CreateScheduledSessionRequest,
  GetSessionsRequest,
  UpdateScheduledSessionRequest,
  DeleteScheduledSessionRequest,
} from "@/validation/requests/scheduledSession"

import {
  CreateScheduledSessionResponse,
  createScheduledSessionResponseSchema,
  DeleteScheduledSessionResponse,
  deleteScheduledSessionResponseSchema,
  GetCategoriesReponse,
  getCategoriesResponseSchema,
  GetSessionResponse,
  getSessionResponseSchema,
  UpdateScheduledSessionResponse,
  updateScheduledSessionResponseSchema,
} from "@/validation/responses/scheduledSession";
import { Result } from "@badrap/result"

const BASE_URL = "scheduled/"

export const create = async (params: CreateScheduledSessionRequest): Promise<Result<CreateScheduledSessionResponse>> => {
  const { data } = await baseApi.post(
    BASE_URL,
    params
  );
  return await handleResponse(data, createScheduledSessionResponseSchema)
};

export const getSessions = async (params?: GetSessionsRequest): Promise<Result<GetSessionResponse>> => {
  const { data } = await baseApi.get(
    BASE_URL + "sessions/", { params: { ...params } }
  );
  return await handleResponse(data, getSessionResponseSchema)
};

export const update = async (params: UpdateScheduledSessionRequest): Promise<Result<UpdateScheduledSessionResponse>> => {
  const { data } = await baseApi.put(BASE_URL + "sessions/", { ...params })
  return await handleResponse(data, updateScheduledSessionResponseSchema)
}

export const deleteSingle = async (params: DeleteScheduledSessionRequest): Promise<Result<DeleteScheduledSessionResponse>> => {
  const { data } = await baseApi.delete(BASE_URL + "sessions/", { data: params });
  return await handleResponse(data, deleteScheduledSessionResponseSchema)
}

export const getCategories = async (): Promise<Result<GetCategoriesReponse>> => {
  const { data } = await baseApi.get(BASE_URL + "/categories")
  return await handleResponse(data, getCategoriesResponseSchema)
}
