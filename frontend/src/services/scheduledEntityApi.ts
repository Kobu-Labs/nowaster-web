import baseApi from "./baseApi";
import { ResponseSingle } from "../models/response";
import {
  CreateScheduledEntity,
  GetByUserScheduledEntityData,
  ScheduledEntity,
} from "../models/scheduledEntity";
import { ResponseMulti } from "./types";

export const create = async (
  scheduledEntity: CreateScheduledEntity
): Promise<ResponseSingle<ScheduledEntity>> => {
  const resp = await baseApi.post<ResponseSingle<ScheduledEntity>>(
    "scheduled/",
    scheduledEntity
  );
  return resp.data;
};

export const getByUser = async (
  getByUserScheduledEntityData: GetByUserScheduledEntityData
): Promise<ResponseMulti<ScheduledEntity>> => {
  const resp = await baseApi.get<ResponseMulti<ScheduledEntity>>(
    "scheduled/" + getByUserScheduledEntityData.userId
  );
  return resp.data;
};
