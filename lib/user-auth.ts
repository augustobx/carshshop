import "server-only";

import crypto from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { RolMembresia } from "@prisma/client";

const scryptAsync = promisify(crypto.scrypt);
const USER_SESSION_COOKIE = "onlycars_user_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  isSuperAdmin: boolean;
  memberships: Array<{
    tenantId: string;
    role: RolMembresia;
    locationId: string | null;
    commissionPct: number | null;
    tenant: {
      id: string;
      slug: string;
      name: string;
      status: string;
    };
  }>;
}

/**
 * Hash seguro de contraseña mediante scrypt nativo
 */
export async function hashUserPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

/**
 * Verificación de contraseña contra hash scrypt con tiempo constante
 */
export async function verifyUserPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith("scrypt$")) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  const actual = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Crea una sesión segura en base de datos y setea la cookie HttpOnly
 */
export async function createUserSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHashed = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.userSession.create({
    data: {
      userId,
      tokenHash: tokenHashed,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

/**
 * Elimina la sesión actual tanto de la base de datos como de la cookie
 */
export async function deleteUserSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.userSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }
  cookieStore.delete(USER_SESSION_COOKIE);
}

/**
 * Retorna el usuario logueado actualmente con sus membresías y tenants asociados
 */
export async function getLoggedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          memberships: {
            where: { isActive: true },
            include: {
              tenant: {
                select: { id: true, slug: true, name: true, status: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    phone: session.user.phone,
    isSuperAdmin: session.user.isSuperAdmin,
    memberships: session.user.memberships.map((m) => ({
      tenantId: m.tenantId,
      role: m.role,
      locationId: m.locationId,
      commissionPct: m.commissionPct,
      tenant: m.tenant,
    })),
  };
}

/**
 * Guard de SuperAdmin para NanoLabs: arroja error si el usuario no es SuperAdmin
 */
export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
  const user = await getLoggedUser();
  if (!user || !user.isSuperAdmin) {
    throw new Error("UNAUTHORIZED_SUPERADMIN: Acceso exclusivo a Plataforma NanoLabs.");
  }
  return user;
}

/**
 * Guard para acciones de tenant: verifica rol del usuario dentro de la concesionaria
 */
export async function requireTenantRole(
  tenantId: string,
  allowedRoles: RolMembresia[] = [
    RolMembresia.OWNER,
    RolMembresia.MANAGER,
    RolMembresia.VENDEDOR,
    RolMembresia.ADMINISTRATIVO,
  ]
): Promise<{ user: AuthenticatedUser; role: RolMembresia }> {
  const user = await getLoggedUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Debes iniciar sesión.");
  }

  // SuperAdmin siempre tiene acceso de plataforma concedido
  if (user.isSuperAdmin) {
    return { user, role: RolMembresia.OWNER };
  }

  const membership = user.memberships.find((m) => m.tenantId === tenantId);
  if (!membership) {
    throw new Error("FORBIDDEN: No tienes acceso a esta concesionaria.");
  }

  if (!allowedRoles.includes(membership.role)) {
    throw new Error(`FORBIDDEN_ROLE: Tu rol (${membership.role}) no tiene permisos para esta acción.`);
  }

  return { user, role: membership.role };
}
