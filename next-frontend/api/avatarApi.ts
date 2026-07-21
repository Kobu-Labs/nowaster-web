import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { AvatarRequest } from "@/api/definitions/requests/avatar";
import { AvatarResponseSchema } from "@/api/definitions/responses/avatar";

const BASE_URL = "/avatar";
const ADMIN_URL = "/admin/avatar";

export const getAvatar = async () => {
  const { data } = await baseApi.get(BASE_URL);
  return parseResponseUnsafe(data, AvatarResponseSchema.getAvatar);
};

export const enable = async () => {
  const { data } = await baseApi.post(`${BASE_URL}/enable`);
  return parseResponseUnsafe(data, AvatarResponseSchema.enable);
};

export const disable = async () => {
  const { data } = await baseApi.post(`${BASE_URL}/disable`);
  return parseResponseUnsafe(data, AvatarResponseSchema.disable);
};

export const setPreset = async (params: AvatarRequest["setPreset"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/preset`, params);
  return parseResponseUnsafe(data, AvatarResponseSchema.setPreset);
};

export const listPresets = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/presets`);
  return parseResponseUnsafe(data, AvatarResponseSchema.listPresets);
};

export const triggerGeneration = async () => {
  const { data } = await baseApi.post(`${BASE_URL}/generate`);
  return parseResponseUnsafe(data, AvatarResponseSchema.triggerGeneration);
};

export const listRuns = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/runs`);
  return parseResponseUnsafe(data, AvatarResponseSchema.listRuns);
};

export const getLatestRun = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/runs/latest`);
  return parseResponseUnsafe(data, AvatarResponseSchema.getLatestRun);
};

export const listHistory = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/history`);
  return parseResponseUnsafe(data, AvatarResponseSchema.listHistory);
};

export const searchHints = async (params: AvatarRequest["searchHints"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/hints`, { params });
  return parseResponseUnsafe(data, AvatarResponseSchema.searchHints);
};

export const createHint = async (params: AvatarRequest["createHint"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/hints`, params);
  return parseResponseUnsafe(data, AvatarResponseSchema.createHint);
};

export const listCategoryHints = async (
  params: AvatarRequest["listCategoryHints"],
) => {
  const { data } = await baseApi.get(
    `${BASE_URL}/categories/${params.categoryId}/hints`,
  );
  return parseResponseUnsafe(data, AvatarResponseSchema.listCategoryHints);
};

export const assignCategoryHint = async (
  params: AvatarRequest["assignCategoryHint"],
) => {
  const { data } = await baseApi.post(
    `${BASE_URL}/categories/${params.categoryId}/hints`,
    { hintId: params.hintId },
  );
  return parseResponseUnsafe(data, AvatarResponseSchema.assignCategoryHint);
};

export const removeCategoryHint = async (
  params: AvatarRequest["removeCategoryHint"],
) => {
  const { data } = await baseApi.delete(
    `${BASE_URL}/categories/${params.categoryId}/hints/${params.hintId}`,
  );
  return parseResponseUnsafe(data, AvatarResponseSchema.removeCategoryHint);
};

// Admin

export const adminListAllPresets = async () => {
  const { data } = await baseApi.get(`${ADMIN_URL}/presets`);
  return parseResponseUnsafe(data, AvatarResponseSchema.adminListAllPresets);
};

export const adminCreatePreset = async (
  params: AvatarRequest["adminCreatePreset"],
) => {
  const { data } = await baseApi.post(`${ADMIN_URL}/presets`, params);
  return parseResponseUnsafe(data, AvatarResponseSchema.adminCreatePreset);
};

export const adminUpdatePreset = async (
  params: AvatarRequest["adminUpdatePreset"],
) => {
  const { id, ...rest } = params;
  const { data } = await baseApi.patch(`${ADMIN_URL}/presets/${id}`, rest);
  return parseResponseUnsafe(data, AvatarResponseSchema.adminUpdatePreset);
};

export const adminDeletePreset = async (
  params: AvatarRequest["adminDeletePreset"],
) => {
  const { data } = await baseApi.delete(`${ADMIN_URL}/presets/${params.id}`);
  return parseResponseUnsafe(data, AvatarResponseSchema.adminDeletePreset);
};

export const adminUploadPresetImages = async (
  entries: { file: File; name: string; }[],
) => {
  const formData = new FormData();
  for (const { file, name } of entries) {
    const extension = file.name.includes(".")
      ? file.name.split(".").pop()
      : "jpg";
    const trimmedName = name.trim() || file.name.replace(/\.[^.]+$/, "");
    formData.append(trimmedName, file, `${trimmedName}.${extension}`);
  }
  const { data } = await baseApi.post(
    `${ADMIN_URL}/presets/upload-bulk`,
    formData,
  );
  return parseResponseUnsafe(data, AvatarResponseSchema.adminBulkUploadPresets);
};

export const adminUploadPresetToLeonardo = async (
  params: AvatarRequest["adminUploadPresetToLeonardo"],
) => {
  const { data } = await baseApi.post(
    `${ADMIN_URL}/presets/${params.id}/upload-to-leonardo`,
  );
  return parseResponseUnsafe(data, AvatarResponseSchema.adminUploadPresetToLeonardo);
};

export const adminTriggerGeneration = async (
  params: AvatarRequest["adminTriggerGeneration"],
) => {
  const { data } = await baseApi.post(
    `${ADMIN_URL}/users/${params.userId}/generate`,
  );
  return parseResponseUnsafe(data, AvatarResponseSchema.adminTriggerGeneration);
};

export const adminGenerateFromUser = async (
  params: AvatarRequest["adminGenerateFromUser"],
) => {
  const { data } = await baseApi.post(`${ADMIN_URL}/generate`, {
    source: { type: "user", userId: params.userId },
    assignToUserId: params.assignToUserId,
  });
  return parseResponseUnsafe(data, AvatarResponseSchema.adminGenerate);
};

export const adminGenerateManual = async (
  params: AvatarRequest["adminGenerateManual"],
) => {
  const { data } = await baseApi.post(`${ADMIN_URL}/generate`, {
    source: { type: "manual", data: params.data },
    assignToUserId: params.assignToUserId,
  });
  return parseResponseUnsafe(data, AvatarResponseSchema.adminGenerate);
};

export const adminPlaygroundGenerate = async (userId: string) => {
  const { data } = await baseApi.post(`${ADMIN_URL}/playground`, {
    userId,
  });
  return parseResponseUnsafe(data, AvatarResponseSchema.adminPlaygroundGenerate);
};

export const adminListRecentRuns = async (limit = 50) => {
  const { data } = await baseApi.get(`${ADMIN_URL}/runs`, {
    params: { limit },
  });
  return parseResponseUnsafe(data, AvatarResponseSchema.adminListRecentRuns);
};

export const adminGetPlaygroundData = async (userId: string, weeks: number) => {
  const { data } = await baseApi.get(`${ADMIN_URL}/playground/${userId}/data`, {
    params: { weeks },
  });
  return parseResponseUnsafe(data, AvatarResponseSchema.adminGetPlaygroundData);
};
