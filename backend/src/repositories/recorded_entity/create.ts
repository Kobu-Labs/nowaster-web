import type { RecordedEntity } from "@prisma/client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type { RecordedSessionRequest } from "@kobu-labs/nowaster-js-typing";


const create = async (params: RecordedSessionRequest["create"]): AsyncResult<RecordedEntity> => {
  const { category, ...rest } = params;
  try {
    const recordedEntity = await client.recordedEntity.create({
      data: {
        ...rest,
        category: category.name,
      }
    });
    return Result.ok(recordedEntity);
  } catch (error) {
    return Result.err(error as Error);
  }

};


export default create;
