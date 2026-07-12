// src/proxy.ts
// Next.js 16 uses proxy.ts instead of middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { hasAccess, getDefaultRedirect } from "@/lib/rbac";
import type { Role } from "@prisma/client";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const pathname = nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isUnauthorizedPage = pathname === "/unauthorized";

  // Always allow the unauthorized page
  if (isUnauthorizedPage) return NextResponse.next();

  // Handle login page
  if (isLoginPage) {
    if (isLoggedIn) {
      const role = (session?.user as { role?: Role })?.role;
      return NextResponse.redirect(
        new URL(getDefaultRedirect(role ?? "DRIVER"), nextUrl)
      );
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const role = (session?.user as { role?: Role })?.role;

  // Driver portal — ONLY DRIVER role may access /driver routes
  if (pathname === "/driver" || pathname.startsWith("/driver/")) {
    if (role === "DRIVER") return NextResponse.next();
    // Non-driver staff hitting /driver → send to dashboard
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // DRIVER role has NO access to staff routes — redirect to their portal
  if (!role || role === "DRIVER") {
    return NextResponse.redirect(new URL("/driver", nextUrl));
  }

  // Enforce granular RBAC for dashboard routes
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/fleet") ||
    pathname.startsWith("/drivers") ||
    pathname.startsWith("/trips") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/fuel") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/safety");

  if (isDashboardRoute && !hasAccess(role, pathname)) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
