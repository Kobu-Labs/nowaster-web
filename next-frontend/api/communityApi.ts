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
  const { data } = await baseApi.post(`${BASE_URL}/${params.communityId}/members`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.join);
};

export const leave = async (params: CommunityRequest["leave"]) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.communityId}/members/me`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.leave);
};

export const listMembers = async (params: CommunityRequest["listMembers"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/members`, {
    params: { limit: params.limit, offset: params.offset },
  });
  return await parseResponseUnsafe(data, CommunityResponseSchema.listMembers);
};

export const updateMemberRole = async (params: CommunityRequest["updateMemberRole"]) => {
  const { data } = await baseApi.patch(
    `${BASE_URL}/${params.communityId}/members/${params.userId}/role`,
    { new_role: params.newRole },
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.updateMemberRole);
};

export const removeMember = async (params: CommunityRequest["removeMember"]) => {
  const { data } = await baseApi.delete(
    `${BASE_URL}/${params.communityId}/members/${params.userId}`,
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.removeMember);
};

export const getCapabilities = async (params: CommunityRequest["getCapabilities"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/capabilities`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.getCapabilities);
};

export const createDirectInvite = async (params: CommunityRequest["createDirectInvite"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/${params.communityId}/invites`, {
    invitee_username: params.inviteeUsername,
  });
  return await parseResponseUnsafe(data, CommunityResponseSchema.createDirectInvite);
};

export const createLinkInvite = async (params: CommunityRequest["createLinkInvite"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/${params.communityId}/invites/link`, {
    expires_in_days: params.expiresInDays,
    max_uses: params.maxUses,
  });
  return await parseResponseUnsafe(data, CommunityResponseSchema.createLinkInvite);
};

export const listCommunityInvites = async (params: CommunityRequest["listCommunityInvites"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/invites`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.listCommunityInvites);
};

export const listIncomingInvites = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/invites/inbox`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.listIncomingInvites);
};

export const respondToInvite = async (params: CommunityRequest["respondToInvite"]) => {
  const { data } = await baseApi.patch(`${BASE_URL}/invites/${params.inviteId}`, {
    accept: params.accept,
  });
  return await parseResponseUnsafe(data, CommunityResponseSchema.respondToInvite);
};

export const revokeInvite = async (params: CommunityRequest["revokeInvite"]) => {
  const { data } = await baseApi.delete(
    `${BASE_URL}/${params.communityId}/invites/${params.inviteId}`,
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.revokeInvite);
};

export const joinViaCode = async (params: CommunityRequest["joinViaCode"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/join/${params.code}`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.joinViaCode);
};

export const previewByInviteCode = async (params: CommunityRequest["previewByCode"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/join/${params.code}/preview`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.previewByCode);
};

export const listTrackedCategories = async (
  params: CommunityRequest["listTrackedCategories"],
) => {
  const { data } = await baseApi.get(
    `${BASE_URL}/${params.communityId}/tracked-categories`,
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.listTrackedCategories);
};

export const createTrackedCategory = async (
  params: CommunityRequest["createTrackedCategory"],
) => {
  const { data } = await baseApi.post(
    `${BASE_URL}/${params.communityId}/tracked-categories`,
    { name: params.name, color: params.color },
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.createTrackedCategory);
};

export const updateTrackedCategory = async (
  params: CommunityRequest["updateTrackedCategory"],
) => {
  const { data } = await baseApi.patch(
    `${BASE_URL}/${params.communityId}/tracked-categories/${params.id}`,
    { name: params.name, color: params.color },
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.updateTrackedCategory);
};

export const deleteTrackedCategory = async (
  params: CommunityRequest["deleteTrackedCategory"],
) => {
  const { data } = await baseApi.delete(
    `${BASE_URL}/${params.communityId}/tracked-categories/${params.id}`,
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.deleteTrackedCategory);
};

export const createMapping = async (params: CommunityRequest["createMapping"]) => {
  const { data } = await baseApi.post(
    `${BASE_URL}/${params.communityId}/category-mappings`,
    {
      tracked_category_id: params.trackedCategoryId,
      personal_category_id: params.personalCategoryId,
    },
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.createMapping);
};

export const listMyMappings = async (params: CommunityRequest["listMyMappings"]) => {
  const { data } = await baseApi.get(
    `${BASE_URL}/${params.communityId}/category-mappings/me`,
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.listMyMappings);
};

export const deleteMapping = async (params: CommunityRequest["deleteMapping"]) => {
  const { data } = await baseApi.delete(
    `${BASE_URL}/${params.communityId}/category-mappings/${params.id}`,
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.deleteMapping);
};

export const getDashboard = async (params: CommunityRequest["getDashboard"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/dashboard`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.getDashboard);
};
