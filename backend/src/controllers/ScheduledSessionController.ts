import { Router } from "express";
import { createScheduledSchema, deleteScheduledSchema, readByIdScheduledSchema, readManyScheduledSchema, updateScheduledSchema } from "../validation/scheduledSessionValidation";
import scheduledSessionRepo from "../repositories/scheduled_entity";
import { validate } from "../middleware/validation";
import { handleOkResp, handleResultErrorResp } from "./utils/handleResponse";

export const ScheduledController = Router();
const SessionsController = Router();
const CategoriesController = Router();

ScheduledController.use("/sessions", SessionsController);
ScheduledController.use("/categories", CategoriesController);


CategoriesController.get("/", async (_req, res) => {
  const categories = await scheduledSessionRepo.read.getCategories();

  if (categories.isErr) {
    return handleResultErrorResp(500, res, categories.error);
  }

  return handleOkResp(categories.value, res);
});


// create new study session
SessionsController.post("/", validate({ body: createScheduledSchema }), async (req, res) => {
  const scheduledSessionEntity = await scheduledSessionRepo.create(req.body);

  if (scheduledSessionEntity.isErr) {
    return handleResultErrorResp(500, res, scheduledSessionEntity.error);
  }
  return handleOkResp(scheduledSessionEntity.value, res);
});

// get currently running sessions
SessionsController.get("/active", async (_req, res) => {
  const scheduledSessions = await scheduledSessionRepo.read.many({ toStartTime: new Date(), fromEndTime: new Date() });

  if (scheduledSessions.isErr) {
    return handleResultErrorResp(500, res, scheduledSessions.error);
  }
  return handleOkResp(scheduledSessions.value, res);
});


// get users study sessions
SessionsController.get("/", validate({ query: readManyScheduledSchema }), async (req, res) => {
  const scheduledSessionEntities = await scheduledSessionRepo.read.many(req.query);

  if (scheduledSessionEntities.isErr) {
    return handleResultErrorResp(500, res, scheduledSessionEntities.error);
  }

  return handleOkResp(scheduledSessionEntities.value, res);
});


// get specific session
SessionsController.get("/:id", validate({ params: readByIdScheduledSchema }), async (req, res) => {
  const scheduledSessionEntity = await scheduledSessionRepo.read.single(req.params);

  if (scheduledSessionEntity.isErr) {
    return handleResultErrorResp(500, res, scheduledSessionEntity.error);
  }

  return handleOkResp(scheduledSessionEntity.value, res);
});

// update study session
SessionsController.put("/", validate({ body: updateScheduledSchema }), async (req, res) => {
  const updatedEntity = await scheduledSessionRepo.update(req.body);

  if (updatedEntity.isErr) {
    return handleResultErrorResp(500, res, updatedEntity.error);
  }

  return handleOkResp(updatedEntity.value, res);
});

// delete study session by id
SessionsController.delete("/", validate({ body: deleteScheduledSchema }), async (req, res) => {
  const deletedEntity = await scheduledSessionRepo.remove.single(req.body);

  if (deletedEntity.isErr) {
    return handleResultErrorResp(500, res, deletedEntity.error);
  }

  return handleOkResp(deletedEntity.value, res);
});
