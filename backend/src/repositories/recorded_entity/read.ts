import type { RecordedEntity } from "@prisma/client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";
import client from "@/src/repositories/client";
import type { RecordedSessionRequest } from "@kobu-labs/nowaster-js-typing";


const single = async (params: RecordedSessionRequest["readById"]): AsyncResult<RecordedEntity | null> => {
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

const many = async (params: RecordedSessionRequest["readMany"]): AsyncResult<RecordedEntity[]> => {
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
