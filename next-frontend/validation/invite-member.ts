import { z } from "zod";

export const inviteMemberSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;
