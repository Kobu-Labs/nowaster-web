import baseApi, { handleResponse } from "@/api/baseApi";
import { StopwatchSessionRequest } from "@/api/definitions/requests/stopwatch-session";
import {
  StopwatchSessionResponse,
  StopwatchSessionResponseSchema,
} from "@/api/definitions/responses/recorded-session";
import { Result } from "@badrap/result";

const BASE_URL = "/session/stopwatch";

export const create = async (
  params: StopwatchSessionRequest["create"],
): Promise<Result<StopwatchSessionResponse["create"]>> => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await handleResponse(data, StopwatchSessionResponseSchema.create);
};

export const remove = async (
  params: StopwatchSessionRequest["remove"],
): Promise<Result<StopwatchSessionResponse["remove"]>> => {
  const { data } = await baseApi.delete(BASE_URL + "/" + params.id);
  return await handleResponse(data, StopwatchSessionResponseSchema.remove);
};

export const update = async (
  params: StopwatchSessionRequest["update"],
): Promise<Result<StopwatchSessionResponse["update"]>> => {
  const { data } = await baseApi.patch(BASE_URL, params);
  return await handleResponse(data, StopwatchSessionResponseSchema.update);
};
