"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Car, 
  Users, 
  LayoutDashboard, 
  Wallet, 
  Settings,
  ShoppingCart
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const routes = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventario", label: "Inventario", icon: Car },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/ventas/nueva", label: "Ventas", icon: ShoppingCart },
    { href: "/finanzas", label: "Finanzas", icon: Wallet },
    { href: "/configuracion", label: "Ajustes", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 border-r bg-background print:hidden">
      <div className="flex h-16 items-center px-6 border-b">
        <Car className="mr-2 h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">CarShop ERP</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-2 px-4">
          {routes.map((route) => {
            const Icon = route.icon;
            const active = pathname?.startsWith(route.href);
            
            return (
              <Link 
                key={route.href} 
                href={route.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {route.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
