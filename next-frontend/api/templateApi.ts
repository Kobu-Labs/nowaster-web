import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { SessionTemplateRequest } from "@/api/definitions/requests/session-template";
import { SessionTemplateResponseSchema } from "@/api/definitions/responses/session-template";

const BASE_URL = "/session/template";

export const readMany = async (_params?: SessionTemplateRequest["readMany"]) => {
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

export const update = async (params: SessionTemplateRequest["update"]) => {
  const { data } = await baseApi.patch(BASE_URL, params);
  return await parseResponseUnsafe(data, SessionTemplateResponseSchema.update);
};

export const deleteTemplate = async (
  params: SessionTemplateRequest["deleteTemplate"],
) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.id}/${params.existingSessionActions}`);
  return await parseResponseUnsafe(
    data,
    SessionTemplateResponseSchema.deleteTemplate,
  );
};

export const deleteRecurringSession = async (
  params: SessionTemplateRequest["deleteRecurringSession"],
) => {
  const { data } = await baseApi.delete(`${BASE_URL}/recurring/${params.id}`);
  return await parseResponseUnsafe(
    data,
    SessionTemplateResponseSchema.deleteRecurringSession,
  );
};
