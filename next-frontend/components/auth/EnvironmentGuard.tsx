"use client";

import { env } from "@/env";
import { type FC, type PropsWithChildren } from "react";

type AppEnvironment = typeof env.NEXT_PUBLIC_APP_ENV;

type EnvironmentGuardProps
  = | { allow: AppEnvironment[]; reject?: never; }
    | { allow?: never; reject: AppEnvironment[]; };

export const EnvironmentGuard: FC<PropsWithChildren<EnvironmentGuardProps>> = ({
  allow,
  children,
  reject,
}) => {
  const current = env.NEXT_PUBLIC_APP_ENV;

  const passes = allow ? allow.includes(current) : !reject.includes(current);

  if (!passes) {
    return null;
  }

  return children;
};
