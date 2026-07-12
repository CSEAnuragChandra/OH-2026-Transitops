// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isLoginPage = nextUrl.pathname === "/login";

  // Allow public routes
  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Protect everything else
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Driver role can only access /driver
  const role = (session?.user as { role?: string })?.role;
  if (role === "DRIVER" && !nextUrl.pathname.startsWith("/driver")) {
    return NextResponse.redirect(new URL("/driver", nextUrl));
  }

  // Non-driver roles cannot access /driver
  if (role !== "DRIVER" && nextUrl.pathname.startsWith("/driver")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
