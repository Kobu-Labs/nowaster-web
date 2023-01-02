import type { Ban } from "@prisma/client";
import type { AsyncResult } from "../types";
import { Result } from "@badrap/result";
import client from "../client";

type ReadByUserIdParams = {
    userId: string
};

export const byUserId = async (params: ReadByUserIdParams): AsyncResult<Ban[]> => {
  try {
    const recordedEntity = await client.ban.findMany({
      where: {
        userId: params.userId,
      }
    });
    
    return Result.ok(recordedEntity);    
  } catch (error) {
    return Result.err(error as Error);
  }
};

const read = {
  byUserId,
};
export default read;