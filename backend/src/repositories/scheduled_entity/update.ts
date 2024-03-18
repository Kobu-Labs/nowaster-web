import { Result } from "@badrap/result";
import client from "@/src/repositories/client";
import type { AsyncResult } from "@/src/repositories/types";
import type {
  ScheduledSessionRequest,
  ScheduledSessionResponse,
} from "@kobu-labs/nowaster-js-typing";

const update = async (
  params: ScheduledSessionRequest["update"],
): AsyncResult<ScheduledSessionResponse["update"]> => {
  try {
    const { id, category, ...data } = params;

    const scheduledSession = await client.scheduledEntity.update({
      where: {
        id: id,
      },
      include: {
        category: true,
        tags: {
          select: {
            tag: {
              include: { TagToAllowedCategory: true },
            },
          },
        },
      },
      data: {
        ...data,
        category: {
          connectOrCreate: {
            where: {
              name: category.name,
            },
            create: {
              name: category.name,
            },
          },
        },
      },
    });

    const { tags, ...rest } = scheduledSession;
    const mappedTags = tags.map((tagData) => {
      const { TagToAllowedCategory, ...data } = tagData.tag;
      return {
        ...data,
        allowedCategories: TagToAllowedCategory,
      };
    });

    return Result.ok({ tags: mappedTags, ...rest });
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default update;
