import type { AsyncResult } from "../types";
import type { ScheduledEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";
import type { z } from "zod";
import type { readManyScheduledSchema } from "../../validation/scheduledSessionValidation";

type ReadSingleScheduledParams = {
    id: string
}

const many = async (params: z.infer<typeof readManyScheduledSchema>): AsyncResult<ScheduledEntity[] | null> => {
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
        }
      },
      where: {
        category: params.category,
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

    if (!scheduledEntity) {
      return Result.err(new Error("ScheduledEntity does not exist"));
    }

    return Result.ok(scheduledEntity.map(session => {
      const { tags, ...rest } = session;
      return { tags: tags.map(t => t.tag), ...rest };
    }));

  } catch (error) {
    return Result.err(error as Error);
  }
};

const single = async (params: ReadSingleScheduledParams): AsyncResult<ScheduledEntity> => {
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

        }
      }
    });

    if (!scheduledEntity) {
      return Result.err(new Error("ScheduledEntity does not exist"));
    }

    const { tags, ...rest } = scheduledEntity;
    return Result.ok({ tags: tags.map(t => t.tag), ...rest });

  } catch (error) {
    return Result.err(error as Error);
  }

};

const getCategories = async (): AsyncResult<string[]> => {
  try {
    const categories = await client.scheduledEntity.findMany({
      where: {},
      select: {
        category: true
      },
      distinct: [
        "category"
      ]
    });

    return Result.ok(categories.map(c => c.category));

  } catch (error) {
    return Result.err(error as Error);
  }
};


const read = {
  single,
  many,
  getCategories,
};

export default read;
