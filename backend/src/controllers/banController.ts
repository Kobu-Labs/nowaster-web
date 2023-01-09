import { Router } from "express";
import { handleOkResp, handleResultErrorResp } from "./middleware/responseUtil";
import { validate } from "./middleware/validation";
import banRepo from "../repositories/ban";
import { createBanSchema, readBanSchema } from "../models/banValidation";


export const BanController = Router();


BanController.post("/", validate({ body: createBanSchema }), async (req, res) => {
  const recordedSessionEntity = await banRepo.create(req.body);
  
  if (recordedSessionEntity.isErr) {
    return handleResultErrorResp(500, res, recordedSessionEntity.error);
  }
  //TODO: .value
  return handleOkResp(recordedSessionEntity, res);
});

BanController.get("/:email", validate({ params: readBanSchema }), async (req, res) => {
  const recordedSessionEntities = await banRepo.read.byUserEmail(req.params);
  
  if (recordedSessionEntities.isErr) {
    return handleResultErrorResp(500, res, recordedSessionEntities.error);
  }
  return handleOkResp(recordedSessionEntities.value, res);
});
