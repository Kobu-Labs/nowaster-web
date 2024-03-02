import type { ScheduledEntity } from "@prisma/client";
import client from "@/src/repositories/client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import type { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";

const single = async (params: ScheduledSessionRequest["remove"]): AsyncResult<ScheduledEntity> => {
  try {
    return await client.$transaction(async (tx) => {
      const scheduledEntity = await tx.scheduledEntity.findFirst({
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
        return Result.err(new Error("Scheduled Entity does not exist"));
      }

      const deletedEntity = await tx.scheduledEntity.delete({
        where: {
          id: params.id,
        },
        include: {
          tags: {
            select: {
              tag: true
            }
          }
        }
      });

      const { tags, ...rest } = deletedEntity;
      return Result.ok({ tags: tags.map(t => t.tag), ...rest });
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

// TODO: no endpoint is actually using this
type DeleteManyScheduledParams = {
    ids: string[];
};

const many = async (params: DeleteManyScheduledParams): AsyncResult<ScheduledEntity[]> => {
  try {
    return await client.$transaction(async (tx) => {
      const sessions = await tx.scheduledEntity.findMany({
        where: {
          id: { in: params.ids },
        },
        include: {
          tags: {
            select: {
              tag: true
            }
          }
        }
      });



      if (sessions.length !== params.ids.length) {
        const missingIds = params.ids.filter(x => !sessions.map(obj => obj.id).includes(x));
        return Result.err(new Error("Could not find scheduled entitites with id:" + missingIds.toString()));
      }

      await tx.scheduledEntity.deleteMany({
        where: {
          id: { in: params.ids },
        }
      });

      return Result.ok(sessions.map(session => {
        const { tags, ...rest } = session;
        return { tags: tags.map(t => t.tag), ...rest };
      }));
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

const remove = {
  single,
  many,
};

export default remove;
