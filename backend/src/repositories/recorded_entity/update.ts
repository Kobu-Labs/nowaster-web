import type { RecordedEntity } from "@prisma/client";
import { Result } from "@badrap/result";
import client from "@/src/repositories/client";
import type { AsyncResult } from "@/src/repositories/types";
import type { RecordedSessionRequest } from "@kobu-labs/nowaster-js-typing";


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
