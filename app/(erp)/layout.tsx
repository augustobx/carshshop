import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { getTenantContext } from "@/lib/tenant-context";
import { getLoggedUser } from "@/lib/user-auth";

export default async function ERPLayout({ children }: { children: React.ReactNode }) {
  let tenant;
  try {
    tenant = await getTenantContext();
  } catch (err) {
    // Si falla la resolución de tenant, creamos o usamos fallback seguro
    tenant = {
      id: "demo",
      name: "OnlyCars Dealership",
      slug: "demo",
      settings: {
        appName: "OnlyCars ERP",
        logoUrl: null,
        primaryColor: "#2563eb",
        secondaryColor: "#0f172a",
        dolarActual: 1400,
        tipoDolar: "blue",
      },
    };
  }

  const user = await getLoggedUser();

  const initialDolar = tenant.settings?.dolarActual ?? 1400;
  const initialTipo = tenant.settings?.tipoDolar ?? "blue";
  const initialLogo = tenant.settings?.logoUrl ?? null;
  const brandPrimary = tenant.settings?.primaryColor ?? "#2563eb";

  const themeStyles = `
    :root {
      --color-brand: ${brandPrimary};
      --color-brand-hover: ${brandPrimary}ee;
      --color-brand-ring: ${brandPrimary}33;
    }
  `;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {themeStyles && <style dangerouslySetInnerHTML={{ __html: themeStyles }} />}

      {/* Sidebar solo visible en el ERP */}
      <div className="print:hidden">
        <Sidebar
          tenantName={tenant.name}
          tenantLogo={initialLogo}
          isSuperAdmin={user?.isSuperAdmin || false}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="print:hidden">
          <TopBar
            initialDolar={initialDolar}
            initialTipo={initialTipo}
            initialLogo={initialLogo}
            tenantName={tenant.name}
            isSuperAdmin={user?.isSuperAdmin || false}
          />
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}