import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(1),
});

export type Category = z.infer<typeof CategorySchema>
