import {
  handleErrorResp,
  handleValidationErrorResp,
} from "@/src/controllers/utils/handleResponse";
import type { RequestHandler } from "express";
import { ZodError, ZodSchema } from "zod";

type Validations<TParams, TBody, TQuery> = {
  params?: ZodSchema<TParams>;
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
};

export const validate =
  <TParams = unknown, TBody = unknown, TQuery = unknown, TAny = unknown>(
    validation: Validations<TParams, TBody, TQuery>,
  ): RequestHandler<TParams, TAny, TBody, TQuery> =>
  async (req, res, next) => {
    try {
      if (validation.body) {
        req.body = validation.body.parse(req.body);
      }
      if (validation.params) {
        req.params = validation.params.parse(req.params);
      }
      if (validation.query) {
        req.query = validation.query.parse(req.query);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationErrorResp(error, res);
      }
      return handleErrorResp(500, res, `Unknown error ${error}`);
    }
  };
