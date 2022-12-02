import { Request, Response, Router } from "express";
import { createUserSchema, readManyUsersSchema, readSingleUserSchema, updateUserSchema } from "../models/userModel";
import userRepo from "../repositories/user";
import { handleErroredRequest } from "./utils";
import argon2 from "argon2";

export const UserController = Router();

UserController.put("/create", async (req: Request, res: Response) => {
  try {
    const userData = createUserSchema.parse(req.body);
    const hashedPassword = await argon2.hash(userData.password);
    const data = {
      username:userData.username,
      email:userData.email,
      avatar:userData.avatar,
      hashedPassword:hashedPassword,
    };
    const userEntity = await userRepo.create(data);

    if (userEntity.isOk) {
      req.session.user = { id: userEntity.value.id};
      res.send({ user: userEntity, message: "Success" });
    } else {
      userEntity.unwrap();
    }

  } catch (e) {
    handleErroredRequest(res, e);
  }
});


UserController.post("/update", async (req: Request, res: Response) => {
  try {
    // TODO: authenticate that user has permission to update thisuserNameValidator
    const userData = updateUserSchema.parse(req.body);
    const userEntity = await userRepo.update(userData);

    if (userEntity.isOk) {
      res.send({ user: userEntity, message: "Success" });
    } else {
      userEntity.unwrap();
    }

  } catch (e) {
    handleErroredRequest(res, e);
  }
});

UserController.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userData = readSingleUserSchema.parse(req.params);
    const userEntity = await userRepo.read.readSingle(userData);

    if (userEntity.isOk) {
      res.send({ user: userEntity, message: "Success" });
    } else {
      userEntity.unwrap();
    }

  } catch (e) {
    handleErroredRequest(res, e);
  }
});

UserController.get("/", async (req: Request, res: Response) => {
  try {
    const userData = readManyUsersSchema.parse(req.query);
    const userEntity = await userRepo.read.readMany(userData);

    if (userEntity.isOk) {
      res.send({ user: userEntity, message: "Success" });
    } else {
      userEntity.unwrap();
    }

  } catch (e) {
    handleErroredRequest(res, e);
  }
});
