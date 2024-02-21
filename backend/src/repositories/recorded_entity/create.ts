import type { RecordedEntity } from "@prisma/client";
import type { AsyncResult } from "../types";
import client from "../client";
import { Result } from "@badrap/result";
import type { RecordedSessionRequest } from "@/src/requests/recordedSessionRequests";


const create = async (params: RecordedSessionRequest["create"]): AsyncResult<RecordedEntity> => { 
  try {
    const recordedEntity = await client.recordedEntity.create({ data: params });
    return Result.ok(recordedEntity);
  } catch (error) {
    return Result.err(error as Error);
  }

};


export default create;
