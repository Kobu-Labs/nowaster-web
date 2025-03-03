import { UserSchema } from "@/api/definitions/models/user";
import { z } from "zod";

const create = UserSchema;
const update = UserSchema;

export type UserResponse = {
  [Property in keyof typeof UserResponseSchema]: z.infer<
    (typeof UserResponseSchema)[Property]
  >;
};

export const UserResponseSchema = {
  create,
  update,
} as const;
