import { Result } from "@badrap/result";
import type { Tag } from "@prisma/client";
import { UserVisibleError, type AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type { TagRequest } from "@kobu-labs/nowaster-js-typing";

type ReadTagByIdParams = {
    id: string
}

type ReadTagByLabelParams = {
    label: string
}

// TODO: not endpoint is using this
const byId = async (params: ReadTagByIdParams): AsyncResult<Tag> => {
  try {
    const tagEntity = await client.tag.findFirst({
      where: {
        id: params.id
      }
    });

    if (!tagEntity) {
      return Result.err(new UserVisibleError("Tag does not exists"));
    }

    return Result.ok(tagEntity);
  } catch (error) {

    return Result.err(error as Error);
  }
};


// TODO: not endpoint is using this
const byLabel = async (params: ReadTagByLabelParams): AsyncResult<Tag> => {
  try {
    const tagEntity = await client.tag.findFirst({
      where: {
        label: params.label
      }
    });

    if (!tagEntity) {
      return Result.err(new UserVisibleError("Tag does not exists"));
    }

    return Result.ok(tagEntity);
  } catch (error) {

    return Result.err(error as Error);
  }
};

const many = async (params: TagRequest["readMany"]): AsyncResult<Tag[]> => {
  try {
    const tags = await client.tag.findMany({ take: params.limit });


    return Result.ok(tags);
  } catch (error) {
    return Result.err(error as Error);
  }

};

const read = {
  byLabel,
  byId,
  many,
};

export default read;
