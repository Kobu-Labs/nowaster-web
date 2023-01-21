import type { RecordedEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "../types";


type ReadSingleRecordedParams = {
    id: string
}

const single = async (params: ReadSingleRecordedParams): AsyncResult<RecordedEntity | null> => {
  try {
    const recordedEntity = await client.recordedEntity.findFirst({
      where: {
        id: params.id,
      }
    });

    return Result.ok(recordedEntity);
  } catch (error) {
    return Result.err(error as Error);
  }
};


const read = {
  single,
};

export default read;
