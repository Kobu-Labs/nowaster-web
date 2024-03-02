import type { RecordedEntity } from "@prisma/client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type { RecordedSessionRequest } from "@kobu-labs/nowaster-js-typing";


const create = async (params: RecordedSessionRequest["create"]): AsyncResult<RecordedEntity> => { 
  try {
    const recordedEntity = await client.recordedEntity.create({ data: params });
    return Result.ok(recordedEntity);
  } catch (error) {
    return Result.err(error as Error);
  }

};


export default create;
