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
    // TODO: too hacky
    let tagsFilter = undefined;
    if (params.tags?.label?.some) {
      tagsFilter = {
        some: { tag: { label: { in: params.tags.label.some } } },
      };
    } else if (params.tags?.label?.every) {
      tagsFilter = {
        every: { tag: { label: { in: params.tags.label.every } } },
      };
    }

    // TODO: too hacky
    let categoryFilter = undefined;
    if (params.category?.label?.exact) {
      categoryFilter = { name: params.category.label.exact };
    }
    if (params.category?.label?.some) {
      categoryFilter = { name: { in: params.category.label.some } };
    }

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
        category: categoryFilter,
        tags: tagsFilter,
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
