import type { Ban } from "@prisma/client";
import type { AsyncResult } from "../types";
import { Result } from "@badrap/result";
import client from "../client";

type CreateBanParams = Omit<Ban, "id">

const create = async (params: CreateBanParams): AsyncResult<Ban> => {
  try {
    const recordedEntity = await client.ban.create({ data: params });
    return Result.ok(recordedEntity);
  } catch (error) {
    return Result.err(error as Error);
  }
};

export default create;
