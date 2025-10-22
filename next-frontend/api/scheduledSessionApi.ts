import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type {
  ScheduledSessionRequest } from "@/api/definitions";
import {
  ScheduledSessionResponseSchema,
  ScheduledSessionWithIdSchema,
  StopwatchSessionWithIdSchema,
} from "@/api/definitions";
import { z } from "zod";

const BASE_URL = "/session/fixed";

export const create = async (
  params: ScheduledSessionRequest["create"],
) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, ScheduledSessionResponseSchema.create);
};

export const getActiveSessions = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/active`);
  return await parseResponseUnsafe(
    data,
    z.array(ScheduledSessionWithIdSchema.or(StopwatchSessionWithIdSchema)),
  );
};

export const getSessions = async (
  params?: ScheduledSessionRequest["readMany"],
) => {
  const { data } = await baseApi.post(`${BASE_URL}/filter`, params);
  return await parseResponseUnsafe(data, ScheduledSessionResponseSchema.readMany);
};

export const update = async (
  params: ScheduledSessionRequest["update"],
) => {
  const { data } = await baseApi.patch(BASE_URL, params);
  return await parseResponseUnsafe(data, ScheduledSessionResponseSchema.update);
};

export const deleteSingle = async (
  params: ScheduledSessionRequest["remove"],
) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, ScheduledSessionResponseSchema.remove);
};
