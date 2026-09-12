import { NextResponse } from "next/server";

// NOTE: middleware runs on the Edge runtime, which doesn't support the
// Node "crypto" module that jsonwebtoken needs. So we only check that the
// cookie exists here (fast redirect for logged-out users). Every admin API
// route (login, tournaments, registrations, bracket, match) independently
// verifies the JWT signature via getAdminFromRequest() before doing anything,
// so this is not a security hole — just a UX shortcut.
const COOKIE_NAME = "efb_admin_token";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
