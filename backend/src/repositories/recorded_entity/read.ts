import type { RecordedEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "../types";


type ReadSingleRecordedParams = {
    id: string
}

type ReadManyRecordedParams = {
    limit?: number | undefined
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

const many = async (params: ReadManyRecordedParams): AsyncResult<RecordedEntity[]> => {
  try {
    const recordedEntities = await client.recordedEntity.findMany({
      take: params.limit,
      orderBy: { startTime: "desc" }
    });

    return Result.ok(recordedEntities);
  } catch (error) {
    return Result.err(error as Error);
  }
};


const read = {
  single,
  many,
};

export default read;
