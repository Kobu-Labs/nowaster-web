import type { AsyncResult } from "../types";
import client from "../client";
import { Result } from "@badrap/result";
import groupRepo from ".";
import userRepo from "../user";
import type { User } from "@prisma/client";

type KickUserParams = {
    kickedUserId: string,
    kickingUserId: string,
    groupId: string,
}

export const kickUser = async (params: KickUserParams): AsyncResult<User> => {
  try {
    return await client.$transaction(async (tx) => {
      const group = await groupRepo.read.byId({ id: params.groupId });
      if (group.isErr) {
        return Result.err(group.error);
      }
      if (group.value.creatorId !== params.kickingUserId) {
        return Result.err(new Error("You cannot kick this user"));
      }
      await tx.userToGroup.deleteMany({
        where: {
          groupId: params.groupId,
          userId: params.kickedUserId
        }
      });
      const kickedUser = await userRepo.read.readSingle({id: params.kickedUserId});
      if (kickedUser.isErr){
        return Result.err(kickedUser.error);
      }

      console.log("kicked");
      return Result.ok(kickedUser.value);
    });


  } catch (error) {
    return Result.err(error as Error);
  }

};
export default kickUser;
