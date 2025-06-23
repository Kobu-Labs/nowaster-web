import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { SessionTemplateRequest } from "@/api/definitions/requests/session-template";
import { SessionTemplateResponseSchema } from "@/api/definitions/responses/session-template";

const BASE_URL = "/session/template";

export const readMany = async (params?: SessionTemplateRequest["readMany"]) => {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(
    data,
    SessionTemplateResponseSchema.readMany,
  );
};

export const create = async (params: SessionTemplateRequest["create"]) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, SessionTemplateResponseSchema.create);
};
