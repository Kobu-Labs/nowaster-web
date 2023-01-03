import { Request, Response, Router } from "express";
import {
  createGroupSchema,
  readGroupSchema,
  joinGroupSchema,
  deleteGroupSchema,
  generateInviteCodeSchema,
  getGroupsByUser,
  getUserDetailsPerGroup,
  getUsersOfGroupParams,
  kickUserSchema,
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
  const groupEntity = await groupRepo.read.byId(req.params);

  if (groupEntity.isErr) {
    return handleResultErrorResp(500, res, groupEntity.error);
  }

  return handleOkResp(groupEntity.value, res);
});

// user join group
GroupController.put("/", validate({ body: joinGroupSchema }), async (req, res) => {
  const group = await groupRepo.read.byId({ id: req.body.groupId });
  if (group.isErr) {
    return handleResultErrorResp(500, res, group.error);
  }

  if (group.value.inviteOnly) {
    if (req.body.code === undefined) {
      return handleErrorResp(401, res, "Cannot join an invite only group");
    }
    const isCodeValid = await groupRepo.invite.validateCode({ code: req.body.code, groupId: req.body.groupId });
    if (isCodeValid.isErr || !isCodeValid.value){
      return handleErrorResp(401, res, "Failed to join this group");
    }
    await groupRepo.invite.deleteCode({
      groupId: req.body.groupId,
      code: req.body.code
    });
  }

  const groupEntity = await groupRepo.update(req.body);

  if (groupEntity.isErr) {
    return handleResultErrorResp(500, res, groupEntity.error);
  }

  return handleOkResp(groupEntity.value, res);
});


// get groups by user
GroupController.get("/user/:userId", validate({ params: getGroupsByUser }), async (req, res) => {
  const groups = await groupRepo.read.byUser(req.params);
  if (groups.isErr) {
    return handleResultErrorResp(500, res, groups.error);
  }

  return handleOkResp(groups.value, res);
});


// generate invite code
GroupController.post("/invite", validate({ body: generateInviteCodeSchema }), async (req, res) => {
  const group = await groupRepo.read.byId({ id: req.body.groupId });
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

// delete group by id
GroupController.delete("/", validate({ query: deleteGroupSchema }), async (req, res) => {
  const deletedEntity = await groupRepo.remove(req.query);

  if (deletedEntity.isErr) {
    return handleResultErrorResp(500, res, deletedEntity.error);
  }

  return handleOkResp(deletedEntity.value, res);
});

// get time per user in given group
GroupController.get("/details/:groupId", validate({ params: getUserDetailsPerGroup }), async (req, res) => {
  const data = await groupRepo.read.groupSummary(req.params);
  if (data.isErr) {
    return handleResultErrorResp(500, res, data.error);
  }

  return handleOkResp(data.value, res);
});

// get all users of particular group
GroupController.get("/users/:groupId", validate({ params: getUsersOfGroupParams }), async (req, res) => {
  const data = await groupRepo.read.usersOfGroup(req.params);
  if (data.isErr) {
    return handleResultErrorResp(500, res, data.error);
  }

  return handleOkResp(data.value, res);
});

// kick user from group
GroupController.post("/kick", validate({ body: kickUserSchema }), async (req, res) => {
  const data = await groupRepo.kick(req.body);
  if (data.isErr) {
    return handleResultErrorResp(500, res, data.error);
  }

  return handleOkResp(data.value, res);
});
