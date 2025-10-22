import { SessionTemplateIdSchema } from "@/api/definitions/models/session-template";
import { z } from "zod";

const readMany = z.array(SessionTemplateIdSchema);

const create = z.null();
const update = z.null();

const deleteTemplate = z.unknown();

const deleteRecurringSession = z.unknown();

export type SessionTemplateResponse = {
  [Property in keyof typeof SessionTemplateResponseSchema]: z.infer<
    (typeof SessionTemplateResponseSchema)[Property]
  >;
};

export const SessionTemplateResponseSchema = {
  create,
  deleteRecurringSession,
  deleteTemplate,
  readMany,
  update,
} as const;
