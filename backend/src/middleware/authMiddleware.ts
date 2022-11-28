import type { NextFunction, Request, Response } from "express";

//TODO deleted roles
const auth = () => (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
};

export default auth;