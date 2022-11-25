import type { AsyncResult } from "../types";
import type { User } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type UpdateUserParams = {
    id: string;
    userName?: string | undefined;
    email?: string | undefined;
    hashedPassword?: string | undefined;
    salt?: string | undefined;
    avatar?: string | null | undefined;
}


const update = async (params: UpdateUserParams): AsyncResult<User> => {
  try {
    const { id, ...data } = params;

    const user = await client.user.update({
      where: {
        id: id,
      },
      data: {
        // TODO: this is disgusting
        ...(data.userName !== undefined ? { userName: data.userName } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.hashedPassword !== undefined ? { hashedPassword: data.hashedPassword } : {}),
        ...(data.salt !== undefined ? { salt: data.salt } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
      }
    });
    return Result.ok(user);
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default update;
