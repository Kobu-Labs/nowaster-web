import type { AsyncResult } from "../types";
import type { RecordedEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";


type ReadAllRecordedParams = {
    categories?: string[];
    limit?: number;
    userId?: string;
    startDate?: Date;
    groupId?: string
};

type ReadSingleRecordedParams = {
    id: string
}

const single = async (params: ReadSingleRecordedParams): AsyncResult<RecordedEntity> => {
  try {
    const recordedEntity = await client.recordedEntity.findFirst({
      where: {
        id: params.id,
      }
    });

    if (!recordedEntity) {
      return Result.err(new Error("Recorded entity does not exist"));
    }

    return Result.ok(recordedEntity);
        
  } catch (error) {
    return Result.err(error as Error);
  }


};


const many = async (params: ReadAllRecordedParams): AsyncResult<RecordedEntity[]> => {
  try {
    const {limit, ...data} = params;

    const recordedEntity = await client.recordedEntity.findMany({
      where: {
        ...data
      },
      take: limit
    });

    if (!recordedEntity) {
      return Result.err(new Error("Recorded entity does not exist"));
    }

    return Result.ok(recordedEntity);
        
  } catch (error) {
    return Result.err(error as Error);
  }
};

const read = {
  single,
  many,
};

export default read;
