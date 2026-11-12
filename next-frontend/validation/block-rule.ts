import { z } from "zod";

export const blockRuleSchema = z.object({
  pattern: z
    .string()
    .trim()
    .min(1, "Domain is required")
    .max(253, "Domain must be at most 253 characters")
    .refine((value) => !/\s/.test(value), "Domain must not contain spaces")
    .refine(
      (value) => !/^[a-z][\d+.a-z-]*:\/\//i.test(value),
      "Remove the scheme (for example https://)",
    ),
});

export type BlockRuleFormValues = z.infer<typeof blockRuleSchema>;
