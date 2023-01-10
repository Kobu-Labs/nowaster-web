import { Router } from "express";
import { validate } from "./middleware/validation";
import { handleOkResp, handleResultErrorResp } from "./middleware/responseUtil";
import { z } from "zod";
import userFunctionRepo from "../repositories/userFunctions";

export const UserFunctionController = Router();

const getUserFunctionsSchema = z.object({
    userId: z.string().uuid()
})

UserFunctionController.get("/user/:userId", validate({ params: getUserFunctionsSchema }), async (req, res) => {
  const userFunctions = await userFunctionRepo.read.byUser(req.params);

  if (userFunctions.isErr) {
    return handleResultErrorResp(500, res, userFunctions.error);
  }

  return handleOkResp(userFunctions.value, res);
});


const getUserFunctionsByNameSchema = z.object({
    userId: z.string().uuid(),
    name: z.string()
})

UserFunctionController.get("/name", validate({ params: getUserFunctionsByNameSchema }), async (req, res) => {
  const userFunctions = await userFunctionRepo.read.byName(req.params);

  if (userFunctions.isErr) {
    return handleResultErrorResp(500, res, userFunctions.error);
  }

  return handleOkResp(userFunctions.value, res);
});
