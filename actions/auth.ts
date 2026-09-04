'use server';

import { prisma } from '@/lib/prisma';
import {
  hashUserPassword,
  verifyUserPassword,
  createUserSession,
  deleteUserSession,
  getLoggedUser,
  AuthenticatedUser,
} from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: { email: string; password: string }) {
  try {
    const { email, password } = formData;
    if (!email || !password) {
      return { success: false, error: 'Ingresa tu correo y contraseña.' };
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

    if (!user) {
      return { success: false, error: 'Credenciales inválidas.' };
    }

    const isValid = await verifyUserPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Credenciales inválidas.' };
    }

    // Crear sesión HttpOnly
    await createUserSession(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: user.isSuperAdmin,
        membershipsCount: user.memberships.length,
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
