import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type { ScheduledSession, ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";


// tags passed in must already exists
const create = async (params: ScheduledSessionRequest["create"]): AsyncResult<ScheduledSession> => {
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
        category: {
          connectOrCreate: {
            where: {
              name: params.category.name
            },
            create: {
              name: params.category.name

            },
          },
        },
      },
      include: {
        category: true,
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
