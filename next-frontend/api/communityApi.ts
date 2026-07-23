import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { CommunityRequest } from "@/api/definitions";
import { CommunityResponseSchema } from "@/api/definitions";

const BASE_URL = "/community";

export const listMine = async () => {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(data, CommunityResponseSchema.listMine);
};

export const getById = async (params: CommunityRequest["getById"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.getById);
};

export const create = async (params: CommunityRequest["create"]) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, CommunityResponseSchema.create);
};

export const update = async (params: CommunityRequest["update"]) => {
  const { data } = await baseApi.patch(`${BASE_URL}/${params.id}`, params);
  return await parseResponseUnsafe(data, CommunityResponseSchema.update);
};

export const archive = async (params: CommunityRequest["archive"]) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.archive);
};

export const join = async (params: CommunityRequest["join"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/${params.communityId}/members`, {
    invite_code: params.inviteCode,
  });
  return await parseResponseUnsafe(data, CommunityResponseSchema.join);
};

export const leave = async (params: CommunityRequest["leave"]) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.communityId}/members/me`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.leave);
};

export const listMembers = async (params: CommunityRequest["listMembers"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/members`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.listMembers);
};

export const getInviteCode = async (params: CommunityRequest["getInviteCode"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/invite-code`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.getInviteCode);
};

export const regenerateInviteCode = async (
  params: CommunityRequest["regenerateInviteCode"],
) => {
  const { data } = await baseApi.post(
    `${BASE_URL}/${params.communityId}/invite-code/regenerate`,
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.regenerateInviteCode);
};

export const previewByInviteCode = async (params: CommunityRequest["previewByCode"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/invite/${params.code}`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.previewByCode);
};
