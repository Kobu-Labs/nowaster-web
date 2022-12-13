import { UserVisibleError, type AsyncResult } from "../types";
import type { RecordedEntity } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";


type ReadSingleRecordByUserIdParams = {
    userId: string
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


const singleByUserId = async (params: ReadSingleRecordByUserIdParams): AsyncResult<RecordedEntity> => {
  try {
    const { userId } = params;


    const recordedEntity = await client.recordedEntity.findFirst({
      where: {
        userId: userId
      }
    });


    if (!recordedEntity) {
      return Result.err(new UserVisibleError("Recorded entity does not exist"));
    }

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
