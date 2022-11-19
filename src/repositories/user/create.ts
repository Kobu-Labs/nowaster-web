import { User } from "@prisma/client";
import { AsyncResult } from "../types";
import client from "../client";
import { Result } from "@badrap/result";

type CreateUserParams = Omit<User, "id">

const create = async (params: CreateUserParams): AsyncResult<User> => {
  try {
    return await client.$transaction(async (tx)=>{
      const userMail = await tx.user.findFirst({
        where: {
          email: params.email,
        }
      });

      if (userMail) {
        return Result.err(new Error(`Email ${params.email} already registered!`));
      }

      const user = await tx.user.create({ data: params });
      return Result.ok(user);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default create;
