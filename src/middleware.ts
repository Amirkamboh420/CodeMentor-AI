import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/share"];

// Admin-only routes
const adminRoutes = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next();
  }

  // Allow API auth routes (NextAuth handles its own)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow share route (public read-only)
  if (pathname.startsWith("/share")) {
    return NextResponse.next();
  }

  // Check for session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "codementor-dev-secret-change-in-prod" });

  if (!token) {
    // For API routes, return a JSON 401 instead of a redirect — the route
    // handlers also perform their own getServerSession check, but skipping
    // the redirect here avoids confusing fetch() callers with HTML pages.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect to login with callback URL
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    const role = token.role as string;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      // Non-admin → redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets and auth API
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|api/auth).*)"],
};
