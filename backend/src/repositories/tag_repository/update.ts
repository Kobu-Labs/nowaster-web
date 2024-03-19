import type { Tag } from "@prisma/client";
import { Result } from "@badrap/result";
import { UserVisibleError, type AsyncResult } from "@/src/repositories/types";
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

const removeAllowedCategory = async (
  params: TagRequest["removeAllowedCategory"],
): AsyncResult<TagResponse["removeAllowedCategory"]> => {
  try {
    await client.tagToAllowedCategory.deleteMany({
      where: {
        tagId: params.tagId,
        name: params.category,
      },
    });

    const updatedTag = await client.tag.findFirst({
      where: {
        id: params.tagId,
      },
      include: {
        TagToAllowedCategory: true,
      },
    });

    if (updatedTag === null) {
      return Result.err(new UserVisibleError("Tag was not found"));
    }

    const result = {
      allowedCategories: updatedTag.TagToAllowedCategory,
      label: updatedTag.label,
      id: updatedTag.id,
    };

    return Result.ok(result);
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
  removeAllowedCategory,
  single,
};

export default update;
