import type { ScheduledEntity } from "@prisma/client";
import { Result } from "@badrap/result";
import client from "@/src/repositories/client";
import type { AsyncResult } from "@/src/repositories/types";
import type { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";


const update = async (params: ScheduledSessionRequest["update"]): AsyncResult<ScheduledEntity> => {
  try {
    const { id, category, ...data } = params;

    const scheduledEntity = await client.scheduledEntity.update({
      where: {
        id: id,
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
    return Result.ok(scheduledEntity);

  } catch (error) {
    return Result.err(error as Error);
  }
};

export default update;
