import { z } from "zod";
import { userNameSchema as usernameSchema } from "./utils";

export const registrationSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  username: usernameSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});
