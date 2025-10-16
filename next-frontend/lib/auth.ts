"use client";

import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export type UserRole = "admin" | "user";

export type JwtClaims = {
  sub: string; // user_id
  role: UserRole;
  name: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

export type User = {
  id: string;
  role: UserRole;
  username: string;
};

/**
 * Get the access token from cookies
 */
export function getAccessToken(): string | null {
  return Cookies.get("access_token") ?? null;
}

/**
 * Get the refresh token from cookies
 */
export function getRefreshToken(): string | null {
  return Cookies.get("refresh_token") ?? null;
}

/**
 * Decode and validate the access token
 */
export function decodeAccessToken(token: string): JwtClaims | null {
  try {
    const claims = jwtDecode<JwtClaims>(token);

    // Check if token is expired
    const now = Date.now() / 1000;
    if (claims.exp < now) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

/**
 * Get the current user from the access token
 */
export function getCurrentUser(): User | null {
  const token = getAccessToken();
  if (!token) return null;

  const claims = decodeAccessToken(token);
  if (!claims) return null;

  return {
    id: claims.sub,
    role: claims.role,
    username: claims.name,
  };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Set auth tokens in cookies
 */
export function setAuthTokens(accessToken: string, refreshToken: string) {
  // Set access token cookie to expire in 30 days (same as refresh token)
  // The JWT inside expires in 15 min, but cookie persists so we can read it and detect "expired" vs "missing"
  Cookies.set("access_token", accessToken, {
    expires: 1 / 96, // 15 minutes in days (24 * 60 / 15 = 96)
    path: "/",
    sameSite: "lax",
  });

  // Set refresh token (30 days)
  Cookies.set("refresh_token", refreshToken, {
    expires: 30,
    path: "/",
    sameSite: "lax",
  });

  // Set session flag (readable by JS, persists to indicate user has logged in before)
  Cookies.set("has_session", "true", {
    expires: 30,
    path: "/",
    sameSite: "lax",
  });
}

export function setAccessToken(accessToken: string) {
  Cookies.set("access_token", accessToken, {
    expires: 30,
    path: "/",
    sameSite: "lax",
  });
}

/**
 * Clear all auth cookies
 */
export function clearAuthCookies() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("has_session");
}

export function hasSession(): boolean {
  return Cookies.get("has_session") === "true";
}
