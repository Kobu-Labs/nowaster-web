import type { Group } from "@prisma/client";
import type { AsyncResult } from "../types";
import client from "../client";
import { Result } from "@badrap/result";


type RemoveGroupParams = {
    id: string
    creatorId: string
}

const remove = async (params: RemoveGroupParams): AsyncResult<Group> => {
  try {
    return await client.$transaction(async (tx) => {
      const group = await tx.group.findFirst({
        where: {
          id: params.id,
        }
      });

      if (!group) {
        return Result.err(new Error("Group does not exist"));
      }

      if (group.creatorId != params.creatorId) {
        return Result.err(new Error("User is not the owner of the group"));
      }
      await tx.userToGroup.deleteMany({
        where: {
          groupId: params.id
        }
      });

      await tx.groupInvite.deleteMany({
        where:{
          groupId: params.id
        }
      });

      const deletedGroup = await tx.group.delete({
        where: {
          id: params.id,
        }
      });

      return Result.ok(deletedGroup);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default remove;
