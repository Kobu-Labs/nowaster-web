import { CreateTagRequest, ReadManyTagsRequest } from "@/validation/requests/tags";
import { CreateTagResponse, createTagResponseSchema, ReadManyTagsResponse, readManyTagsResponseSchema } from "@/validation/responses/tags";
import { Result } from "@badrap/result";
import baseApi, { handleResponse } from "./baseApi";

export const readMany = async (params?: ReadManyTagsRequest): Promise<Result<ReadManyTagsResponse>> => {
  const { data } = await baseApi.get(
    "tags/",
    { params: { ...params } }
  );
  return await handleResponse(data, readManyTagsResponseSchema)
};

export const create = async (params: CreateTagRequest): Promise<Result<CreateTagResponse>> => {
  const { data } = await baseApi.post(
    "tags/",
    params
  );
  return await handleResponse(data, createTagResponseSchema)
};
