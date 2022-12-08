import { z } from "zod";

export const registrationSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type UserLoginSubmit = {
  email: string,
  password: string,
}

export type UserRegistrationSubmit = z.infer<typeof registrationSchema>;
