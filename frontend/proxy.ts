import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_COOKIES = ["access_token", "refresh_token"] as const;

export function proxy(request: NextRequest) {
  const hasSessionCookie = PROTECTED_COOKIES.some((name) =>
    request.cookies.has(name),
  );

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/users/:path*"],
};
