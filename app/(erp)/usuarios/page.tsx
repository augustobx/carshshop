import { prisma as db } from "@/lib/prisma";
import UsuariosClient from "./UsuariosClient";

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
    // Buscamos los usuarios, omitiendo traer el campo password por seguridad
    const usuarios = await db.usuario.findMany({
        select: {
            id_usuario: true,
            nombre: true,
            email: true,
            rol: true,
        },
        orderBy: {
            id_usuario: 'desc'
        }
    });

    return <UsuariosClient usuarios={usuarios} />;
}