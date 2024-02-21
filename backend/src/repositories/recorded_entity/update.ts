import type { AsyncResult } from "../types";
import type { RecordedEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";
import type { RecordedSessionRequest } from "@/src/requests/recordedSessionRequests";


const update = async (params: RecordedSessionRequest["updateById"]): AsyncResult<RecordedEntity> => {
  try {
    const { id, ...data } = params;

    const recordedEntity = await client.recordedEntity.update({
      where: {
        id: id,
      },
      data: {
        ...data
      }
    });
    return Result.ok(recordedEntity);
  } catch (error) {
    return Result.err(error as Error);
  }

};

export default update;
