import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // 1. Si un VENDEDOR intenta entrar al ERP de escritorio, lo mandamos a la PWA
        if (token?.rol === "Vendedor" && !path.startsWith("/pwa") && path !== "/login") {
            return NextResponse.redirect(new URL("/pwa", req.url));
        }

        // 2. Eliminamos la restricción del Admin. Ahora el Admin puede usar tanto el ERP como la PWA libremente.
    },
    {
        callbacks: {
            // Si esto devuelve true, la persona está logueada. Si devuelve false, lo patea a /login
            authorized: ({ token }) => !!token,
        },
    }
);

// Protegemos todas las rutas excepto el login, las imágenes públicas y la API de autenticación
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|logo.*).*)"],
};