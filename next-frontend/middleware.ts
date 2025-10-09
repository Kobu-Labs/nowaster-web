import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

type JwtClaims = {
  exp: number;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  const publicRoutes = ["/", "/sign-in", "/sign-up", "/auth"];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const claims = jwtDecode<JwtClaims>(accessToken);
    const now = Date.now() / 1000;

    if (claims.exp < now) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  } catch (error) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
