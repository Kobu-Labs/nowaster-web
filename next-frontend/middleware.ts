import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/", "/sign-in", "/sign-up", "/auth"];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get("has_session")?.value === "true";

  if (!hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
