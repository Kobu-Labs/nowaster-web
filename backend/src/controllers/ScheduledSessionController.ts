import { Router } from "express";
import scheduledSessionRepo from "@/src/repositories/scheduled_entity";
import { handleOkResp, handleResultErrorResp } from "@/src/controllers/utils/handleResponse";
import { validate } from "@/src/middleware/validation";
import { ScheduledSessionRequestSchema } from "@kobu-labs/nowaster-js-typing";
import categoryRepo from "@/src/repositories/category";
export const ScheduledController = Router();
const SessionsController = Router();
const CategoriesController = Router();

ScheduledController.use("/sessions", SessionsController);
ScheduledController.use("/categories", CategoriesController);


CategoriesController.get("/", async (_req, res) => {
  const categories = await categoryRepo.read.many();

  if (categories.isErr) {
    return handleResultErrorResp(500, res, categories.error);
  }

  return handleOkResp(categories.value, res);
});


// create new study session
SessionsController.post("/", validate({ body: ScheduledSessionRequestSchema.create }), async (req, res) => {
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
SessionsController.get("/", validate({ query: ScheduledSessionRequestSchema.readMany }), async (req, res) => {
  const scheduledSessionEntities = await scheduledSessionRepo.read.many(req.query);

  if (scheduledSessionEntities.isErr) {
    return handleResultErrorResp(500, res, scheduledSessionEntities.error);
  }

  return handleOkResp(scheduledSessionEntities.value, res);
});


// get specific session
SessionsController.get("/:id", validate({ params: ScheduledSessionRequestSchema.readById }), async (req, res) => {
  const scheduledSessionEntity = await scheduledSessionRepo.read.single(req.params);

  if (scheduledSessionEntity.isErr) {
    return handleResultErrorResp(500, res, scheduledSessionEntity.error);
  }

  return handleOkResp(scheduledSessionEntity.value, res);
});

// update study session
SessionsController.put("/", validate({ body: ScheduledSessionRequestSchema.update }), async (req, res) => {
  const updatedEntity = await scheduledSessionRepo.update(req.body);

  if (updatedEntity.isErr) {
    return handleResultErrorResp(500, res, updatedEntity.error);
  }

  return handleOkResp(updatedEntity.value, res);
});

// delete study session by id
SessionsController.delete("/", validate({ body: ScheduledSessionRequestSchema.remove }), async (req, res) => {
  const deletedEntity = await scheduledSessionRepo.remove.single(req.body);

  if (deletedEntity.isErr) {
    return handleResultErrorResp(500, res, deletedEntity.error);
  }

  return handleOkResp(deletedEntity.value, res);
});
