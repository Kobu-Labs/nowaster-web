import type { NextFunction, Request, Response } from "express";
import { handleErrorResp } from "../controllers/middleware/responseUtil";

const auth = () => (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return handleErrorResp(401, res, "Unauthorized");
  }

  return next();
};

export default auth;
