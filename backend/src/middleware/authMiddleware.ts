import type { NextFunction, Request, Response } from "express";
import { handleErrorResp } from "../controllers/middleware/responseUtil";

//TODO deleted roles
const auth = () => (req: Request, res: Response, next: NextFunction) => {
  console.log("AUTH MIDDLEWARE");
  if (!req.session?.user) {
    return handleErrorResp(401, res, "Unauthorized");
  }

  return next();
};

export default auth;
