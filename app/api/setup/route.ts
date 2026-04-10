import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        // Encriptamos la clave "123456" de forma nativa en el servidor
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Upsert: Si el usuario existe, le actualiza la clave. Si no, lo crea.
        await db.usuario.upsert({
            where: { email: 'admin@carshop.com' },
            update: {
                password: hashedPassword,
                rol: 'Admin'
            },
            create: {
                nombre: 'Administrador Master',
                email: 'admin@carshop.com',
                password: hashedPassword,
                rol: 'Admin'
            }
        });

        return NextResponse.json({
            success: true,
            message: '✅ Usuario admin@carshop.com creado/actualizado con éxito. La clave es: 123456'
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}