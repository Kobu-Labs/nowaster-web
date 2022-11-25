import { z } from "zod";
import { userNameValidator } from "./validation";


export const createUserSchema = z.object({
  userName: userNameValidator,
  email: z.string()
    .email({ message: "Invalid email provided" }),
  hashedPassword: z.string(),
  salt: z.string(),
  // TODO: validate something idk
  avatar: z.string().nullable()
}
);


export const updateUserSchema = z.object({
  id: z.string().uuid(),
  userName: userNameValidator.optional(),
  email: z.string()
    .email({ message: "Invalid email provided" })
    .optional(),
  hashedPassword: z.string().optional(),
  salt: z.string().optional(),
  avatar: z.string().nullish(),
});


export const readSingleUserSchema = z.object({
  userId: z.string().uuid(),
});

export const readManyUsersSchema = z.object({
  limit: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive().max(100)
  )
});
