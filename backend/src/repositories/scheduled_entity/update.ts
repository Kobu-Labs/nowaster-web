import { Result } from "@badrap/result";
import client from "@/src/repositories/client";
import type { AsyncResult } from "@/src/repositories/types";
import type { ScheduledSessionRequest, ScheduledSessionResponse } from "@kobu-labs/nowaster-js-typing";


const update = async (params: ScheduledSessionRequest["update"]): AsyncResult<ScheduledSessionResponse["update"]> => {
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
            tag: true
          }
        }
      },
      data: {
        ...data,
        category: {
          connectOrCreate: {
            where: {
              name: category.name
            },
            create: {
              name: category.name
            },
          }
        }
      }
    });

    const { tags, ...rest } = scheduledSession;
    return Result.ok({ tags: tags.map(t => t.tag), ...rest });

  } catch (error) {
    return Result.err(error as Error);
  }
};

export default update;
