import type { AsyncResult } from "../types";
import type { User } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type UpdateUserParams = {
    id: string;
    userName?: string;
    email?: string;
    hashedPassword?: string;
    salt?: string;
    avatar?: string | null;
}


const update = async (params: UpdateUserParams): AsyncResult<User> => { 
  try {
    const { id, ...data } = params;

    const user = await client.user.update({
      where: { 
        id: id,
      },
      data: {
        ...data
      }
    });
    return Result.ok(user);
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default update;
