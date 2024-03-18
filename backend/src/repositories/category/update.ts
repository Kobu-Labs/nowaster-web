import { Result } from "@badrap/result";
import client from "@/src/repositories/client";
import type { AsyncResult } from "@/src/repositories/types";
import type {
  CategoryRequest,
  CategoryResponse,
} from "@kobu-labs/nowaster-js-typing";

const single = async (
  params: CategoryRequest["update"],
): AsyncResult<CategoryResponse["update"]> => {
  try {
    const { originalName, ...data } = params;

    const category = await client.category.update({
      where: {
        name: originalName,
      },
      data: {
        ...data,
      },
    });
    return Result.ok(category);
  } catch (error) {
    return Result.err(error as Error);
  }
};

const update = {
  single,
};

export default update;
