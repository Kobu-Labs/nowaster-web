import { z } from "zod";

export const alphanumericRegex = new RegExp("^[a-zA-Z0-9]*$");

export const userNameValidator =
    z.string()
      .regex(alphanumericRegex, { message: "Username must be alphanumeric" })
      .max(16, { message: "Username can be of length max 16" })
      .min(3, { message: "Username must of length min 3" });
