import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { ImpersonationResponseSchema } from "@/api/definitions/responses/impersonation";
import { UserSchema } from "@/api/definitions/models/user";
import { z } from "zod";

const BASE_URL = "/admin";

export const searchUsers = async (query: string, limit = 10) => {
  if (!query.trim()) { return []; }
  const { data } = await baseApi.get(`${BASE_URL}/users/search`, {
    params: { limit, q: query },
  });
  return await parseResponseUnsafe(data, z.array(UserSchema));
};

export const startImpersonation = async (userId: string) => {
  const { data } = await baseApi.post(`${BASE_URL}/impersonate/${userId}`);
  return await parseResponseUnsafe(data, ImpersonationResponseSchema.start);
};

export const stopImpersonation = async (impersonationToken: string) => {
  await baseApi.post(`${BASE_URL}/stop-impersonation`, {
    impersonation_token: impersonationToken,
  });
};

export const getUserById = async (userId: string) => {
  const { data } = await baseApi.get(`${BASE_URL}/users/${userId}`);
  return await parseResponseUnsafe(data, UserSchema);
};
