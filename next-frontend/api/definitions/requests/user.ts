import { z } from "zod";

const create = z.object({
  id: z.string(),
  username: z.string().trim().min(1),
});

const update = z.object({
  id: z.string(),
  username: z.string().trim().min(1).optional(),
});

export type UserRequest = {
  [Property in keyof typeof UserRequestSchema]: z.infer<
    (typeof UserRequestSchema)[Property]
  >;
};

export const UserRequestSchema = {
  create,
  update,
} as const;
