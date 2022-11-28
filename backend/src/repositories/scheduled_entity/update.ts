import type { AsyncResult } from "../types";
import type { ScheduledEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type UpdateRecordedEntityParams = {
    id: string;
    startTime?: Date;
    endTime?: Date;
    category?: string;
    description?: string | null;
};

const update = async (params: UpdateRecordedEntityParams): AsyncResult<ScheduledEntity> => {
  try {
    const { id, ...data } = params;

    const scheduledEntity = await client.scheduledEntity.update({
      where: { 
        id: id,
      },
      data: {
        ...data
      }
    });
    return Result.ok(scheduledEntity);
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default update;
