import { ZodError } from "zod";
import { UserVisibleError } from "../repositories/types";
import type { Response } from "express";

export const handleErroredRequest = (res: Response, e: unknown) => {
  if (e instanceof ZodError) {
    res.status(400).send({ message: e.errors, info: "Validation error" });
  }
  else if (e instanceof UserVisibleError) {
    res.status(400).send({ message: e.message });
  }
  else {
    res.status(500).send({ message: "Something went wrong" });
  }
};
