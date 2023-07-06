import type { AsyncResult } from "../types";
import type { ScheduledEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type CreateScheduledParams = Omit<ScheduledEntity, "id"> & { tags: string[] }

// tags passed in must already exists
const create = async (params: CreateScheduledParams): AsyncResult<ScheduledEntity> => {
  try {
    const tags = await client.tag.findMany({
      where: {
        label: {
          in: params.tags
        }
      }
    });

    const preprocessedTags = tags.map((t) => {
      return { tagId: t.id };
    });


    const scheduledEntity = await client.scheduledEntity.create({
      data: {
        tags: {
          create: preprocessedTags
        },
        startTime: params.startTime,
        endTime: params.endTime,
        description: params.description,
        category: params.category
      },
    });

    return Result.ok(scheduledEntity);
  } catch (error) {
    return Result.err(error as Error);
  }

};

export default create;
