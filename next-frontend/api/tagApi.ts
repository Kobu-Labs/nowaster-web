import baseApi, { handleResponse } from "@/api/baseApi"
import { Result } from "@badrap/result"
import {
  TagRequest,
  TagResponse,
  TagResponseSchema,
} from "@kobu-labs/nowaster-js-typing"

export const readMany = async (
  params?: TagRequest["readMany"]
): Promise<Result<TagResponse["readMany"]>> => {
  const { data } = await baseApi.get("tags/", { params: { ...params } })
  return await handleResponse(data, TagResponseSchema.readMany)
}

export const create = async (
  params: TagRequest["create"]
): Promise<Result<TagResponse["create"]>> => {
  const { data } = await baseApi.post("tags/", params)
  return await handleResponse(data, TagResponseSchema.create)
}

export const addAllowedCategory = async (
  params: TagRequest["addAllowedCategory"]
): Promise<Result<TagResponse["addAllowedCategory"]>> => {
  const { data } = await baseApi.post("tags/addAllowedCategory", params)
  return await handleResponse(data, TagResponseSchema.addAllowedCategory)
}
