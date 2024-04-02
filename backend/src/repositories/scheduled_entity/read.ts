import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type {
  ScheduledSessionRequest,
  ScheduledSessionResponse,
} from "@kobu-labs/nowaster-js-typing";
import type { Prisma } from "@prisma/client";

const preprocessCategoryFilter = (
  filter: ScheduledSessionRequest["readMany"]["categories"],
): Prisma.ScheduledEntityWhereInput => {
  if (!filter?.name?.value.length) {
    return {};
  }
  if (filter?.name?.mode === "some") {
    return {
      category: {
        name: { in: filter?.name?.value },
      },
    };
  }
  if (filter?.name?.mode === "all") {
    return {
      AND: filter.name.value.map((label) => ({
        category: {
          name: {
            in: label,
          },
        },
      })),
    };
  }

  return {};
};

const preprocessTagsFilter = (
  filterTags: ScheduledSessionRequest["readMany"]["tags"],
): Prisma.ScheduledEntityWhereInput => {
  if (!filterTags?.label?.value.length) {
    return {};
  }
  if (filterTags?.label?.mode === "some") {
    return {
      tags: {
        some: {
          tag: {
            label: { in: filterTags.label?.value },
          },
        },
      },
    };
  }
  if (filterTags?.label?.mode === "all") {
    return {
      AND: filterTags.label.value.map((label) => ({
        tags: { some: { tag: { label: { in: label } } } },
      })),
    };
  }

  return {};
};

const many = async (
  params: ScheduledSessionRequest["readMany"],
): AsyncResult<ScheduledSessionResponse["readMany"]> => {
  try {
    const tagsFilter = preprocessTagsFilter(params.tags);
    const categoryFilter = preprocessCategoryFilter(params.categories);

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
        ...tagsFilter,
        ...categoryFilter,
        startTime: {
          gte: params.fromStartTime?.value,
          lte: params.toStartTime?.value,
        },
        endTime: {
          gte: params.fromEndTime?.value,
          lte: params.toEndTime?.value,
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
