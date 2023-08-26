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
  GetSessionResponse,
  getSessionResponseSchema,
  UpdateScheduledSessionResponse,
  updateScheduledSessionResponseSchema,
} from "@/validation/responses/scheduledSession";
import { Result } from "@badrap/result"


export const create = async (params: CreateScheduledSessionRequest): Promise<Result<CreateScheduledSessionResponse>> => {
  const { data } = await baseApi.post(
    "scheduled/",
    params
  );
  return await handleResponse(data, createScheduledSessionResponseSchema)
};

export const getSessions = async (params?: GetSessionsRequest): Promise<Result<GetSessionResponse>> => {
  const { data } = await baseApi.get(
    "scheduled/", { params: {...params} }
  );
  return await handleResponse(data, getSessionResponseSchema)
};

export const update = async (params: UpdateScheduledSessionRequest): Promise<Result<UpdateScheduledSessionResponse>> => {
  const { data } = await baseApi.put("scheduled/", { ...params })
  return await handleResponse(data, updateScheduledSessionResponseSchema)
}

export const deleteSingle = async (params: DeleteScheduledSessionRequest): Promise<Result<DeleteScheduledSessionResponse>> => {
  const { data } = await baseApi.delete("scheduled/", { data: params });
  return await handleResponse(data, deleteScheduledSessionResponseSchema)
}
