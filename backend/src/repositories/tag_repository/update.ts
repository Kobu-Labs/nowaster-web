import type { Tag } from "@prisma/client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type { TagRequest, TagResponse } from "@kobu-labs/nowaster-js-typing";

type UpdateTagParams = {
  id: string;
  label: string;
};

// TODO: no endpoint is using this
const single = async (params: UpdateTagParams): AsyncResult<Tag> => {
  try {
    const { id, ...data } = params;

    const tag = await client.tag.update({
      where: {
        id: id,
      },
      data: {
        ...data,
      },
    });
    return Result.ok(tag);
  } catch (error) {
    return Result.err(error as Error);
  }
};

const addAllowedCategory = async (
  params: TagRequest["addAllowedCategory"],
): AsyncResult<TagResponse["addAllowedCategory"]> => {
  try {
    const updated = await client.tagToAllowedCategory.create({
      data: {
        tagId: params.tagId,
        name: params.category,
      },
      include: {
        tag: {
          include: {
            TagToAllowedCategory: true,
          },
        },
      },
    });

    const result = {
      label: updated.tag.label,
      id: updated.tag.id,
      allowedCategories: updated.tag.TagToAllowedCategory,
    };

    return Result.ok(result);
  } catch (error) {
    return Result.err(error as Error);
  }
};

const update = {
  addAllowedCategory,
  single,
};

export default update;
