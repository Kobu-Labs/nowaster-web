import type { AsyncResult } from "../types";
import type { Group } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";
import join from "./join";

type CreateGroupParams = {
    creatorId: string,
    groupName: string,
}

const create = async (params: CreateGroupParams): AsyncResult<Group> => {
  try {
    return await client.$transaction(async (tx) => {
      const group = await tx.group.create({ data: params });
      const hasJoined = await join({ userId: params.creatorId, groupId: group.id });
      if (hasJoined.isErr) {
        throw new Error(hasJoined.error.message);
      }
      return Result.ok(group);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default create; 
