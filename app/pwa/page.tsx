import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import PwaHomeClient from "./PwaHomeClient";

export default async function PWARootPage() {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || 'Vendedor Invitado';

    return <PwaHomeClient userName={userName} />;
}