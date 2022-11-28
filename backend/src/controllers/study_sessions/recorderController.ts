import { Request, Response, Router } from "express";
import { handleErroredRequest } from "../utils";
import { createRecordedSchema, deleteRecordedSchema, readByIdRecordedSchema, readRecordedSchema, updateRecordedSchema } from "../../models/recorded_validation";
import recordedSessionRepo from "../../repositories/recorded_entity";

export const RecordedController = Router();


// create new study session
RecordedController.post("/", async (req: Request, res: Response) => {
  try {
    const recordedSessionData = createRecordedSchema.parse(req.body);
    const recordedSessionEntity = await recordedSessionRepo.create(recordedSessionData);


    if (recordedSessionEntity.isOk) {
      res.send({ recordedSession: recordedSessionEntity, message: "Success" });
    } else {
      recordedSessionEntity.unwrap();
    }
  } catch (e) {
    handleErroredRequest(res, e);
  }
});


// get users study sessions
RecordedController.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userData = readRecordedSchema.parse(req.params);
    const recordedSessionEntity = await recordedSessionRepo.read.many(userData);

    if (recordedSessionEntity.isOk) {
      res.send({ recordedSession: recordedSessionEntity, message: "Success" });
    } else {
      recordedSessionEntity.unwrap();
    }

  } catch (e) {
    handleErroredRequest(res, e);
  }
});


// get specific session
RecordedController.get("/:userId/:id", async (req: Request, res: Response) => {
  try {
    const userData = readByIdRecordedSchema.parse(req.params);
    const recordedSessionEntity = await recordedSessionRepo.read.single(userData);

    if (recordedSessionEntity.isOk) {
      res.send({ recordedSession: recordedSessionEntity, message: "Success" });
    } else {
      recordedSessionEntity.unwrap();
    }

  } catch (e) {
    handleErroredRequest(res, e);
  }
});


// update study session
RecordedController.put("/", async (req, res) => {
  try {
    const data = updateRecordedSchema.parse(req.body);
    const updatedEntity = await recordedSessionRepo.update(data);

    if (updatedEntity.isOk) {
      res.send({ recordedSession: updatedEntity, message: "Success" });
    } else {
      updatedEntity.unwrap();
    }
  } catch (e) {
    handleErroredRequest(res, e);
  }
});

// delete study session by id
RecordedController.delete("/", async (req, res) => {
  try {
    const data = deleteRecordedSchema.parse(req.body);
    const deletedEntity = await recordedSessionRepo.remove.single(data);

    if (deletedEntity.isOk) {
      res.send({ recordedSession: deletedEntity, message: "Success" });
    } else {
      deletedEntity.unwrap();
    }
  } catch (e) {
    handleErroredRequest(res, e);
  }
});
