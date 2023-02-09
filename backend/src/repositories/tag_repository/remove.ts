import type { Tag } from "@prisma/client";
import type { AsyncResult } from "../types";
import client from "../client";
import { Result } from "@badrap/result";

type DeleteTagParams = {
    id: string
}
const remove = async (params: DeleteTagParams) : AsyncResult<Tag>=> { 
  try {
    return await client.$transaction(async (tx)=>{
      const deletedTag = await tx.tag.delete({
        where: {
          id: params.id,
        }
      });
      return Result.ok(deletedTag);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default remove;
