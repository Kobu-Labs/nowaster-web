import type { Ban } from "@prisma/client";
import type { AsyncResult } from "../types";
import { Result } from "@badrap/result";
import client from "../client";

type ReadByUserEmailParams = {
    email: string
};


export const byUserEmail = async (params: ReadByUserEmailParams): AsyncResult<Ban[]> => {
  try {
    const recordedEntity = await client.ban.findMany({
      where: {
        user: {
          email: params.email
        }
      }
    });

    return Result.ok(recordedEntity);
  } catch (error) {
    return Result.err(error as Error);
  }
};
const read = {
  byUserEmail,
};
export default read;
