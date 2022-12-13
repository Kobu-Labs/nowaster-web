import baseApi from "./baseApi";
import { ResponseSingle } from "../models/response";
import {
  CreateScheduledEntity,
  ScheduledEntity,
} from "../models/scheduledEntity";

export const create = async (
  scheduledEntity: CreateScheduledEntity
): Promise<ResponseSingle<ScheduledEntity>> => {
  const resp = await baseApi.post<ResponseSingle<ScheduledEntity>>(
    "scheduled/",
    scheduledEntity
  );
  return resp.data;
};
