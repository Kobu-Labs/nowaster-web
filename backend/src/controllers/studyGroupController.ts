import { Request, Response, Router } from "express";
import {
  createGroupSchema,
  readGroupSchema,
  joinGroupSchema,
  deleteGroupSchema,
  generateInviteCodeSchema,
} from "./../models/groupValidation";
import groupRepo from "../repositories/study_group";
import { validate } from "./middleware/validation";
import { handleOkResp, handleResultErrorResp } from "./middleware/responseUtil";
import { handleErrorResp } from "./middleware/responseUtil";

export const GroupController = Router();

// create new study group
GroupController.post("/", validate({ body: createGroupSchema }), async (req: Request, res: Response) => {
  const groupEntity = await groupRepo.create(req.body);

  if (groupEntity.isErr) {
    return handleResultErrorResp(500, res, groupEntity.error);
  }

  return handleOkResp(groupEntity.value, res);

});

// get specific group
GroupController.get("/:id", validate({ params: readGroupSchema }), async (req, res) => {
  const groupEntity = await groupRepo.read(req.params);

  if (groupEntity.isErr) {
    return handleResultErrorResp(500, res, groupEntity.error);
  }

  return handleOkResp(groupEntity.value, res);
});

// user join group
GroupController.put("/", validate({ body: joinGroupSchema }), async (req, res) => {
  const group = await groupRepo.read({ id: req.body.groupId });
  if (group.isErr) {
    return handleResultErrorResp(500, res, group.error);
  }



  if (group.value.inviteOnly) {
    // TODO: check the code
  }



  const groupEntity = await groupRepo.update(req.body);

  if (groupEntity.isErr) {
    return handleResultErrorResp(500, res, groupEntity.error);
  }

  return handleOkResp(groupEntity.value, res);
});

// generate invite code
GroupController.post("/invite", validate({ body: generateInviteCodeSchema }), async (req, res) => {
  const group = await groupRepo.read({ id: req.body.groupId });
  if (group.isErr) {
    return handleResultErrorResp(500, res, group.error);
  }

  if (group.value.creatorId !== req.body.userId) {
    return handleErrorResp(401, res, "This user cannot generate invite links");
  }

  const inviteLink = await groupRepo.invite.generateCode({ groupId: req.body.groupId });
  if (inviteLink.isErr) {
    return handleResultErrorResp(500, res, inviteLink.error);
  }
  return handleOkResp(inviteLink.value, res);
});

// delete group session by id
GroupController.delete("/", validate({ body: deleteGroupSchema }), async (req, res) => {
  const deletedEntity = await groupRepo.remove(req.body);

  if (deletedEntity.isErr) {
    return handleResultErrorResp(500, res, deletedEntity.error);
  }

  return handleOkResp(deletedEntity.value, res);
});
