import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import { ReleaseResponseSchema } from "@/api/definitions/responses/release";
import type {
  CreateReleaseRequest,
  UpdateReleaseRequest,
} from "@/api/definitions/requests/release";

const BASE_URL = "/releases";
const ADMIN_BASE_URL = "/admin/releases";

export const listPublicReleases = async () => {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.listPublicReleases);
};

export const getReleaseByVersion = async (version: string) => {
  const { data } = await baseApi.get(`${BASE_URL}/${version}`);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.getReleaseByVersion);
};

export const getLatestUnseenRelease = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/latest-unseen`);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.getLatestUnseenRelease);
};

export const listAllReleases = async () => {
  const { data } = await baseApi.get(ADMIN_BASE_URL);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.listAllReleases);
};

export const createRelease = async (request: CreateReleaseRequest) => {
  const { data } = await baseApi.post(ADMIN_BASE_URL, request);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.createRelease);
};

export const getRelease = async (releaseId: string) => {
  const { data } = await baseApi.get(`${ADMIN_BASE_URL}/${releaseId}`);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.getRelease);
};

export const updateRelease = async (
  releaseId: string,
  request: UpdateReleaseRequest,
) => {
  const { data } = await baseApi.patch(`${ADMIN_BASE_URL}/${releaseId}`, request);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.updateRelease);
};

export const deleteRelease = async (releaseId: string) => {
  const { data } = await baseApi.delete(`${ADMIN_BASE_URL}/${releaseId}`);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.deleteRelease);
};

export const publishRelease = async (releaseId: string) => {
  const { data } = await baseApi.post(`${ADMIN_BASE_URL}/${releaseId}/publish`);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.publishRelease);
};

export const unpublishRelease = async (releaseId: string) => {
  const { data } = await baseApi.post(`${ADMIN_BASE_URL}/${releaseId}/unpublish`);
  return await parseResponseUnsafe(data, ReleaseResponseSchema.unpublishRelease);
};

