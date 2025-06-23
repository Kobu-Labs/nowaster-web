import { SessionTemplateIdSchema } from "@/api/definitions/models/session-template";
import { z } from "zod";

const readMany = z.array(SessionTemplateIdSchema);

const create = z.null();

export type SessionTemplateResponse = {
  [Property in keyof typeof SessionTemplateResponseSchema]: z.infer<
    (typeof SessionTemplateResponseSchema)[Property]
  >;
};

export const SessionTemplateResponseSchema = {
  create,
  readMany,
} as const;
