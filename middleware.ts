import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function normalizeHostname(host: string | null): string {
  if (!host) return "";
  return host.split(":")[0].trim().toLowerCase();
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const host = normalizeHostname(
    request.headers.get("x-forwarded-host") || request.headers.get("host")
  );
  const platformHost = normalizeHostname(process.env.PLATFORM_HOST || "onlycars.nanoapps.ar");
  const isPlatformHost = host === platformHost;

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

  const sessionToken = request.cookies.get("onlycars_user_session")?.value;

  // onlycars.nanoapps.ar es exclusivamente la plataforma/SuperAdmin.
  if (isPlatformHost) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/superadmin");
      return NextResponse.redirect(loginUrl);
    }

    if (path === "/") {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    }

    // Evita que el dominio reservado de plataforma intente renderizar el ERP de un tenant.
    if (!path.startsWith("/superadmin")) {
      return NextResponse.redirect(new URL("/superadmin", request.url));
    }

    return NextResponse.next();
  }

  // Los hosts de tenant nunca deben exponer el panel de plataforma.
  if (path.startsWith("/superadmin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    if (path !== "/") {
      loginUrl.searchParams.set("redirect", path);
    }
    return NextResponse.redirect(loginUrl);
  }

  // El router compartido debe preservar Host / x-forwarded-host.
  // Copiamos el host resuelto para Server Components y Server Actions.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-host", host || "localhost");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
