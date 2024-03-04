import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type { CategoryRequest, CategoryResponse } from "@kobu-labs/nowaster-js-typing";


const single = async (params: CategoryRequest["readByName"]): AsyncResult<CategoryResponse["readByName"]> => {
  try {
    const category = await client.category.findFirst({
      where: {
        name: params.name,
      }
    });

    return Result.ok(category);
  } catch (error) {
    return Result.err(error as Error);
  }
};

const many = async (params?: CategoryRequest["readMany"]): AsyncResult<CategoryResponse["readMany"]> => {

  try {
    const category = await client.category.findMany({
      where: {
        name: {
          contains: params?.nameLike
        },
      },
    });

    return Result.ok(category);
  } catch (error) {
    return Result.err(error as Error);
  }
};


const read = {
  single,
  many,
};

export default read;
