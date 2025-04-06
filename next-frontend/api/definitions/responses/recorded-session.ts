import { StopwatchSessionWithIdSchema } from "@/api/definitions/models";
import { z } from "zod";

const create = StopwatchSessionWithIdSchema;
const remove = z.null();
const update = StopwatchSessionWithIdSchema;

export type StopwatchSessionResponse = {
  [Property in keyof typeof StopwatchSessionResponseSchema]: z.infer<
    (typeof StopwatchSessionResponseSchema)[Property]
  >;
};

export const StopwatchSessionResponseSchema = {
  remove,
  update,
  create,
} as const;
