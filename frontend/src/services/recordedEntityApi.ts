import baseApi from "./baseApi";
import { ResponseSingle } from "../models/response";
import {
  CreateRecordedEntity,
  DeleteRecordedEntity,
  GetByUserIdRecordedEntity,
  RecordedEntity,
} from "../models/recordedEntity";

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
): Promise<ResponseSingle<RecordedEntity>> => {
  const resp = await baseApi.get<ResponseSingle<RecordedEntity>>(
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
