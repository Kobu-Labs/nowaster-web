"use client";

import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export type JwtClaims = {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  name: string;
  role: UserRole;
  sub: string;
};

export type User = {
  id: string;
  role: UserRole;
  username: string;
};

export type UserRole = "admin" | "user";

export function clearAuthCookies() {
  Cookies.remove("user_hint");
}

export function decodeAccessToken(token: string): JwtClaims | null {
  try {
    const claims = jwtDecode<JwtClaims>(token);
    const now = Date.now() / 1000;
    if (claims.exp < now) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export function getCurrentUser(): null | User {
  const userHint = Cookies.get("user_hint");
  if (!userHint) {
    return null;
  }

  try {
    return JSON.parse(userHint) as User;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function setUserFromToken(accessToken: string) {
  const claims = decodeAccessToken(accessToken);
  if (!claims) {
    return;
  }

  Cookies.set("user_hint", JSON.stringify({
    id: claims.sub,
    role: claims.role,
    username: claims.name,
  } satisfies User), {
    expires: 30,
    path: "/",
    sameSite: "lax",
  });
}
