import type { Tag } from "@prisma/client";
import { Result } from "@badrap/result";
import client from "@/src/repositories/client";
import type { AsyncResult } from "@/src/repositories/types";
import type { TagRequest } from "@kobu-labs/nowaster-js-typing";


const create = async (params: TagRequest["create"]): AsyncResult<Tag> => {
  try {
    const result = await client.tag.create({ data: params });
    return Result.ok(result);
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default create;
