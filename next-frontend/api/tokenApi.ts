import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { TokenResponseSchema } from "@/api/definitions/responses/token";
import type { TokenRequest } from "@/api/definitions/requests/token";

const BASE_URL = "/auth/tokens";

export const listTokens = async () => {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(data, TokenResponseSchema.list);
};

export const createToken = async (params: TokenRequest["create"]) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, TokenResponseSchema.create);
};

export const revokeToken = async (tokenId: string) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${tokenId}`);
  return await parseResponseUnsafe(data, TokenResponseSchema.revoke);
};
