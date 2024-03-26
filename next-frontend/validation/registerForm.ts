import { userNameSchema as usernameSchema } from "@/validation/utils";
import { z } from "zod";

export const registrationSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  username: usernameSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});
