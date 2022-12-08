import { Router } from "express";
import { createUserSchema, readManyUsersSchema, readSingleUserSchema, updateUserSchema } from "../models/userModel";
import userRepo from "../repositories/user";
import argon2 from "argon2";
import { validate } from "./middleware/validation";
import { handleOkResp, handleResultErrorResp } from "./middleware/responseUtil";

export const UserController = Router();


UserController.put("/create", validate({ body: createUserSchema }), async (req, res) => {
  const hashedPassword = await argon2.hash(req.body.password);
  const data = {
    username: req.body.username,
    email: req.body.email,
    avatar: req.body.avatar,
    hashedPassword: hashedPassword,
  };
  const userEntity = await userRepo.create(data);

  if (userEntity.isErr) {
    return handleResultErrorResp(500, res, userEntity.error);
  }

  req.session.user = { id: userEntity.value.id };
  return handleOkResp(userEntity.value, res);
});


UserController.post("/update", validate({ body: updateUserSchema }), async (req, res) => {
  // TODO: authenticate that user has permission to update thisuserNameValidator
  const userEntity = await userRepo.update(req.body);

  if (userEntity.isErr) {
    return handleResultErrorResp(500, res, userEntity.error);
  }

  return handleOkResp(userEntity.value, res);
});

UserController.get("/:userId", validate({ params: readSingleUserSchema }), async (req, res) => {
  const userEntity = await userRepo.read.readSingle(req.params);

  if (userEntity.isErr) {
    return handleResultErrorResp(500, res, userEntity.error);
  }

  return handleOkResp(userEntity.value, res);
});

UserController.get("/", validate({ query: readManyUsersSchema }), async (req, res) => {
  const userEntity = await userRepo.read.readMany(req.query);

  if (userEntity.isErr) {
    return handleResultErrorResp(500, res, userEntity.error);
  }

  return handleOkResp(userEntity.value, res);
});
