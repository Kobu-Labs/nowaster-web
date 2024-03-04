import type { ScheduledEntity } from "@prisma/client";
import { Result } from "@badrap/result";
import type { ScheduledSessionRequest } from "@/src/requests/scheduledSessionRequests";
import client from "@/src/repositories/client";
import type { AsyncResult } from "@/src/repositories/types";

const update = async (params: ScheduledSessionRequest["update"]): AsyncResult<ScheduledEntity> => {
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
