import type { AsyncResult } from "../types";
import type { ScheduledEntity, Tag } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type CreateScheduledParams = Omit<ScheduledEntity, "id"> & { tags: Tag[] }

// tags passed in must already exists
const create = async (params: CreateScheduledParams): AsyncResult<ScheduledEntity & { tags: Tag[] }> => {
  try {
    const scheduledEntity = await client.scheduledEntity.create({
      data: {
        tags: {
          create: params.tags.map(t => {
            return {
              tag: {
                connect: {
                  id: t.id
                }
              }
            };
          })
        },
        startTime: params.startTime,
        endTime: params.endTime,
        description: params.description,
        category: params.category
      },
      include: {
        tags: {
          select: {
            tag: true
          },
        }
      }
    });

    const { tags, ...rest } = scheduledEntity;
    return Result.ok({ tags: tags.map(t => t.tag), ...rest });
  } catch (error) {
    return Result.err(error as Error);
  }

};

export default create;
