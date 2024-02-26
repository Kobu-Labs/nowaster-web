import type { AsyncResult } from "../types";
import type { ScheduledEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type DeleteSingleScheduledParams = {
    id: string;
};

const single = async (params: DeleteSingleScheduledParams) : AsyncResult<ScheduledEntity>=> { 
  try {
    return await client.$transaction(async (tx)=>{
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
      return Result.ok(deletedEntity);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

type DeleteManyScheduledParams = {
    ids: string[];
};

const many = async (params: DeleteManyScheduledParams) : AsyncResult<ScheduledEntity[]>=> {
  try {
    return await client.$transaction(async (tx)=>{
      const scheduledEntity = await tx.scheduledEntity.findMany({
        where: {
          id: {in: params.ids},
        }
      });

      if (scheduledEntity.length !== params.ids.length) {
        const missingIds = params.ids.filter(x => !scheduledEntity.map(obj => obj.id).includes(x));
        return Result.err(new Error("Could not find scheduled entitites with id:" + missingIds.toString()));
      }

      await tx.scheduledEntity.deleteMany({
        where: {
          id: {in: params.ids},
        }
      });
      return Result.ok(scheduledEntity);
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
