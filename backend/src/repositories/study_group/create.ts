import type { AsyncResult } from "../types";
import type { Group } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type CreateGroupParams = {
    creatorId: string,
    groupName: string,
    inviteOnly: boolean
}

const create = async (params: CreateGroupParams): AsyncResult<Group> => {
  try {
    return await client.$transaction(async (tx) => {
      const group = await tx.group.create({ data: params });
      await tx.userToGroup.create({data:{ userId: params.creatorId, groupId: group.id }});
      return Result.ok(group);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default create; 
