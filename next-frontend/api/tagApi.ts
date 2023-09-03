import { ReadManyTagsRequest } from "@/validation/requests/tags";
import { ReadManyTagsResponse, readManyTagsResponseSchema } from "@/validation/responses/tags";
import { Result } from "@badrap/result";
import baseApi, { handleResponse } from "./baseApi";

export const readMany = async (params?: ReadManyTagsRequest): Promise<Result<ReadManyTagsResponse>> => {
  const { data } = await baseApi.get(
    "tags/",
    { params: { ...params } }
  );
  return await handleResponse(data, readManyTagsResponseSchema)
};
