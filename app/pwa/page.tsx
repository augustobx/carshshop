import { getLoggedUser } from "@/lib/user-auth";
import PwaHomeClient from "./PwaHomeClient";

export default async function PWARootPage() {
    const user = await getLoggedUser();
    const userName = user?.name || 'Vendedor Invitado';

    return <PwaHomeClient userName={userName} />;
}