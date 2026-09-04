'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  verifyUserPassword,
  createUserSession,
  deleteUserSession,
  getLoggedUser,
  AuthenticatedUser,
} from '@/lib/user-auth';
import { normalizeHostname, resolveTenantByHostname } from '@/lib/tenant-context';
import { isPlatformHostname } from '@/lib/domain-config';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: { email: string; password: string }) {
  try {
    const { email, password } = formData;
    if (!email || !password) {
      return { success: false, error: 'Ingresá tu correo y contraseña.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          where: { isActive: true },
          include: { tenant: true },
        },
      },
    });

    if (!user || !(await verifyUserPassword(password, user.passwordHash))) {
      return { success: false, error: 'Credenciales inválidas.' };
    }

    const requestHeaders = await headers();
    const host = normalizeHostname(
      requestHeaders.get('x-forwarded-host') ||
      requestHeaders.get('x-tenant-host') ||
      requestHeaders.get('host') ||
      ''
    );

    if (isPlatformHostname(host)) {
      if (!user.isSuperAdmin) {
        return { success: false, error: 'Ingresá desde el dominio de tu concesionaria.' };
      }
      await createUserSession(user.id);
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: true,
          role: null,
          membershipsCount: user.memberships.length,
          homePath: '/superadmin',
        },
      };
    }

    const resolved = await resolveTenantByHostname(host);
    if (!resolved.success) {
      return { success: false, error: 'No se pudo identificar la concesionaria de acceso.' };
    }

    const membership = user.memberships.find((m) => m.tenantId === resolved.tenant.id);
    if (!user.isSuperAdmin && !membership) {
      return { success: false, error: 'Tu usuario no tiene acceso a esta concesionaria.' };
    }

    await createUserSession(user.id);
    const role = user.isSuperAdmin ? 'OWNER' : membership?.role || null;
    const homePath = !user.isSuperAdmin && role === 'VENDEDOR' ? '/pwa/dashboard' : '/';

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: user.isSuperAdmin,
        role,
        membershipsCount: user.memberships.length,
        homePath,
      },
    };
  } catch (error: any) {
    console.error('Error en loginAction:', error);
    return { success: false, error: 'Ocurrió un error al iniciar sesión.' };
  }
}

export async function logoutAction() {
  await deleteUserSession();
  revalidatePath('/');
  return { success: true };
}

export async function getCurrentUserAction(): Promise<AuthenticatedUser | null> {
  return await getLoggedUser();
}
