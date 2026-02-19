import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "curio-auth";

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get(COOKIE_NAME)?.value === "authenticated";
  const isLoginPage = request.nextUrl.pathname === "/curio/login";

  if (!isAuthenticated && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/curio/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/curio";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/curio/:path*"],
};
