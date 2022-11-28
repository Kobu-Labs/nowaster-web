import { Request, Response, Router } from "express";
import { handleErroredRequest } from "./utils";
import {
  createGroupSchema,
  readGroupSchema,
  updateGroupSchema,
  deleteGroupSchema,
} from "./../models/groupValidation";
import groupRepo from "../repositories/study_group";

export const GroupController = Router();

// create new study group
GroupController.post("/", async (req: Request, res: Response) => {
  try {
    const groupData = createGroupSchema.parse(req.body);
    const groupEntity = await groupRepo.create(groupData);

    if (groupEntity.isOk) {
      res.send({ group: groupEntity, message: "Success" });
    } else {
      groupEntity.unwrap();
    }
  } catch (e) {
    handleErroredRequest(res, e);
  }
});

// get specific group
GroupController.get("/:id", async (req: Request, res: Response) => {
  try {
    const groupData = readGroupSchema.parse(req.params);
    const groupEntity = await groupRepo.read(groupData);

    if (groupEntity.isOk) {
      res.send({ group: groupEntity, message: "Success" });
    } else {
      groupEntity.unwrap();
    }
  } catch (e) {
    handleErroredRequest(res, e);
  }
});

// add user to study group
GroupController.put("/", async (req, res) => {
  try {
    const groupData = updateGroupSchema.parse(req.body);
    const groupEntity = await groupRepo.update(groupData);

    if (groupEntity.isOk) {
      res.send({ group: groupEntity, message: "Success" });
    } else {
      groupEntity.unwrap();
    }
  } catch (e) {
    handleErroredRequest(res, e);
  }
});

// delete group session by id
GroupController.delete("/", async (req, res) => {
  try {
    const groupData = deleteGroupSchema.parse(req.body);
    const deletedEntity = await groupRepo.remove(groupData);

    if (deletedEntity.isOk) {
      res.send({ group: deletedEntity, message: "Success" });
    } else {
      deletedEntity.unwrap();
    }
  } catch (e) {
    handleErroredRequest(res, e);
  }
});
