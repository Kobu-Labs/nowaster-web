import baseApi, { handleResponse } from "@/api/baseApi";
import { Result } from "@badrap/result";
import { CategoryResponse, CategoryResponseSchema } from "@kobu-labs/nowaster-js-typing";

const BASE_URL = "categories/";

export const getCategories = async (): Promise<Result<CategoryResponse["readMany"]>> => {
  const { data } = await baseApi.get(BASE_URL + "/categories");
  return await handleResponse(data, CategoryResponseSchema.readMany);
};
