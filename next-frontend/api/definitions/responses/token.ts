import { z } from "zod";
import { ApiTokenSchema } from "../models/token";

const list = z.array(ApiTokenSchema);

const create = z.object({
  token: z.string(),
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
});

const revoke = z.object({ success: z.boolean() });

export const TokenResponseSchema = { list, create, revoke };
