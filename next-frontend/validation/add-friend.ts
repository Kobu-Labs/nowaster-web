import { z } from "zod";

export const addFriendSchema = z.object({
  introductionMessage: z.string().optional(),
  username: z.string().min(1, "Username is required"),
});

export type AddFriendFormValues = z.infer<typeof addFriendSchema>;
