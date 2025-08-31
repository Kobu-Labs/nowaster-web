import { UserSchema } from "@/api/definitions/models/user";
import type { z } from "zod";

const create = UserSchema;
const update = UserSchema;
const updateVisibility = UserSchema;
const getProfile = UserSchema;

export type UserResponse = {
  [Property in keyof typeof UserResponseSchema]: z.infer<
    (typeof UserResponseSchema)[Property]
  >;
};

export const UserResponseSchema = {
  create,
  getProfile,
  update,
  updateVisibility,
} as const;
