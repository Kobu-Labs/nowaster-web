import { z } from "zod";

export const BlockRuleSchema = z.object({
  createdAt: z.string(),
  id: z.string(),
  pattern: z.string(),
});

export type BlockRule = z.infer<typeof BlockRuleSchema>;
