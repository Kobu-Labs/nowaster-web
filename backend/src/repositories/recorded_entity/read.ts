import type { RecordedEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "../types";


type ReadSingleRecordByUserIdParams = {
    userId: string
};

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


const singleByUserId = async (params: ReadSingleRecordByUserIdParams): AsyncResult<RecordedEntity | null> => {
  try {
    const { userId } = params;


    const recordedEntity = await client.recordedEntity.findFirst({
      where: {
        userId: userId
      }
    });

    return Result.ok(recordedEntity);

  } catch (error) {
    return Result.err(error as Error);
  }
};

const read = {
  single,
  singleByUserId,
};

export default read;
