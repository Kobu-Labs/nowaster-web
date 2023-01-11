import type { AsyncResult } from "../types";
import client from "../client";
import { Result } from "@badrap/result";
import groupRepo from ".";
import userRepo from "../user";
import type { User } from "@prisma/client";

type LeaveUserParams = {
    UserId: string,
    groupId: string,
}

export const leave = async (params: LeaveUserParams): AsyncResult<User> => {
  try {
    return await client.$transaction(async (tx) => {
      const group = await groupRepo.read.byId({ id: params.groupId });
      if (group.isErr) {
        return Result.err(group.error);
      }
      await tx.userToGroup.deleteMany({
        where: {
          groupId: params.groupId,
          userId: params.UserId
        }
      });
      const userLeft = await userRepo.read.readSingle({id: params.UserId});
      if (userLeft.isErr){
        return Result.err(userLeft.error);
      }

      console.log("Left");
      return Result.ok(userLeft.value);
    });


  } catch (error) {
    return Result.err(error as Error);
  }

};
export default leave;
