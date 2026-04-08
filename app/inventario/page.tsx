import { getVehiculos } from "@/actions/vehiculos";
import { InventarioClient } from "./InventarioClient";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const vehiculos = await getVehiculos();
  return <InventarioClient vehiculos={vehiculos} />;
}
