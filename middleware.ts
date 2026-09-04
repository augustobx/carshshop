import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rutas públicas que no requieren autenticación
  const isPublicPath =
    path === "/login" ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/internal/caddy/ask") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/uploads");

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Comprobar cookie de sesión de OnlyCars
  const sessionToken = request.cookies.get("onlycars_user_session")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    if (path !== "/") {
      loginUrl.searchParams.set("redirect", path);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Inyectar header con el hostname para la resolución de tenant en Server Components
  const requestHeaders = new Headers(request.headers);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost";
  requestHeaders.set("x-tenant-host", host);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};