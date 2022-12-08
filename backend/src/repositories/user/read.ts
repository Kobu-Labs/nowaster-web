import { AsyncResult, UserVisibleError } from "../types";
import type { User } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type ReadUserParams = {
    id: string
} | { email: string }

const readSingle = async (params: ReadUserParams): AsyncResult<User> => {
  try {
    const user = await client.user.findFirst({
      where: params
    });

    if (!user) {
      return Result.err(new UserVisibleError("User does not exist"));
    }

    return Result.ok(user);

  } catch (error) {
    return Result.err(error as Error);
  }
};

type ReadManyUserParams = {
    limit: number
}

const readMany = async (params: ReadManyUserParams): AsyncResult<User[]> => {
  try {
    const user = await client.user.findMany({
      take: params.limit
    });

    if (!user) {
      return Result.err(new Error("User does not exist"));
    }

    return Result.ok(user);

  } catch (error) {
    return Result.err(error as Error);
  }
};


const read = {
  readSingle,
  readMany
};
export default read;
