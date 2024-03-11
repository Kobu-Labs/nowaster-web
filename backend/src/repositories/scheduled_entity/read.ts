import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type { ScheduledSessionRequest, ScheduledSessionResponse } from "@kobu-labs/nowaster-js-typing";

const many = async (params: ScheduledSessionRequest["readMany"]): AsyncResult<ScheduledSessionResponse["readMany"]> => {
  try {
    const filterTags = params.tags !== undefined ? { tags: { some: { tag: { label: { in: params.tags } } } } } : {};

    const scheduledEntity = await client.scheduledEntity.findMany({
      take: params.limit,
      orderBy: { startTime: "desc" },
      include: {
        tags: {
          select: {
            tag: true,
          }
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
        }
      },
    });

    return Result.ok(scheduledEntity.map(session => {
      const { tags, ...rest } = session;
      return { tags: tags.map(t => t.tag), ...rest };
    }));

  } catch (error) {
    return Result.err(error as Error);
  }
};

const single = async (params: ScheduledSessionRequest["readById"]): AsyncResult<ScheduledSessionResponse["readById"]> => {
  try {
    const scheduledEntity = await client.scheduledEntity.findFirst({
      where: {
        id: params.id,
      },
      include: {
        tags: {
          select: {
            tag: true,
          }
        },
        category: true,
      }
    });

    if (!scheduledEntity) {
      return Result.ok(null);
    }

    const { tags, ...rest } = scheduledEntity;
    return Result.ok({ tags: tags.map(t => t.tag), ...rest });

  } catch (error) {
    return Result.err(error as Error);
  }

};


const read = {
  single,
  many,
};

export default read;
