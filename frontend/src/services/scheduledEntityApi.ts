import baseApi from "./baseApi";
import { ResponseSingle } from "./types";
import {
  CreateScheduledEntity,
  GetByUserScheduledEntityData,
  ScheduledEntity,
  UpdateScheduledEntityParams,
  DeleteSingleScheduledParams,
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

export const update = async (params:UpdateScheduledEntityParams ) : Promise<ResponseSingle<ScheduledEntity>> => {
  const resp = await baseApi.put<ResponseSingle<ScheduledEntity>>("scheduled/", {...params})
  return resp.data
}

export const removeSingle = async (id: DeleteSingleScheduledParams) : Promise<ResponseSingle<ScheduledEntity>> => {
  const resp = await baseApi.delete<ResponseSingle<ScheduledEntity>>("scheduled/", {data: id});
  return resp.data;
}