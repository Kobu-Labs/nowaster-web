import type { UserToGroup } from "@prisma/client";
import type { AsyncResult } from "../types";
import client from "../client";
import { Result } from "@badrap/result";


type JoinGroupParams = {
    userId: string,
    groupId: string,
}

const join = async (params: JoinGroupParams): AsyncResult<UserToGroup> => {
  try {
    const userToGroup = await client.userToGroup.create({ data: params});
    return Result.ok(userToGroup);
  } catch (error) {
    return Result.err(error as Error);
  }

};


export default join;
