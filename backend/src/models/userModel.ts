import { z } from "zod";
import { userNameValidator } from "./validation";


export const createUserSchema = z.object({
  username: userNameValidator,
  email: z.string()
    .email({ message: "Invalid email provided" }),
  password: z.string(),
  // TODO: validate something idk
  avatar: z.string().nullable()
}
);


export const updateUserSchema = z.object({
  id: z.string().uuid(),
  username: userNameValidator.optional(),
  email: z.string()
    .email({ message: "Invalid email provided" })
    .optional(),
  password: z.string().optional(),
  avatar: z.string().nullish(),
});


export const readSingleUserSchema = z.object({
  userId: z.string().uuid(),
});

export const readManyUsersSchema = z.object({
  limit: z.coerce.number().max(1000)
});

export const loginUserScheme = z.object({
  email: z.string().email({ message: "Invalid email provided" }),
  password: z.string(),
});
