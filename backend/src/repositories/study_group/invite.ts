import type { AsyncResult } from "../types";
import client from "../client";
import { Result } from "@badrap/result";
import { randomBytes } from "crypto";
import type { GroupInvite } from "@prisma/client";

type GenerateInviteParams = {
    groupId: string,
}

const generateCode = async (params: GenerateInviteParams): AsyncResult<GroupInvite> => {
  const code = randomBytes(3).toString("hex");
  try {
    return await client.$transaction(async (tx) => {
      const invite = await tx.groupInvite.create({ data: { groupId: params.groupId, code: code } });
      return Result.ok(invite);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

type DeleteInviteLinkParams = {
    groupId: string,
    code: string
}

const deleteCode = async (params: DeleteInviteLinkParams): AsyncResult<boolean> => {
  try {
    return await client.$transaction(async (tx) => {
      await tx.groupInvite.deleteMany({ where: { ...params } });
      return Result.ok(true);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

type ValidateInviteCode = {
    code: string,
    groupId: string
}

const validateCode = async (params: ValidateInviteCode): AsyncResult<boolean> => {
  try {
    return await client.$transaction(async (tx) => {
      const code = await tx.groupInvite.findFirst({
        where: {
          code: params.code, groupId: params.groupId
        }
      });
      return Result.ok(code === null);
    });
  } catch (error) {
    return Result.err(error as Error);
  }
};

const invite = {
  deleteCode,
  generateCode,
  validateCode,
};

export default invite; 
