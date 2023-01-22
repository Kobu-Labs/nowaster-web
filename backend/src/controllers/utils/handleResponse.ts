import type { Response } from "express";
import type z from "zod";
import { UserVisibleError } from "../../repositories/types";

export function handleErrorResp(status: number, res: Response, msg: string): Response {
  console.log(msg);
  return res.status(status).send({
    status: "error",
    data: {},
    message: msg,
  });
}

export function handleResultErrorResp(status: number, res: Response, err: Error): Response {
  console.log(err.message);
  return res.status(status).send({
    status: "error",
    data: {},
    message: err instanceof UserVisibleError ? err.message : "Something went wrong"
  });
}

export function handleOkResp<TData>(data: TData, res: Response, msg?: string): Response {
  return res.send({
    status: "success",
    data: data,
    message: msg,
  });
}

export function handleValidationErrorResp(error: z.ZodError, res: Response): Response {
  return res.status(400).send({
    status: "error",
    message: `Validation error: ${error.toString()}`,
  });
}
