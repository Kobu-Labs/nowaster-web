import { z } from "zod";

export const ApiTokenSchema = z.object({
  createdAt: z.string(),
  description: z.string().nullable(),
  expiresAt: z.string().nullable(),
  id: z.string().uuid(),
  lastUsedAt: z.string().nullable(),
  name: z.string(),
  revokedAt: z.string().nullable(),
});

export type ApiToken = z.infer<typeof ApiTokenSchema>;
