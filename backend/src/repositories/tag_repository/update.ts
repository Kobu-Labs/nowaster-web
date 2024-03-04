import type { Tag } from "@prisma/client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";

type UpdateTagParams = {
    id: string
    label: string
}

const update = async (params: UpdateTagParams): AsyncResult<Tag> => {
  try {
    const { id, ...data } = params;

    const tag = await client.tag.update({
      where: {
        id: id,
      },
      data: {
        ...data
      }
    });
    return Result.ok(tag);
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default update;
