import type { AsyncResult } from "../types";
import type { ScheduledEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type CreateScheduledParams = Omit<ScheduledEntity, "id">


const create = async (params: CreateScheduledParams): AsyncResult<ScheduledEntity> => {
  try {
    const scheduledEntity = await client.scheduledEntity.create({ data: params });
    return Result.ok(scheduledEntity);
  } catch (error) {
    return Result.err(error as Error);
  }

};

export default create;
