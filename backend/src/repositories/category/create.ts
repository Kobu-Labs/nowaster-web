import client from "@/src/repositories/client";
import type { AsyncResult } from "@/src/repositories/types";
import { Result } from "@badrap/result";
import type { CategoryRequest, CategoryResponse } from "@kobu-labs/nowaster-js-typing";

const create = async (params: CategoryRequest["create"]): AsyncResult<CategoryResponse["create"]> => {
  try {
    const category = await client.category.create({ data: params });
    return Result.ok(category);
  } catch (error) {
    return Result.err(error as Error);
  }

};


export default create;
