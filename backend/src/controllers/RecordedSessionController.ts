import { Router } from "express";
import { validate } from "../middleware/validation";
import recordedSessionRepo from "../repositories/recorded_entity";
import { handleOkResp, handleResultErrorResp } from "./utils/handleResponse";
import { createRecordedSchema, deleteRecordedSchema, readByIdRecordedSchema, readManyRecordedSchema, updateRecordedSchema } from "../validation/recordedSessionValidation";

export const RecordedController = Router();

// create new study session
RecordedController.post("/", validate({ body: createRecordedSchema }), async (req, res) => {
  const recordedSessionEntity = await recordedSessionRepo.create(req.body);

  if (recordedSessionEntity.isErr) {
    return handleResultErrorResp(500, res, recordedSessionEntity.error);
  }
  //TODO: .value
  return handleOkResp(recordedSessionEntity, res);
});

// get all sessions - sorted by date descending
RecordedController.get("/", validate({ query: readManyRecordedSchema }), async (req, res) => {
  const recordedSessionEntity = await recordedSessionRepo.read.many(req.query);

  if (recordedSessionEntity.isErr) {
    return handleResultErrorResp(500, res, recordedSessionEntity.error);
  }
  //TODO: .value
  return handleOkResp(recordedSessionEntity, res);
});

// get specific session
RecordedController.get("/:id", validate({ params: readByIdRecordedSchema }), async (req, res) => {
  const recordedSessionEntity = await recordedSessionRepo.read.single(req.params);

  if (recordedSessionEntity.isErr) {
    return handleResultErrorResp(500, res, recordedSessionEntity.error);
  }
  //TODO: .value
  return handleOkResp(recordedSessionEntity, res);
});


// update study session
RecordedController.put("/", validate({ body: updateRecordedSchema }), async (req, res) => {
  const updatedEntity = await recordedSessionRepo.update(req.body);

  if (updatedEntity.isErr) {
    return handleResultErrorResp(500, res, updatedEntity.error);
  }
  //TODO: .value
  return handleOkResp(updatedEntity, res);
});

// delete study session by id
RecordedController.delete("/", validate({ body: deleteRecordedSchema }), async (req, res) => {
  const deletedEntity = await recordedSessionRepo.remove.single(req.body);

  if (deletedEntity.isErr) {
    return handleResultErrorResp(500, res, deletedEntity.error);
  }
  //TODO: .value
  return handleOkResp(deletedEntity, res);
}); 