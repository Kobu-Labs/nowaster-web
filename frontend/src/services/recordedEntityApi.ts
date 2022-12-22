import baseApi from "./baseApi";
import {
  CreateRecordedEntity,
  DeleteRecordedEntity,
  FinishCurrentRecordedEntity,
  GetByUserIdRecordedEntity,
  RecordedEntity,
} from "../models/recordedEntity";
import { ResponseSingle } from "./types";
import { ScheduledEntityApi } from ".";

export const create = async (
  recordedEntityData: CreateRecordedEntity
): Promise<ResponseSingle<RecordedEntity>> => {
  const resp = await baseApi.post<ResponseSingle<RecordedEntity>>(
    "recorded/",
    recordedEntityData
  );
  return resp.data;
};

export const getByUserId = async (
  getByUserIdrecordedEntityData: GetByUserIdRecordedEntity
): Promise<ResponseSingle<RecordedEntity | null>> => {
  const resp = await baseApi.get<ResponseSingle<RecordedEntity | null>>(
    "recorded/" + getByUserIdrecordedEntityData.userId
  );
  return resp.data;
};

export const deleteSingle = async (
  deleteRecrodedEntityData: DeleteRecordedEntity
): Promise<ResponseSingle<RecordedEntity>> => {
  const resp = await baseApi.delete<ResponseSingle<RecordedEntity>>(
    "recorded/",
    {
      data: deleteRecrodedEntityData,
    }
  );
  return resp.data;
};

export const finishCurrent = async (params: FinishCurrentRecordedEntity) : Promise<ResponseSingle<RecordedEntity | null>> => {
  const entityToDelete = await getByUserId({ userId: params.userId })
  if (entityToDelete.status === "error" || entityToDelete.data === null) {
    return entityToDelete
  }

  const deletedEntity = await deleteSingle({id:entityToDelete.data.id})
  if (deletedEntity.status === "error"){
    return deletedEntity
  }

  const result = await ScheduledEntityApi.create({...entityToDelete.data,endTime: new Date()})
  return result
}
