import { Router } from "express";
import { createScheduledSchema, deleteScheduledSchema, readByIdScheduledSchema,  updateScheduledSchema } from "../../models/scheduledValidation";
import scheduledSessionRepo from "../../repositories/scheduled_entity";
import { handleOkResp, handleResultErrorResp } from "../middleware/responseUtil";
import { validate } from "../middleware/validation";

export const ScheduledController = Router();


// create new study session
ScheduledController.post("/", validate({ body: createScheduledSchema }), async (req, res) => {
  const scheduledSessionEntity = await scheduledSessionRepo.create(req.body);
  
  if (scheduledSessionEntity.isErr) {
    return handleResultErrorResp(500, res, scheduledSessionEntity.error);
  }
  return handleOkResp(scheduledSessionEntity.value, res);
});


// get users study sessions
ScheduledController.get("/", async (_req, res) => {
  const scheduledSessionEntities = await scheduledSessionRepo.read.many();

  if (scheduledSessionEntities.isErr) {
    return handleResultErrorResp(500, res, scheduledSessionEntities.error);
  }

  return handleOkResp(scheduledSessionEntities.value, res);
});


// get specific session
ScheduledController.get("/:id", validate({ params: readByIdScheduledSchema }), async (req, res) => {
  const scheduledSessionEntity = await scheduledSessionRepo.read.single(req.params);

  if (scheduledSessionEntity.isErr) {
    return handleResultErrorResp(500, res, scheduledSessionEntity.error);
  }

  return handleOkResp(scheduledSessionEntity.value, res);
});

// update study session
ScheduledController.put("/", validate({ body: updateScheduledSchema }), async (req, res) => {
  const updatedEntity = await scheduledSessionRepo.update(req.body);

  if (updatedEntity.isErr) {
    return handleResultErrorResp(500, res, updatedEntity.error);
  }

  return handleOkResp(updatedEntity.value, res);
});

// delete study session by id
ScheduledController.delete("/", validate({ body: deleteScheduledSchema }), async (req, res) => {
  const deletedEntity = await scheduledSessionRepo.remove.single(req.body);

  if (deletedEntity.isErr) {
    return handleResultErrorResp(500, res, deletedEntity.error);
  }

  return handleOkResp(deletedEntity.value, res);
});
