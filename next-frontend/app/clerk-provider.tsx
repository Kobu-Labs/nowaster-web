"use client";

import { AuthContextProvider } from "@/app/auth-context";
import type { FC, PropsWithChildren } from "react";

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  return <AuthContextProvider>{children}</AuthContextProvider>;
};
