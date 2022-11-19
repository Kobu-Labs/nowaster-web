import type { AsyncResult } from "../types";
import type { User } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type ReadUserParams = {
    userId: string
}

const read = async (params: ReadUserParams): AsyncResult<User> => {
  try {
    const user = await client.user.findFirst({
      where: {
        id: params.userId,
      }
    });

    if (!user) {
      return Result.err(new Error("User does not exist"));
    }

    return Result.ok(user);
        
  } catch (error) {
    return Result.err(error as Error);
  }

};


export default read;

