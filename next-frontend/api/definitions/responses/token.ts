import { z } from "zod";
import { ApiTokenSchema } from "../models/token";

const list = z.array(ApiTokenSchema);

const create = z.object({
  createdAt: z.string(),
  description: z.string().nullable(),
  expiresAt: z.string().nullable(),
  id: z.string().uuid(),
  name: z.string(),
  token: z.string(),
});

const revoke = z.object({ success: z.boolean() });

export const TokenResponseSchema = { create, list, revoke };
