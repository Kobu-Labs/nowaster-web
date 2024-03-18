import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type {
  ScheduledSessionRequest,
  ScheduledSessionResponse,
} from "@kobu-labs/nowaster-js-typing";

const many = async (
  params: ScheduledSessionRequest["readMany"],
): AsyncResult<ScheduledSessionResponse["readMany"]> => {
  try {
    const filterTags =
      params.tags !== undefined
        ? { tags: { some: { tag: { label: { in: params.tags } } } } }
        : {};

    const scheduledEntity = await client.scheduledEntity.findMany({
      take: params.limit,
      orderBy: { startTime: "desc" },
      include: {
        tags: {
          include: {
            tag: {
              include: {
                TagToAllowedCategory: true,
              },
            },
          },
        },
        category: true,
      },
      where: {
        category: {
          ...params.category,
        },
        ...filterTags,
        startTime: {
          gte: params.fromStartTime,
          lte: params.toStartTime,
        },
        endTime: {
          gte: params.fromEndTime,
          lte: params.toEndTime,
        },
      },
    });

    return Result.ok(
      scheduledEntity.map((session) => {
        const { tags, ...rest } = session;
        const mappedTags = tags.map((tagData) => {
          const { TagToAllowedCategory, ...data } = tagData.tag;
          return {
            ...data,
            allowedCategories: TagToAllowedCategory,
          };
        });
        return { tags: mappedTags, ...rest };
      }),
    );
  } catch (error) {
    return Result.err(error as Error);
  }
};

const single = async (
  params: ScheduledSessionRequest["readById"],
): AsyncResult<ScheduledSessionResponse["readById"]> => {
  try {
    const scheduledEntity = await client.scheduledEntity.findFirst({
      where: {
        id: params.id,
      },
      include: {
        tags: {
          select: {
            tag: {
              include: {
                TagToAllowedCategory: true,
              },
            },
          },
        },
        category: true,
      },
    });

    if (!scheduledEntity) {
      return Result.ok(null);
    }

    const { tags, ...rest } = scheduledEntity;
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

const read = {
  single,
  many,
};

export default read;
