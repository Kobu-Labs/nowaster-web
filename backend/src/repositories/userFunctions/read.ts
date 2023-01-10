import type { UserFunction } from "@prisma/client";
import type { AsyncResult } from "../types";
import client from "../client";
import { Result } from "@badrap/result";

type GetUserFunctionsByUser = {
    userId: string
}
const byUser = async (params: GetUserFunctionsByUser): AsyncResult<UserFunction[]> => {
  try {
    const userFunctions = await client.userFunction.findMany({
      where: {
        UserFunctionToUser: {
          some: {
            userId: params.userId
          }
        }
      }
    });

    return Result.ok(userFunctions);
  } catch (error) {
    return Result.err(error as Error);
  }
};

type GetUserFunctionsByName = {
    name: string
    userId: string
}

const byName = async (params: GetUserFunctionsByName): AsyncResult<UserFunction | null> => {
  try {
    const userFunctions = await client.userFunction.findFirst({
      where: {
        UserFunctionToUser: {
          some: {
            userId: params.userId
          },
        },
        name: params.name
      }
    });

    return Result.ok(userFunctions);
  } catch (error) {
    return Result.err(error as Error);
  }
};

const read = {
  byUser,
  byName,

};

export default read;
