import type { User } from "@prisma/client";
import { AsyncResult, UserVisibleError, } from "../types";
import client from "../client";
import { Result } from "@badrap/result";

type CreateUserParams = Omit<User, "id">

const create = async (params: CreateUserParams): AsyncResult<User> => {
  try {
    return await client.$transaction(async (tx) => {
      const isDuplicateEmail = await tx.user.findFirst({
        where: {
          email: params.email,
        }
      });
      if (isDuplicateEmail) {
        return Result.err(new UserVisibleError(`Email ${params.email} already registered!`));
      }

      const isDuplicateUserName = await tx.user.findFirst({
        where: {
          userName: params.userName,
        }
      });
      if (isDuplicateUserName) {
        return Result.err(new UserVisibleError(`Username ${params.userName} is already used!`));
      }

      const user = await tx.user.create({ data: params });
      return Result.ok(user);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default create;
