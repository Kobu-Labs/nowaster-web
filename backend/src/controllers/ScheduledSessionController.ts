import { Router } from "express";
import scheduledSessionRepo from "@/src/repositories/scheduled_entity";
import {
  handleOkResp,
  handleResultErrorResp,
} from "@/src/controllers/utils/handleResponse";
import { validate } from "@/src/middleware/validation";
import { ScheduledSessionRequestSchema } from "@kobu-labs/nowaster-js-typing";

export const ScheduledController = Router();
const SessionsController = Router();

ScheduledController.use("/sessions", SessionsController);

// create new study session
SessionsController.post(
  "/",
  validate({ body: ScheduledSessionRequestSchema.create }),
  async (req, res) => {
    const scheduledSessionEntity = await scheduledSessionRepo.create(req.body);

    if (scheduledSessionEntity.isErr) {
      return handleResultErrorResp(500, res, scheduledSessionEntity.error);
    }
    return handleOkResp(scheduledSessionEntity.value, res);
  },
);

// get currently running sessions
SessionsController.get("/active", async (_req, res) => {
  const scheduledSessions = await scheduledSessionRepo.read.many({
    toStartTime: { value: new Date() },
    fromEndTime: { value: new Date() },
  });

  if (scheduledSessions.isErr) {
    return handleResultErrorResp(500, res, scheduledSessions.error);
  }
  return handleOkResp(scheduledSessions.value, res);
});

// get users study sessions
SessionsController.get(
  "/",
  validate({ query: ScheduledSessionRequestSchema.readMany }),
  async (req, res) => {
    const scheduledSessionEntities = await scheduledSessionRepo.read.many(
      req.query,
    );

    if (scheduledSessionEntities.isErr) {
      return handleResultErrorResp(500, res, scheduledSessionEntities.error);
    }

    return handleOkResp(scheduledSessionEntities.value, res);
  },
);

// get specific session
SessionsController.get(
  "/:id",
  validate({ params: ScheduledSessionRequestSchema.readById }),
  async (req, res) => {
    const scheduledSessionEntity = await scheduledSessionRepo.read.single(
      req.params,
    );

    if (scheduledSessionEntity.isErr) {
      return handleResultErrorResp(500, res, scheduledSessionEntity.error);
    }

    return handleOkResp(scheduledSessionEntity.value, res);
  },
);

// update study session
SessionsController.put(
  "/",
  validate({ body: ScheduledSessionRequestSchema.update }),
  async (req, res) => {
    const updatedEntity = await scheduledSessionRepo.update(req.body);

    if (updatedEntity.isErr) {
      return handleResultErrorResp(500, res, updatedEntity.error);
    }

    return handleOkResp(updatedEntity.value, res);
  },
);

// delete study session by id
SessionsController.delete(
  "/",
  validate({ body: ScheduledSessionRequestSchema.remove }),
  async (req, res) => {
    const deletedEntity = await scheduledSessionRepo.remove.single(req.body);

    if (deletedEntity.isErr) {
      return handleResultErrorResp(500, res, deletedEntity.error);
    }

    return handleOkResp(deletedEntity.value, res);
  },
);
