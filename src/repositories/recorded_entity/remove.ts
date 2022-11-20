import type { AsyncResult } from "../types";
import type { RecordedEntity, } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";


type DeleteSingleParams = {
    id: string;
    userId: string;
}

type DeleteManyParams = {
    ids: string[];
    userId: string;
}

const single = async (params: DeleteSingleParams): AsyncResult<RecordedEntity> => {
  try {
    return await client.$transaction(async (tx)=>{
      const recordedEntity = await tx.recordedEntity.findFirst({
        where: {
          id: params.id,
        }
      });
    
      if (!recordedEntity) {
        return Result.err(new Error("Recorded entity does not exist"));
      }
    
      if (recordedEntity.userId != params.userId) {
        return Result.err(new Error("User is not the owner of the recorded entity"));
      }
    
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
    return await client.$transaction(async (tx)=>{
      const recordedEntity = await tx.recordedEntity.findMany({
        where: {
          id: {in: params.ids},
        }
      });

      if (recordedEntity.length !== params.ids.length) {
        const missingIds = params.ids.filter(x => !recordedEntity.map(obj => obj.id).includes(x));
        return Result.err(new Error("Could not find recorded entitites with id:" + missingIds.toString()));
      }

      if (!recordedEntity.every(x => x.userId === params.userId)) {
        return Result.err(new Error("User is not the owner of the recorded entity"));
      }

      await tx.recordedEntity.deleteMany({
        where: {
          id: {in: params.ids},
        }
      });
      return Result.ok(recordedEntity);
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
