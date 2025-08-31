import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { StopwatchSessionRequest } from "@/api/definitions/requests/stopwatch-session";
import {
  StopwatchSessionResponseSchema,
} from "@/api/definitions/responses/recorded-session";

const BASE_URL = "/session/stopwatch";

export const create = async (
  params: StopwatchSessionRequest["create"],
)=> {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, StopwatchSessionResponseSchema.create);
};

export const remove = async (
  params: StopwatchSessionRequest["remove"],
)=> {
  const { data } = await baseApi.delete(`${BASE_URL  }/${  params.id}`);
  return await parseResponseUnsafe(data, StopwatchSessionResponseSchema.remove);
};

export const update = async (
  params: StopwatchSessionRequest["update"],
)=> {
  const { data } = await baseApi.patch(BASE_URL, params);
  return await parseResponseUnsafe(data, StopwatchSessionResponseSchema.update);
};
