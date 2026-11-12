import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { BlockRuleResponseSchema } from "@/api/definitions/responses/block-rule";
import type { BlockRuleRequest } from "@/api/definitions/requests/block-rule";

const BASE_URL = "/block-rules";

export const listBlockRules = async () => {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(data, BlockRuleResponseSchema.list);
};

export const createBlockRule = async (params: BlockRuleRequest["create"]) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, BlockRuleResponseSchema.create);
};

export const deleteBlockRule = async (id: string) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${id}`);
  return await parseResponseUnsafe(data, BlockRuleResponseSchema.remove);
};
