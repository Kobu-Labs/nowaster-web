import { z } from "zod";

export const addFriendSchema = z.object({
  username: z.string().min(1, "Username is required"),
  introductionMessage: z.string().optional(),
});

export type AddFriendFormValues = z.infer<typeof addFriendSchema>;
