import type { AsyncResult } from "../types";
import type { RecordedEntity, } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";


type DeleteSingleParams = {
    id: string;
}

type DeleteManyParams = {
    ids: string[];
}

const single = async (params: DeleteSingleParams): AsyncResult<RecordedEntity> => {
  try {
    return await client.$transaction(async (tx) => {
      const deletedEntity = await tx.recordedEntity.delete({
        where: {
          id: params.id,
        }
      });
      return Result.ok(deletedEntity);
    });
  } catch (error) {
    return Result.err(error as Error);
  }

};

const many = async (params: DeleteManyParams): AsyncResult<RecordedEntity[]> => {
  try {
    return await client.$transaction(async (tx) => {
      const result = await tx.recordedEntity.findMany({
        where: {
          id: { in: params.ids },
        }
      });

      await tx.recordedEntity.deleteMany({
        where: {
          id: { in: params.ids },
        }
      });
      return Result.ok(result);
    });
  } catch (error) {
    return Result.err(error as Error);
  }

};


const remove = {
  single,
  many,
};
export default remove;
