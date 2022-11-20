import type { AsyncResult } from "../types";
import type { ScheduledEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type DeleteSingleScheduledParams = {
    id: string;
    userId: string;
};

const single = async (params: DeleteSingleScheduledParams) : AsyncResult<ScheduledEntity>=> { 
  try {
    return await client.$transaction(async (tx)=>{
      const scheduledEntity = await tx.scheduledEntity.findFirst({
        where: {
          id: params.id,
        }
      });

      if (!scheduledEntity) {
        return Result.err(new Error("Scheduled Entity does not exist"));
      }

      if (scheduledEntity.userId != params.userId) {
        return Result.err(new Error("User is not the owner of the scheduled Entity"));
      }

      const deletedEntity = await tx.scheduledEntity.delete({
        where: {
          id: params.id,
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
    userId: string;
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

      if (!scheduledEntity.every(x => x.userId === params.userId)) {
        return Result.err(new Error("User is not the owner of the recorded entity"));
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
