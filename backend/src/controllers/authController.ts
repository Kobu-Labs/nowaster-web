import { Router } from "express";
import auth from "../middleware/authMiddleware";
import argon2 from "argon2";
import { loginUserScheme } from "../models/userModel";
import userRepo from "../repositories/user";
import { handleErrorResp } from "./middleware/responseUtil";
import { handleResultErrorResp } from "./middleware/responseUtil";
import { handleOkResp } from "./middleware/responseUtil";
import { validate } from "./middleware/validation";

const AuthController = Router();

/**
 * This endpoint provides information about the currenct authentication.
 * If the user is authorized it returns the user entity. If there is 
 * invalid cookie or missing cookie, it return 401.
 */
AuthController.get("/", auth(), async (req, res) => {
  const id = req.session.user?.id;
  if (id === undefined) {
    return handleErrorResp(401, res, "Unauthorized");
  }

  const userResult = await userRepo.read.readSingle({ id: id });
  if (userResult.isErr) {
    return handleResultErrorResp(404, res, userResult.error);
  }

  return handleOkResp(userResult.value, res);
});

/**
 * This endpoint after successful password verification add the user and
 * role to session stroge.
 */
AuthController.post("/login", validate({ body: loginUserScheme }), async (req, res) => {
  const { email, password } = req.body;
  const userResult = await userRepo.read.readSingle({ email: email });

  if (userResult.isErr) {
    return handleResultErrorResp(404, res, userResult.error);
  }

  const isVerified = await argon2.verify(userResult.value.hashedPassword, password);

  if (!isVerified) {
    return handleErrorResp(401, res, "Wrong password");
  }

  req.session.user = { id: userResult.value.id };
  return handleOkResp(userResult.value, res, "Logged in");
});


/**
 * Remove the authorized user from session storage.
 */
AuthController.post("/logout", async (req, res) => {
  req.session.destroy(() => undefined);
  return handleOkResp({}, res, "Logged out");
});

export default AuthController;
