import type { Tag } from "@prisma/client";
import client from "@/src/repositories/client";
import { Result } from "@badrap/result";
import type { AsyncResult } from "@/src/repositories/types";

type DeleteTagParams = {
    id: string
}

// TODO: no endpoint is using this
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
