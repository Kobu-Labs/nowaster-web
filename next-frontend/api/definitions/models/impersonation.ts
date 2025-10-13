import { z } from "zod";

export const ImpersonationSchema = z.object({
  impersonationToken: z.string(),
  targetUserId: z.string(),
});

export type Impersonation = z.infer<typeof ImpersonationSchema>;
