import { getDashboardData } from "@/actions/dashboard";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  return <DashboardClient data={data} />;
}
