import type { AsyncResult } from "../types";
import type { Group } from "@prisma/client";
import client from "../client";
import { Result } from "@badrap/result";

type ReadGroupParams = {
    id: string
}

const read = async (params: ReadGroupParams): AsyncResult<Group> => {
  try {
    const group = await client.group.findFirst({
      where: {
        id: params.id,
      }
    });

    if (!group) {
      return Result.err(new Error("Group does not exist"));
    }

    return Result.ok(group);
        
  } catch (error) {
    return Result.err(error as Error);
  }

};


export default read;

