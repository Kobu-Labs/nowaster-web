import type { AsyncResult } from "../types";
import type { ScheduledEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type ReadSingleScheduledParams = {
    id: string
}

const many = async (): AsyncResult<ScheduledEntity[] | null> => {
  try {

    const scheduledEntity = await client.scheduledEntity.findMany({
    });

    if (!scheduledEntity) {
      return Result.err(new Error("ScheduledEntity does not exist"));
    }

    return Result.ok(scheduledEntity);
        
  } catch (error) {
    return Result.err(error as Error);
  }
};

const single = async (params: ReadSingleScheduledParams): AsyncResult<ScheduledEntity> => {
  try {
    const scheduledEntity = await client.scheduledEntity.findFirst({
      where: {
        id: params.id,
      }
    });

    if (!scheduledEntity) {
      return Result.err(new Error("ScheduledEntity does not exist"));
    }

    return Result.ok(scheduledEntity);
        
  } catch (error) {
    return Result.err(error as Error);
  }

};


const read = {
  single,
  many,
};

export default read;
