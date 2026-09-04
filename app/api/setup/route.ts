import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';
import { hashUserPassword } from '@/lib/user-auth';

export async function GET() {
  try {
    const hashedPassword = await hashUserPassword('123456');

    // 1. Crear usuario admin si no existe
    const user = await db.user.upsert({
      where: { email: 'admin@carshop.com' },
      update: {
        passwordHash: hashedPassword,
      },
      create: {
        name: 'Administrador Master',
        email: 'admin@carshop.com',
        passwordHash: hashedPassword,
        isSuperAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: '✅ Usuario admin@carshop.com creado/actualizado con éxito. La clave es: 123456',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}