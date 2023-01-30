import type { AsyncResult } from "../types";
import type { ScheduledEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type ReadSingleScheduledParams = {
    id: string
}
type ReadManyScheduledParams = {
    limit?: number | undefined
}


const many = async (params: ReadManyScheduledParams): AsyncResult<ScheduledEntity[] | null> => {
  try {

    const scheduledEntity = await client.scheduledEntity.findMany({
      take: params.limit,
      orderBy: { startTime: "desc" }
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
